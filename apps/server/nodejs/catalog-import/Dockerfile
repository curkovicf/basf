# Builds the one-shot import from the monorepo root:
#   docker build -f apps/server/nodejs/catalog-import/Dockerfile .
# Compose runs it as the `seed` service: migrations first, then the import. It is the only
# image that carries the Prisma CLI, because `prisma migrate deploy` needs it.
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json nx.json tsconfig.base.json prisma.config.ts ./
COPY libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/schema.prisma ./libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/schema.prisma
COPY libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/migrations ./libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/migrations
RUN npm ci --legacy-peer-deps && npx prisma generate
COPY . .
RUN npx nx build catalog-import --configuration=production --skip-nx-cache
# The bundle's package.json lists what main.js imports plus `prisma`, which the app's own
# package.json declares. `npm install`, not `npm ci`: the pruned lock file Nx writes leaves
# out optional peers of the Prisma CLI, which `npm ci` refuses. Install scripts stay on:
# that is when the CLI fetches the schema engine, and the container runs as a user who
# cannot write there later.
RUN cd dist/apps/catalog-import && npm install --omit=dev --no-audit --no-fund

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/dist/apps/catalog-import ./
# `prisma migrate deploy` reads the config and the migrations from the workspace layout.
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/migrations ./libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/migrations
COPY --from=build /app/libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/schema.prisma ./libs/server/nodejs/api/shared/infrastructure/src/lib/prisma/schema.prisma
USER node
# Override the file or add --force with: docker compose run --rm seed node main.js /data/x.csv --force
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node main.js /data/products.csv"]
