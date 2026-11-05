# api

The NestJS HTTP API. It is the only process the browser talks to: it searches the catalogue, serves product detail and reviews, and takes the one public write, a review.

|            |                                           |
| ---------- | ----------------------------------------- |
| **Path**   | `apps/server/nodejs/api`                  |
| **Tags**   | `platform:server`, `type:app`             |
| **Port**   | `3100` (`API_PORT`), global prefix `/api` |
| **Serve**  | `npm run finder:api`                      |
| **Debug**  | `9229` (`npm run finder:api:debug`)       |
| **Image**  | `apps/server/nodejs/api/Dockerfile`, API only; no Prisma CLI |

## Shape

`main.ts` only bootstraps. All behaviour lives in `libs/server/nodejs/api`, composed by `ServerShellModule` (`libs/server/nodejs/api/shell`), which also owns `configureApp` (prefix, helmet, trust proxy, validation) so the integration tests run the same pipeline.

Every feature is a clean-architecture slice, `domain → application → infrastructure → api`, wired by a `shell` module. Boundaries are enforced by `@nx/enforce-module-boundaries` (see the root `eslint.config.mjs`).

| Feature slice    | Owns                                                                          |
| ---------------- | ----------------------------------------------------------------------------- |
| `catalog`        | Search with facets, product detail, catalogue freshness                       |
| `reviews`        | Reading reviews and the throttled write path, keeping rating totals in step   |
| `health`         | `GET /health` for the container healthcheck                                   |
| `catalog-import` | The nightly import. Composed by the `catalog-import` app, never by this one   |

## HTTP surface (all under `/api`)

| Route                               | Purpose                                               |
| ----------------------------------- | ----------------------------------------------------- |
| `GET products`                      | Search, filter, sort, page, plus filter counts        |
| `GET products/:sku`                 | One product. Still works for discontinued products    |
| `GET products/:sku/reviews`         | A page of reviews, newest first                       |
| `POST products/:sku/reviews`        | Create a review; `REVIEW_RATE_LIMIT` per IP per minute |
| `GET catalog/status`                | When the catalogue was last imported                  |
| `GET health`                        | 200 while Postgres answers, 503 otherwise             |

## Environment

Validated at startup (`libs/server/nodejs/api/shared/infrastructure`): `DATABASE_URL` (required), `API_PORT`, `REVIEW_RATE_LIMIT`, `TRUST_PROXY`. Locally they come from the root `.env`; in containers from Compose.
