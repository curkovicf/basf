# Builds the API from the monorepo root:
#   docker build -f apps/server/nodejs/api/Dockerfile .
# The import has its own image (apps/server/nodejs/catalog-import/Dockerfile); this one
# carries only what serving HTTP needs. The Prisma client runs engine-free through the pg
# driver adapter, so neither the Prisma CLI nor its engines are installed here.
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json nx.json tsconfig.base.json prisma.config.ts ./
COPY libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/schema.prisma ./libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/schema.prisma
COPY libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/migrations ./libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/migrations
RUN npm ci --legacy-peer-deps && npx prisma generate
COPY . .
RUN npx nx build api --configuration=production --skip-nx-cache
# The bundle's package.json lists only what main.js imports (plus @prisma/client, declared
# by the shared infrastructure library because the generated client is gitignored).
# `--omit=peer` keeps npm from pulling in the Prisma CLI, a peer of @prisma/client.
RUN cd dist/apps/api && npm install --omit=dev --omit=peer --ignore-scripts --no-audit --no-fund

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/dist/apps/api ./
USER node
EXPOSE 3100
CMD ["node", "main.js"]
