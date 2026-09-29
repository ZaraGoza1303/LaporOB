# Satu-satunya Dockerfile. Pilih target sesuai environment:
#   dev  -> hot-reload + migrate + seed (dipakai docker-compose.dev.yml)
#   prod -> build statis, migrate tanpa seed (dipakai docker-compose.yml / staging / prod)

# BASE — layer shared
FROM node:26.5.0-alpine3.24 AS base

RUN apk add --no-cache tzdata

WORKDIR /app

COPY package*.json ./

RUN npm install

# DEV
FROM base AS dev

COPY . .

RUN npx prisma generate

EXPOSE 8000

CMD npx prisma migrate deploy && npx prisma db seed && npm run dev

# BUILDER — compile TS untuk prod
FROM base AS builder

COPY . .

RUN npx prisma generate

RUN npm run build

# PROD
FROM node:26.5.0-alpine3.24 AS prod

RUN apk add --no-cache tzdata

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/src/generated /app/src/generated
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 8000

CMD sh -c "npx prisma migrate deploy && node dist/index.js"
