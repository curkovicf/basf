# Product Finder

A web app where customers search the specialty chemicals catalogue, filter and sort the results, open a product, share the exact view by link, and read or write reviews. The catalogue is loaded from the nightly PIM export (`data/products.csv`).

| Document | What it covers |
| --- | --- |
| [DECISIONS.md](DECISIONS.md) | Architecture, key decisions and alternatives, assumptions, risks, next steps |
| [AI_USAGE.md](AI_USAGE.md) | How AI tools were used, and where their output was corrected |
| [docs/basf-take-home-assignment/](docs/basf-take-home-assignment/README.md) | The original brief |

## Quick start (Docker only)

**You need:** Docker Desktop, or Docker Engine with the Compose plugin (`docker compose version` prints v2 or later). Nothing else: no Node, no local Postgres.

**1. Start everything**

```bash
docker compose up --build --wait
```

The first run downloads the base images and builds three containers, which takes a few minutes. The command returns when the app is healthy. Later starts take seconds.

**2. Open the app**

**http://localhost:8090**

That's it. Behind the scenes Compose started Postgres, applied the database migrations, imported `data/products.csv` (199 products) and then started the API and the web app.

> A red "Invalid PrimeUI License" notice appears in the corner until a PrimeNG key is set. It doesn't affect how the app works. See [PrimeNG licence](DECISIONS.md#primeng-licence).

**Everyday commands**

| Task | Command |
| --- | --- |
| See the logs | `docker compose logs -f` |
| Stop, keep the data | `docker compose down` |
| Stop and **delete all data, including reviews** | `docker compose down -v` |
| Rebuild after changing code | `docker compose up --build --wait` |
| Re-run the import | `docker compose run --rm seed` |
| Open a database console | `docker compose exec db psql -U finder -d product_finder` |

**If a port is already taken** (`8090` for the web app, `5544` for Postgres): edit `WEB_PORT` or `DB_PORT` in `.env` and start again.

## Run the tests

