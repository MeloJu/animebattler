# Deploy na Oracle Cloud — checklist manual

Tudo que dá pra automatizar já está no repo (schema Postgres, CI, CD,
Terraform). O que resta aqui exige a sua conta Oracle/GitHub e não tem como
ser feito por fora.

> Provider GCP? Ver [docs/deploy-gcp.md](deploy-gcp.md) em vez deste.

## 1. Gerar a API key da Oracle Cloud

O Terraform precisa de uma credencial pra falar com a sua conta. No console
OCI: **Profile (canto superior direito) → User Settings → API Keys → Add
API Key → Generate API Key Pair**. Baixe a chave privada (`.pem`) e guarde
em `~/.oci/oci_api_key.pem`. A tela final mostra um bloco de config com
`tenancy`, `user`, `fingerprint`, `region`.

Coloque esses valores em `~/.oci/config` (formato padrão do OCI CLI/SDK) —
é de lá que tanto o provider quanto o backend de state leem a credencial,
então ela fica num lugar só, fora do repositório:

```ini
[DEFAULT]
user=ocid1.user.oc1..xxxxx
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..xxxxx
region=sa-saopaulo-1
key_file=C:/Users/seu-usuario/.oci/oci_api_key.pem
```

## 2. Criar o bucket do state remoto (uma vez só)

O `tfstate` não deve viver só no seu disco: se ele sumir ou corromper, o
Terraform perde o rastro da infra que existe de verdade. O bucket que
guarda ele nasce num root separado — ele não pode morar no mesmo root cujo
state ele guarda (um `destroy` derrubaria o backend embaixo dos próprios
pés):

```bash
cd infra/oracle-bootstrap
cp terraform.tfvars.example terraform.tfvars   # preencha o compartment_ocid
terraform init
terraform apply
terraform output        # anote bucket_name e namespace
```

O bucket sai com versionamento ligado, o que permite recuperar uma versão
anterior do state se um apply for interrompido no meio.

## 3. Provisionar a VM

```bash
cd infra/oracle
cp terraform.tfvars.example terraform.tfvars   # identificadores, sem credencial
cp backend.hcl.example backend.hcl             # bucket/namespace do passo 2

# chave SSH só pra essa VM, se ainda não tiver uma
ssh-keygen -t ed25519 -f ~/.ssh/animebattler -C "animebattler-deploy"

terraform init -backend-config=backend.hcl
terraform validate
terraform apply
```

O `apply` cria a VCN, security list (22/80/443), a instância Always Free e
já instala Docker via cloud-init. No fim, ele imprime o `public_ip` — anota
esse IP, é o `SITE_ADDRESS` e o `DEPLOY_HOST`.

### Qual shape usar

A `var.instance_shape` decide, e a escolha importa:

| Shape | Recursos | Arquitetura | Disponibilidade |
|---|---|---|---|
| `VM.Standard.E2.1.Micro` | 1/8 OCPU, 1GB RAM (até 2 instâncias) | **amd64** | Cota própria, sem contenção conhecida |
| `VM.Standard.A1.Flex` | até 2 OCPU / 12GB (`instance_ocpus`/`instance_memory_gb`) | **arm64** | Muito disputada — dá "Out of host capacity" por horas ou dias |

A Ampere é bem mais potente, mas a cota Always Free dela é concorrida: em
`sa-saopaulo-1` chegamos a 200+ tentativas ao longo de 21h sem conseguir.
A `E2.1.Micro` subiu de primeira, em 51 segundos, porque a cota é separada.

> ⚠️ **A arquitetura muda conforme o shape.** A `E2.1.Micro` é amd64 e a
> Ampere é arm64 — a imagem Docker publicada pelo CD precisa bater com a
> escolha aqui, senão o container nem sobe.

## 4. Criar o `.env` na VM

Só o `.env` precisa ser criado à mão — o `docker-compose.prod.yml` e o
`Caddyfile` são enviados pela própria pipeline a cada deploy, então não
precisam de `scp` manual (e não ficam desatualizados na VM).

```bash
ssh -i ~/.ssh/animebattler ubuntu@<public_ip>
cd ~/animebattler          # o cloud-init já criou esta pasta
nano .env                  # conteúdo: ver .env.prod.example
```

**Atenção ao `COOKIE_SECURE`.** Se `SITE_ADDRESS` for o IP puro, o Caddy
serve HTTP sem TLS e o navegador descarta o cookie de sessão marcado como
`Secure` — o login falha sem exibir erro nenhum. Nesse caso use
`COOKIE_SECURE=false`. Com domínio de verdade, deixe `true`.

Se depois de tudo a porta 80/443 não responder de fora mesmo com a
security list liberada, é o gotcha clássico da imagem Ubuntu da Oracle: o
iptables interno dela também bloqueia por padrão. O cloud-init já libera
isso automaticamente, mas se precisar checar/corrigir manualmente:

