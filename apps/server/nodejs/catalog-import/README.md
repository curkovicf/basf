# catalog-import

The one-shot process that loads a PIM export into the database. It runs nightly after each export, and Compose runs it before the API starts.

|            |                                                        |
| ---------- | ------------------------------------------------------ |
| **Path**   | `apps/server/nodejs/catalog-import`                    |
| **Tags**   | `platform:server`, `type:app`                          |
| **Run**    | `npm run db:seed`, or `npm run finder:import -- <file> [--force]` |
| **Image**  | `apps/server/nodejs/catalog-import/Dockerfile`; Compose runs it as `seed` |

## Shape

`main.ts` creates a Nest application context and hands `process.argv` to `CatalogImportCli` (`libs/server/nodejs/api/features/catalog-import/api`), the import's inbound boundary. Everything an import means lives one layer in, in `CatalogImportService`: parse, plan, guard, write, record. The SQL is in the feature's infrastructure library behind `ICatalogImportStore`.

The API never imports this slice, so a broken export can never take the API down with it.

## Behaviour

- Upserts by SKU and writes only PIM-owned columns; reviews and rating totals are never touched.
- One transaction under an advisory lock: customers see the old catalogue or the new one.
- Products missing from the export are delisted, not deleted, and relisted if they return.
- A row that cannot be read is rejected on its own and keeps its last good data.
- An export with under half of the listed products is refused unless `--force` is passed.
- Every run, including a failed one, is recorded in `import_runs`.
