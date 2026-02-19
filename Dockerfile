FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

RUN npm run prisma:generate

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
