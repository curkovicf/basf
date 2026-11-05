# Decisions

## Architecture

```
Browser (Angular + PrimeNG)
   │  same origin
nginx ── static files
   │  /api
NestJS API ── products, reviews, health
   │  Prisma
PostgreSQL ◄── import CLI ◄── nightly PIM CSV
```

The import is a separate one-shot process in the same codebase, sharing the schema with the API. The frontend holds no search state of its own: the URL holds it, and the API does all the searching.

The code is one Nx workspace. Apps hold only an entry point; behaviour lives in libraries, grouped by platform and then by feature:

```
apps/server/nodejs/{api, catalog-import, api-e2e}     apps/web/angular/finder
libs/shared/types                                      wire DTOs both sides compile against
libs/server/nodejs/api/features/<feature>/             domain → application → infrastructure → api, + shell
libs/web/finder/{app, features/*/{feature,ui,util}, shared/{data-access,ui,testing}}
```

Each backend feature (catalog, reviews, catalog-import, health) is a clean-architecture slice:

| Layer | Holds | May import |
| --- | --- | --- |
| `domain` | Models, pure rules (effective status, facet semantics, import normalisation and planning, the shrink guard), repository ports, DI tokens | shared types only |
| `application` | Use cases: CQRS query and command handlers, the import service. Maps domain models to DTOs | domain |
| `infrastructure` | Prisma implementations of the ports. All raw SQL lives here | domain, shared infrastructure |
| `api` | Controllers and request validation; for the import, the CLI runner | application, domain |
| `shell` | The Nest module that binds the slice; the root shell composes the API | everything |

The arrows are enforced, not assumed: every library carries Nx tags and `@nx/enforce-module-boundaries` fails lint on an import in the wrong direction, or on Angular code importing NestJS and vice versa.

## Key decisions

**One monorepo, with the backend in clean-architecture slices.** The API and the web app used to be two independent npm projects with the response types copied by hand. Now `libs/shared/types` is compiled by both, so a change to a DTO breaks the build on whichever side forgot it, instead of breaking in the browser. On the backend, the business rules (what "discontinued" means, how region counts work, when an export is refused) sit in dependency-free domain libraries with their own unit tests, and the SQL sits behind repository ports, so a use case can be tested with an in-memory store and the SQL can change without touching the use case. The cost is more files: a feature is five small libraries rather than one folder. That is deliberate, because the catalogue is expected to grow across business units and the structure is meant to be extended by several people. *Alternative:* keep two apps and a conventional NestJS module layout, which is less to read today but leaves the layering to code review.

**The import upserts by SKU and only writes PIM-owned columns.** This is what makes re-running safe and keeps reviews intact. Rating totals live on the product row but are never in the import's column list. A run is one transaction, so customers see the old catalogue or the new one, never a mix. *Alternative:* delete and reload, which is simpler but breaks review references and exposes a half-empty catalogue.

**Products missing from an export are delisted, not deleted.** They keep their reviews, and shared links still work and show "no longer sold". If a product returns, it is relisted. *Alternative:* hard delete, which would destroy customer reviews and turn old links into dead ends.

**A broken export must not damage the catalogue.** Wrong headers, a cut-off row or an empty file abort the run. So does an export with under 50% of the listed products, unless `--force` is passed. A single bad row is rejected on its own, and that product keeps its last good data rather than being delisted.

**Discontinued products are hidden by default but never unfindable.** This addresses the sales team's complaint directly. If a search or filter also matches discontinued products, the page says so and offers to show them, so a customer looking up an old name learns it was discontinued rather than assuming it never existed. *Alternative:* removing them entirely would leave old links broken and those customers calling sales.

**Search, filtering and sorting run in Postgres, from day one.** 200 products would fit in the browser; 50,000 on a phone at a trade fair would not. Search is `ILIKE`-style substring matching on a trigram-indexed text column, because customers type partial product codes and chemical names, which stemmed full-text search handles poorly. *Alternative:* Elasticsearch or similar, which is a whole extra system to run that this scale doesn't justify yet. Trigrams don't handle typos as implemented; see next steps.

**Measured at 50,000 synthetic products** (laptop, Docker, one client at a time, no concurrent load, so this is a lower bound and not a load test): full import 7.5 s, unchanged re-import 2 s, and API responses of about 3–70 ms once warm (the very first request took about 110 ms), the slowest being a page 2000 request and one-letter searches. The measurements also removed an unused `launch_year` index. Offset pagination is fine at this size.

**The URL is the only source of search state.** Sharing, the back button and reloading all work without further code, and there is no second state to fall out of sync. Bad URL values fall back to defaults instead of showing an error, since links get mangled in chat apps.

**Rating totals are stored on the product and updated atomically with each review.** Sorting by rating then uses an index instead of aggregating per request. The update is a single relative `UPDATE`, so concurrent reviews queue on the row lock, which a test confirms with 25 parallel submissions. *Alternative:* computing averages at read time is always consistent but doesn't scale for sorting.

**Raw SQL through Prisma for search.** Trigram search, array facets and relevance ranking don't fit Prisma's query API. Everything is parameterised through `Prisma.sql`, and it all lives in the infrastructure layer behind repository ports. Simple reads and writes use the normal client.

