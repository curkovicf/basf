# finder

The customer-facing Angular app: search and filter the catalogue, open a product, read and write reviews, share the exact view by URL.

|            |                                                 |
| ---------- | ----------------------------------------------- |
| **Path**   | `apps/web/angular/finder`                       |
| **Tags**   | `platform:web`, `type:app`                      |
| **Port**   | `4200`; `proxy.conf.json` forwards `/api` to 3100 |
| **Serve**  | `npm run finder:web`                            |
| **Image**  | `apps/web/angular/finder/Dockerfile` (nginx, `nginx.conf` proxies `/api`) |

## Shape

`main.ts` bootstraps `App` from `@pf/web-finder-app`. All behaviour lives in `libs/web/finder`:

| Library                      | Type          | Holds                                              |
| ---------------------------- | ------------- | -------------------------------------------------- |
| `app`                        | `app`         | Root component, providers, theme, routes           |
| `features/catalog/feature/shell` | `shell`   | `CatalogRoutes`: the feature's entry point, lazy-loads the page |
| `features/catalog/feature/page`  | `feature` | The search page: URL-driven state, debounce, drawer |
| `features/catalog/ui`        | `ui`          | Dumb blocks: search bar, toolbar, chips, results (list, card, paging, empty state), filter panel in a sidebar or drawer |
| `features/catalog/util`      | `util`        | URL ↔ query object, pure functions                 |
| `features/product/feature/shell` | `shell`   | `ProductRoutes`: the feature's entry point, inherits `:sku` from the mount point |
| `features/product/feature/page`  | `feature` | The product page: loading, reviews, review submission |
| `features/product/ui`        | `ui`          | Dumb blocks: availability notice, header, details, review list, card, stars, form |
| `shared/data-access`         | `data-access` | `ProductApi`, the only HTTP client                 |
| `shared/ui`                  | `ui`          | Rating badge, status tag, load error, labels       |
| `shared/testing`             | `util`        | Fixtures and the Jest setup every lib shares       |

Wire types come from `@pf/shared-types`, the same library the API compiles against. Component selectors use the `pf-` prefix.

The app routes only choose mount points (`products`, `products/:sku`) and lazy-load each feature's `shell`, which owns the feature's routes and lazy-loads its `page`. `feature` libraries hold one smart page each: it owns the HTTP calls and the state. Everything visible is a `ui` component that takes its data through `input()` and reports back through `output()`; `ui` libraries cannot import `data-access`, and lint enforces it. Templates stay short because each logical block of a page is its own component.
