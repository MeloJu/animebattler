FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Only needed so `prisma generate` can read a value at build time; actual DB
# connection is provided at runtime via docker-compose's environment.
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev -- -H 0.0.0.0"]