**Integration tests use real Postgres.** The riskiest behaviour is in SQL: upserts, facets, escaping, concurrency. Mocks wouldn't catch mistakes there. The tests run the real migrations in a separate database.

**The frontend is zoneless and signal-based.** There is no zone.js, and `provideZonelessChangeDetection()` says so in the app config. State is signals: the search and the product are `rxResource`s keyed on a signal, which cancel a stale request by themselves, and the search debounce is an effect whose cleanup clears its timer. The review form is a signal form, so the model is one signal and validity is derived from it. RxJS is left only where it is the HTTP and router boundary. The cost is that tests can no longer wait for `whenStable()` while a request is pending, since a resource keeps the app unstable until it is answered.

**The UI uses no deprecated APIs, and that is checked.** PrimeNG 22 deprecates the `<p-button>` component, so every button is a native `<button pButton>`, with a spinner and `disabled` for loading. Motion uses Angular's `animate.enter` and `animate.leave` with plain CSS, not the deprecated `@angular/animations` package, plus router view transitions. All of it is off under `prefers-reduced-motion`. A type-aware `@typescript-eslint/no-deprecated` scan of the web code found nothing. It is not a permanent lint rule yet, because templates are not covered by it.

### PrimeNG licence

The brief requires PrimeNG and the latest Angular. PrimeNG 22, the release that supports Angular 22, is **commercially licensed, not MIT**. Without a key it shows an "Invalid PrimeUI License" notice on every page. The app has an empty slot for the key in `libs/web/finder/app/src/lib/primeui-license.ts`. The notice was deliberately not hidden, since the licence forbids removing its mechanisms; the only workaround is spacing so that it doesn't cover the mobile filter button.

**For the business:** an organisation of BASF's size won't qualify for the free Community licence, so production needs paid per-developer seats, or a decision to use another component library. Someone should make this call before more UI is built on it.

## Assumptions

- **"Global" means sold everywhere**, so filtering by EMEA includes Global products, and the filter counts reflect this. Filtering by Global shows only Global products.
- **Duplicate SKUs: the last row wins**, assuming later rows are newer. P-10151 appears as Active and then Discontinued, so it's treated as Discontinued, which is also the safer error given the sales complaint. This should be confirmed with the PIM owner.
- **A row without a name is rejected** (P-10119), because there would be nothing to show. **A missing or invalid launch year is kept as "Unknown"** (P-10091, P-10105), because that shouldn't cost us the product.
- **An unknown status rejects the row.** Status decides what customers are told is for sale, so it isn't guessed. Spelling variants (`active`, `ACTIVE`, `Phase out`) are mapped.
- **Phase-out products stay visible, with a warning.** They can still be bought.
- **Reviews are closed on discontinued products.** A review can't inform a purchase there. Existing reviews stay visible. This is a product decision that's easy to reverse.
- **Reviews publish immediately**, because moderation is out of scope.
- **Certification filters mean "has all selected"**; other filters mean "any selected".
- **How the file arrives is unknown.** The import reads a file path, and a scheduler is expected to call it after each export.

## Risks

| Risk | Status |
| --- | --- |
| **Public, anonymous, unmoderated reviews.** Abuse, fake reviews, competitors, or claims about safety and regulatory compliance on a chemical company's site. | Partly addressed: length limits and 5 per minute per IP. **Not solved**: a determined person can still post fake reviews. I'd raise this with the business and legal **before go-live**, along with reporting and removal tools. |
| **Personal or confidential data in reviews** (GDPR, formulations). | The form warns users. There's no deletion process yet, which production needs. |
| **Stored XSS through reviews.** | Addressed: rendered as text only, and verified with a script payload in a real browser. |
| **Rate limit state is in memory**, so it's per instance and resets on restart. | Acceptable for one instance. Multiple instances need shared storage such as Redis. |
| **The data has real quality problems.** | Each run reports them, and they're stored in `import_runs`, but nobody is alerted yet. |
| **A stale catalogue goes unnoticed.** | `/api/catalog/status` and the page footer show the last import. Monitoring should alert on it. |
| **A failing import blocks startup under Compose**, as the API waits for the seed. | Intentional locally. A production nightly job should run independently of the API. |
| **API types drift from the frontend.** | Addressed: both compile against `libs/shared/types`, so a mismatch fails the build. |

## Left out deliberately

Authentication, moderation and other write flows (per the brief); product comparison view; typo-tolerant search; multiple languages (the catalogue has only English); dark mode; demo reviews (fake reviews seemed wrong for a feature built on trust); browser end-to-end tests in the repository (the flows were checked manually with a throwaway script); CI.

## Next steps to production

1. Decide on the PrimeNG licence, and on review moderation and legal review.
2. Connect the import to the real PIM delivery, with a scheduler and alerts on failure or stale data.
3. Add CI: lint, tests, image builds, dependency scanning.
4. Add production infrastructure: managed Postgres with backups, TLS, secrets management, a shared rate-limit store, structured logs and metrics.
5. Run a real load test, then add caching for facets if needed.
6. Add Playwright tests for the main journeys, and do an accessibility audit.
7. Publish an OpenAPI spec from the shared types, for consumers outside this repository.
8. Add typo tolerance using trigram similarity.
