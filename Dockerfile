# syntax=docker/dockerfile:1

# Multi-stage. O Dockerfile anterior nunca rodava `npm run build`, então o
# `next start` do compose de produção não achava build em .next/ e o container
# entrava em loop de restart. Agora o build acontece no stage `builder` e o
# `runner` recebe só o resultado + dependências de produção.
#
# Em dev nada disso é usado: o docker-compose.yml para no stage `deps` e roda
# `next dev` com o código montado por bind mount.

# ---- deps: todas as dependências, devDependencies incluídas (o build precisa)
FROM node:20-alpine AS deps
# Prisma precisa de openssl pra escolher/carregar o query engine; a imagem
# alpine não traz. libc6-compat cobre binários que esperam glibc.
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

# ---- builder: compila o Next
FROM deps AS builder
WORKDIR /app
COPY . .
# Só precisa ser uma URL postgres sintaticamente válida: nem `prisma generate`
# nem `next build` abrem conexão com o banco. A URL real chega por env em
# runtime, vinda do .env da VM.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
# O cache do bundler mora dentro de .next e não tem uso nenhum em runtime —
# são centenas de MB a menos na imagem final.
RUN rm -rf .next/cache

# ---- prod-deps: node_modules sem devDependencies
FROM node:20-alpine AS prod-deps
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
# Regenera o client dentro DESTE node_modules — o generate do stage `deps`
# escreveu no node_modules dele, que não vai pra imagem final.
RUN npx prisma generate

# ---- runner: só o necessário pra servir
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Rodar como root num container exposto à internet é risco desnecessário.
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder  --chown=nextjs:nodejs /app/.next        ./.next
COPY --chown=nextjs:nodejs public ./public
COPY --chown=nextjs:nodejs prisma ./prisma
COPY --chown=nextjs:nodejs package.json next.config.ts ./

USER nextjs

EXPOSE 3000

# `migrate deploy` é idempotente (aplica só migrations pendentes) e roda antes
# do servidor aceitar tráfego. O SEED NÃO roda aqui: ele é destrutivo, apaga
# contas de usuário, e só deve ser executado manualmente uma vez — ver
# docs/deploy.md.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start -- -H 0.0.0.0 -p 3000"]