Unit tests need only Node (see [Run it for development](#run-it-for-development) for the version). Integration tests also need the Postgres container.

```bash
npm ci
npm run db:generate          # generates the Prisma client the backend compiles against; no database needed
npm run test:all             # unit tests (frontend and backend), no database needed

docker compose up -d --wait db
npm run test:int             # integration tests: real API, real migrations, real Postgres
```

The integration tests create and use their own `product_finder_test` database on the same server, so your development data and reviews are never touched. They also run the real migrations on an empty database, which proves the from-scratch path.

Lint, which includes the architecture boundary rules, and formatting:

```bash
npm run lint:all
npm run format
```

## Run it for development

Use this when you're changing code. The API and the web app run on your machine with live reload, and only Postgres runs in Docker.

**You need:** Node.js 24 (`^24.11.0`; `^22.18.0` also works) and Docker. Check with `node -v` and `docker compose version`.

```bash
# 1. Install
npm ci

# 2. Database
docker compose up -d --wait db      # Postgres on localhost:5544
npm run db:generate                 # Prisma client
npm run db:migrate                  # apply the migrations
npm run db:seed                     # import data/products.csv

# 3. Run the API and the web app together, with live reload
npm start
```

Open **http://localhost:4200**. The dev server proxies `/api` to the API on port 3100.

`npm start` frees ports 3100 and 4200, makes sure the database container is up, then serves both apps in one terminal. To run them separately, use `npm run finder:api` and `npm run finder:web` in two terminals. `npm run kill:dev` stops anything left listening on those ports.

Notes:

- The scripts use `cp`, `lsof` and `pkill`, so on Windows use WSL or Git Bash.
- The Docker stack and the dev servers can run at the same time. They share the database container; the dev servers use ports 3100 and 4200, the Docker web app uses 8090.
- Every command is run from the repository root.

## The catalogue import (seed)

The import is a one-shot CLI (`apps/server/nodejs/catalog-import`). Compose runs it as the `seed` service on every `docker compose up`, after the migrations and before the API starts.

```bash
docker compose run --rm seed                           # Docker: migrations + import of data/products.csv
npm run db:seed                                        # local: import data/products.csv
npm run finder:import -- path/to/export.csv --force    # local: another file, with options
```

What the import guarantees:

- **Works on an empty database** after the migrations. The `seed` container runs `prisma migrate deploy` first, so it also works on a brand-new volume.
- **Safe to run any number of times.** Products are upserted by SKU, which is unique in the database. SKUs are normalised (trimmed, upper-cased) and duplicate rows inside a file are collapsed before writing, so a re-run never creates duplicate products. A run on an unchanged file reports `inserted: 0, updated: 0, unchanged: 199`.
- **Never touches user data.** Only PIM-owned columns are written. Reviews and the rating totals on each product are left alone, and a product with reviews cannot be deleted at all (`ON DELETE RESTRICT`).
- **Products missing from the export are delisted, not deleted.** Their reviews and shared links keep working, and they are relisted if they return in a later export.
- **A broken export cannot damage the catalogue.** Wrong headers, a cut-off row or an empty file abort the run before anything is written. An export with under half of the listed products is refused as a probable truncation; add `--force` if the catalogue really did shrink:

  ```bash
  docker compose run --rm seed node main.js /data/products.csv --force
  ```

- **One transaction, one import at a time.** Customers see the old catalogue or the new one, never a mix. Every run, including a refused one, is recorded in the `import_runs` table with its counts and data-quality issues.

The real export has a few data problems (a row without a name, a duplicate SKU with conflicting status, missing years). The import reports each one on the console and keeps going; the rules for how they're handled are listed under [Assumptions](DECISIONS.md#assumptions).

To import a different file under Docker, replace `data/products.csv`, which is mounted into the container.

## Project layout

One Nx workspace holds three deployables and the libraries they share. Apps hold only an entry point; behaviour lives in `libs/`.

```
apps/
  server/nodejs/api/           NestJS API, port 3100, prefix /api            (+ Dockerfile)
  server/nodejs/catalog-import/ the one-shot import; Compose runs it as `seed` (+ Dockerfile)
  server/nodejs/api-e2e/       integration tests against a real Postgres
  web/angular/finder/          Angular web app, port 4200                    (+ Dockerfile, nginx.conf)
libs/
  shared/types/                wire DTOs and enums the API and the web app both compile against
  server/nodejs/api/
    shell/                     ServerShellModule and configureApp: composes the API
    shared/infrastructure/     Prisma schema and migrations, client, env validation, rate limit
    features/<feature>/        catalog, reviews, catalog-import, health, each as
                               domain → application → infrastructure → api, wired by a shell
  web/finder/
    app/                       root component, config, routes
    features/catalog/          feature/shell (routes), feature/page (the smart page), ui (dumb blocks), util
    features/product/          feature/shell (routes), feature/page (the smart page), ui (dumb blocks)
    shared/                    data-access (HTTP), ui (badges, labels), testing (fixtures, Jest setup)
```

Every library carries Nx tags (`platform:server|web`, `type:domain|application|infrastructure|api|shell|...`), and `@nx/enforce-module-boundaries` in `eslint.config.mjs` turns an import in the wrong direction into a lint error. Import aliases derive from the path: `libs/server/nodejs/api/features/catalog/domain` is `@pf/server-nodejs-api-features-catalog-domain`.

HTTP surface, all under `/api`:

| Route | Purpose |
| --- | --- |
| `GET products` | Search, filter, sort, page, with filter counts |
| `GET products/:sku` | One product; still works for discontinued products |
| `GET products/:sku/reviews` | A page of reviews, newest first |
| `POST products/:sku/reviews` | Create a review, rate limited per IP |
| `GET catalog/status` | When the catalogue was last imported |
| `GET health` | 200 while Postgres answers, 503 otherwise |

Other useful commands:

```bash
npx nx graph                                         # the project graph in a browser
npx nx test <project>                                # one project's unit tests
npm run generate:lib -- libs/server/nodejs/api/features/x/domain --tags=platform:server,type:domain
```

## Configuration

There is one environment file, `.env`, committed with development defaults and no secrets, so there is nothing to copy. The API, the import, Prisma and the integration tests read `DATABASE_URL`, `API_PORT`, `REVIEW_RATE_LIMIT` (reviews per IP per minute) and `TRUST_PROXY` from it, and Docker Compose reads `WEB_PORT`, `DB_PORT` and the Postgres credentials from it. Without the file, Compose falls back to the same values as built-in defaults. The API validates them at startup and fails fast with a clear message if one is wrong.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `port is already allocated` from Compose | Change `WEB_PORT` or `DB_PORT` in `.env`, then start again |
| `docker compose up --wait` stops with the `seed` service failed | Run `docker compose logs seed`. The import refuses files it considers broken; see [the import](#the-catalogue-import-seed) |
| `Cannot find module '.../prisma/generated'` when building or testing locally | Run `npm run db:generate` |
| `P1001: Can't reach database server` locally | Run `docker compose up -d --wait db` and check `DATABASE_URL` in `.env` points at `localhost:5544` |
| `Port 3100/4200 is already in use` | `npm run kill:dev`, or stop the other process |
| Red "Invalid PrimeUI License" notice | Expected without a key; see [PrimeNG licence](DECISIONS.md#primeng-licence) |
| Start over with an empty database | `docker compose down -v && docker compose up --build --wait` |
