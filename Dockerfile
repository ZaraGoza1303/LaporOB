# BUILD
FROM node:26.5.0-alpine3.24 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . . 

RUN npm run build

# JALANIN
FROM node:26.5.0-alpine3.24 

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8000

CMD ["node", "dist/index.js"]