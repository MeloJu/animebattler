#!/usr/bin/env bash
# Sobe a imagem de produção contra um Postgres limpo e verifica que ela
# realmente serve tráfego — não só que compilou.
#
#   bash scripts/smoke-test.sh [imagem]     (padrão: animebattler:ci)
#
# Existe porque `docker build` passar não prova quase nada. A imagem antiga
# buildava normalmente e mesmo assim entrava em loop de restart em produção
# (faltava o `npm run build`), e o healthcheck ficava eternamente unhealthy
# porque `localhost` resolve pra IPv6 no Alpine enquanto o Next escuta em
# IPv4. Os dois passariam num job que só builda.
set -euo pipefail

IMAGE="${1:-animebattler:ci}"
NET=smoke-net
DB=smoke-db
APP=smoke-app
PORT=3999
BASE="http://localhost:$PORT"
SEED_LOG="$(mktemp)"
COOKIE_JAR="$(mktemp)"

cleanup() {
  docker rm -f "$APP" "$DB" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
  rm -f "$SEED_LOG" "$COOKIE_JAR"
}
trap cleanup EXIT

fail() {
  echo "✖ $1"
  echo "--- últimos logs do app ---"
  docker logs "$APP" 2>&1 | tail -50 || true
  exit 1
}

echo "Testando imagem: $IMAGE"
docker network create "$NET" >/dev/null

docker run -d --name "$DB" --network "$NET" \
  -e POSTGRES_USER=animebattler \
  -e POSTGRES_PASSWORD=smoke \
  -e POSTGRES_DB=animebattler \
  postgres:16-alpine >/dev/null

# Os laços abaixo usam `if` em vez de `cmd && break`: sob `set -e`, uma lista
# `cmd && break` que falha devolve status não-zero e derruba o script — e
# falhar é o estado normal enquanto o serviço ainda está subindo. Condição de
# `if` é isenta do `set -e`.
echo "Aguardando o Postgres..."
for i in $(seq 1 30); do
  if docker exec "$DB" pg_isready -U animebattler >/dev/null 2>&1; then break; fi
  if [ "$i" -eq 30 ]; then echo "✖ Postgres não subiu"; exit 1; fi
  sleep 2
done

docker run -d --name "$APP" --network "$NET" -p "$PORT:3000" \
  -e DATABASE_URL="postgresql://animebattler:smoke@$DB:5432/animebattler?schema=public" \
  -e COOKIE_SECURE=false \
  "$IMAGE" >/dev/null

# Cobre o `prisma migrate deploy` do CMD, que roda antes do servidor existir.
echo "Aguardando o app (migrate deploy + next start)..."
for i in $(seq 1 60); do
  if curl -fsS "$BASE/api/health" >/dev/null 2>&1; then break; fi
  if [ "$i" -eq 60 ]; then fail "o app não respondeu em /api/health"; fi
  sleep 2
done

# 1. health de verdade: o endpoint consulta o banco, então isso também prova
#    que as migrations rodaram — inclusive na ordem certa, já que este Postgres
#    sobe do zero a cada execução — e que a conexão está de pé.
body="$(curl -fsS "$BASE/api/health")"
echo "$body" | grep -q '"database":"up"' || fail "health respondeu sem banco: $body"
echo "✔ /api/health — $body"

# 2. a trava do seed continua de pé. É ela que impede um `prisma:seed`
#    acidental de apagar todas as contas e progresso em produção. Se alguém
#    removê-la num refactor, o CI tem que falhar.
#
#    Precisa vir ANTES do seed forçado abaixo: uma vez populado, não dá mais
#    pra distinguir "a trava funcionou" de "não tinha nada pra apagar".
if docker exec "$APP" npm run prisma:seed >"$SEED_LOG" 2>&1; then
  fail "o seed RODOU com NODE_ENV=production — a trava de proteção sumiu"
fi
grep -q "Seed abortado" "$SEED_LOG" || fail "seed falhou por outro motivo: $(tail -3 "$SEED_LOG")"
echo "✔ trava do seed ativa"