```bash
sudo iptables -L INPUT -n --line-numbers   # confirma se 80/443 estão ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 5. Cadastrar os secrets no GitHub

```bash
gh secret set DEPLOY_HOST --body "<public_ip>"
gh secret set DEPLOY_USER --body "ubuntu"
gh secret set DEPLOY_SSH_KEY < ~/.ssh/animebattler
```

(Ou pela UI: repo → Settings → Secrets and variables → Actions.)

Não precisa de token pro GHCR: o workflow autentica a VM no registry com o
`GITHUB_TOKEN` do próprio run, que expira quando o job acaba — melhor que
deixar um PAT permanente guardado na VM.

## 6. Primeiro deploy

Aba **Actions** do repo → workflow **Deploy** → **Run workflow**. Ele:

1. builda a imagem na arquitetura da VM (ver a tabela de shapes no passo 3 —
   `E2.1.Micro` é amd64, Ampere é arm64; imagem da arquitetura errada não
   roda);
2. publica no GHCR com duas tags: `latest` e o SHA do commit;
3. envia `docker-compose.prod.yml` e `Caddyfile` pra VM;
4. autentica no GHCR, dá `pull` e sobe tudo, fixando a imagem no SHA;
5. **espera o healthcheck (`/api/health`) passar** antes de dar o job por
   concluído — se o container entrar em loop de restart, o deploy falha e
   imprime os logs em vez de ficar verde mentindo.

## 7. Popular o catálogo (uma vez só)

O `migrate deploy` cria as tabelas vazias, mas não insere os 49 personagens.
Sem isso o cadastro funciona e não há o que selecionar. Rode **uma vez**,
logo depois do primeiro deploy:

```bash
ssh ubuntu@<public_ip>
cd ~/animebattler
docker compose -f docker-compose.prod.yml exec -e SEED_FORCE=true app npm run prisma:seed
```

> ⚠️ **O seed é destrutivo.** Ele apaga todos os usuários, sessões, batalhas
> e progresso antes de repovoar o catálogo. Por isso ele se recusa a rodar
> com `NODE_ENV=production` a menos que você passe `SEED_FORCE=true`
> explicitamente. Só faça isso com o banco vazio. Depois que houver
> jogadores cadastrados, rodar esse comando apaga a conta de todos eles.

## 8. Deploy automático

Depois de confirmar que funcionou, edite `.github/workflows/deploy.yml` e
adicione o gatilho automático (a branch principal aqui é `master`, não
`main`):

```yaml
on:
  workflow_dispatch:
  push:
    branches: [master]
```

## 9. (Opcional, mas recomendado) Domínio próprio

Sem domínio, `SITE_ADDRESS` fica só o IP, o Caddy serve HTTP puro e você
fica preso a `COOKIE_SECURE=false`. Com um domínio apontando pro IP
(registro `A`), o Caddy detecta sozinho e emite HTTPS via Let's Encrypt —
aí é só trocar `SITE_ADDRESS` e voltar `COOKIE_SECURE=true` no `.env`.

Não precisa comprar: um subdomínio grátis do [DuckDNS](https://www.duckdns.org)
(`animebattler.duckdns.org`) apontando pro IP público já resolve e o Caddy
emite certificado normalmente.

## Cuidado ao rodar `docker compose` na mão na VM

O `docker-compose.prod.yml` resolve a imagem como `${IMAGE_TAG:-latest}`, e o
deploy grava o `IMAGE_TAG` no `.env` da VM justamente para esse fallback nunca
ser usado.

Se por algum motivo o `.env` ficar sem `IMAGE_TAG`, um `docker compose up`
manual sobe a tag `latest` — que na VM aponta para a **primeira** imagem já
baixada, porque o deploy só dá `pull` da tag do SHA. Produção volta em
silêncio para uma versão antiga: sem erro, sem log, com o healthcheck passando
normalmente. O sintoma aparece como rota nova retornando 404.

Se suspeitar disso, compare as imagens:

```bash
docker images ghcr.io/<owner>/animebattler --format '{{.Tag}}	{{.CreatedSince}}	{{.ID}}'
```

Se o `latest` tiver o mesmo ID de uma tag antiga, é isso. A correção é apontar
o `IMAGE_TAG` do `.env` para o SHA desejado e recriar o container.

## Destruir tudo

Pra não deixar nada rodando (a VM em si é grátis pra sempre no Always
Free, mas é bom saber que dá pra desmontar e remontar à vontade — é a
graça do Terraform):

```bash
cd infra/oracle
terraform destroy
```

O bucket de state é um root à parte e sobrevive de propósito — destrua ele
só se for abandonar o projeto na Oracle de vez (e depois de conferir que
não sobrou nada rastreado no state):

```bash
cd infra/oracle-bootstrap
terraform destroy
```
