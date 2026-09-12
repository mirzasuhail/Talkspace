FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN npm install

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

RUN npm run build --workspace=@talksy/shared
RUN cd apps/server && npx prisma generate && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/server ./apps/server

EXPOSE 4000

CMD ["node", "apps/server/dist/index.js"]