# 3. o seed em si funciona. Vale testar porque é exatamente este comando que
#    popula o catálogo em produção depois do primeiro deploy — se ele quebrar,
#    o jogo sobe sem personagem nenhum.
docker exec -e SEED_FORCE=true "$APP" npm run prisma:seed >"$SEED_LOG" 2>&1 ||
  fail "seed forçado falhou: $(tail -5 "$SEED_LOG")"
echo "✔ seed populou o banco — $(grep -o 'Seeded .*' "$SEED_LOG")"

# 3b. o catalog:sync roda em cima do seed, que é a MESMA sequência do deploy.
#     O seed cria só o arco de Bleach; tudo que veio depois — segundo arco,
#     personagens novos, traços, transformações — entra por aqui. Testar isto
#     não é zelo: o arco de Jujutsu subiu ausente para produção porque o sync
#     o pulava em silêncio, e nada no caminho reclamava.
docker exec "$APP" npm run catalog:sync >"$SEED_LOG" 2>&1 ||
  fail "catalog:sync falhou: $(tail -5 "$SEED_LOG")"
echo "✔ catalog:sync aplicou o catálogo"

# 4. páginas renderizam (exercita SSR + Prisma no caminho da requisição)
for path in / /login /register /characters; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")"
  [ "$code" = "200" ] || fail "$path respondeu $code"
  echo "✔ $path 200"
done

# 5. autenticação de ponta a ponta: registra um usuário exatamente como faria
#    um navegador sem JavaScript — lê o id do server action direto do HTML e
#    envia o form multipart.
#
#    A asserção do /dashboard logo abaixo é o que fecha o buraco do
#    COOKIE_SECURE: o curl se recusa a reenviar um cookie marcado como Secure
#    por uma conexão HTTP. Se alguém voltar a fixar `secure: true`, o cookie
#    não é reenviado, o /dashboard responde 307 e o teste falha — que é
#    exatamente o sintoma de login quebrado numa VM servida por IP puro.
action_id="$(curl -s "$BASE/register" | grep -o 'name="\$ACTION_ID_[^"]*"' | head -1 | sed 's/^name="//; s/"$//')"
[ -n "$action_id" ] || fail "não encontrei o \$ACTION_ID no form de registro"

# O header Origin é obrigatório: o Next 16 recusa Server Actions sem ele
# ("Missing `origin` header from a forwarded Server Actions request") como
# proteção contra CSRF. Um navegador sempre manda; o curl não, a menos que
# peçam.
code="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/register" \
  -H "Origin: $BASE" \
  -F "$action_id=" \
  -F "username=smokeuser" \
  -F "email=smoke@test.local" \
  -F "password=smokepass123" \
  -c "$COOKIE_JAR")"
[ "$code" = "303" ] || fail "registro respondeu $code (esperado 303)"
grep -q session "$COOKIE_JAR" || fail "registro não devolveu cookie de sessão"
echo "✔ registro criou sessão"

code="$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" "$BASE/dashboard")"
[ "$code" = "200" ] || fail "/dashboard com sessão respondeu $code (esperado 200)"
echo "✔ sessão persiste em /dashboard"

code="$(curl -s -o /dev/null -w '%{http_code}' "$BASE/dashboard")"
[ "$code" = "307" ] || fail "/dashboard anônimo respondeu $code (esperado 307)"
echo "✔ /dashboard bloqueia anônimo"

# Modo história: renderiza a lista de capítulos lida do banco, então cobre de
# uma vez as tabelas novas e a query que deriva bloqueio/progresso.
code="$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" "$BASE/story")"
[ "$code" = "200" ] || fail "/story com sessão respondeu $code (esperado 200)"
# Checa os DOIS arcos. Antes só o de Bleach era verificado, e foi exatamente
# assim que o arco de Jujutsu subiu ausente para produção sem ninguém notar:
# o sync o pulava em silêncio e o smoke test não tinha como perceber.
html="$(curl -s -b "$COOKIE_JAR" "$BASE/story")"
echo "$html" | grep -q 'Soul Society' || fail "/story não listou o capítulo Soul Society"
echo "$html" | grep -q 'Shibuya' || fail "/story não listou o capítulo Incidente de Shibuya"
echo "✔ /story lista os dois arcos"

echo ""
echo "✔ smoke test passou"
