# AI usage

## Tools

Claude Code in the terminal, with access to the repository, Docker and a browser. The first session ran on Claude Opus 5.5, the later ones on Claude Fable 5.1. No other AI tools were used.

## What I delegated, and what I did myself

The work ran over four sessions, each started by me with a specific instruction.

| Session | My instruction | What the agent did |
| --- | --- | --- |
| 1 | Read the brief, analyse the data, plan and implement a first version | Planning, data analysis, backend, frontend, tests, Docker setup, browser checks, first drafts of all three documents |
| 2 | Restructure the backend into clean-architecture slices inside one Nx workspace, following the layout I use in my own projects | One library per layer, Nx tags, boundary rules in ESLint, a library generator, and all tests, migrations and Docker steps brought in line |
| 3 | Check that the seed runs the NestJS way and that everything is properly dockerized, then fix it; break the pages into dumb UI components; add `npm start`; one file per use case on the backend | Split the Docker images, built the `ui` libraries and feature shells, the parallel dev script, and the per-handler files with their specs |
| 4 | Verify the documentation against the code, rewrite the README so it always works, and double-check that the seed can never duplicate data | Audited every README claim against the code, ran the full stack from an empty volume on spare ports, re-ran the seed repeatedly, rewrote the README |

I did the framing, the architecture choices, the review of each result, and the decisions below. The agent wrote the code, the tests and the first drafts of the documents. DECISIONS.md and this file were reviewed and edited by me; the reasoning in them is what I will defend in the interview.

## Where I rejected, corrected or changed the agent's output

1. **Rejected the first project structure.** The agent's first version was two independent npm projects, API and web app, with the response types copied by hand between them, and a conventional NestJS module layout. I had it rebuilt as one Nx workspace with a shared types library that both sides compile against, and with each backend feature as a `domain → application → infrastructure → api` slice wired by a shell. The reason is in DECISIONS.md: the catalogue will grow across business units and the layering should be enforced by lint rather than by code review. The cost, more small libraries, is deliberate.

2. **Rejected the Docker setup.** Testing passed, but the API image was 1.2 GB because it carried the Prisma CLI and its engines, and the seed and the API shared one image. I asked for the seed to run as a proper NestJS one-shot process with its own image that carries the CLI and runs the migrations, and for the API image to carry only what serving HTTP needs. The API image is now 424 MB and the import can be scheduled independently of the API.

3. **Rejected the page components.** The first catalogue and product pages were single components with templates of well over a hundred lines, mixing data loading with presentation. I had them split into dumb `ui` components that receive data through `input()` and report through `output()`, with the `feature` page only routing, loading and holding state, and lint forbidding `ui` libraries from importing `data-access`. Templates are now under sixty lines each.

4. **Overruled the agent's tooling defaults in favour of the brief.** The Nx generators and my own habits would have given Vitest and, in my projects, Drizzle. The brief fixes Jest and Prisma, so those stayed. The agent also pulled Prisma's `latest` tag, which was a release candidate; I had it pinned to the stable 7.10.1. A generated `AGENTS.md` that advertised a paid telemetry service was deleted.

5. **Did not trust "tests pass" as proof the README works.** In the last session I had the agent verify the documentation against the code instead of against its own memory of it. The README claimed the Prisma client was generated as a side effect of `npm ci`. It is not: there is no install hook, and on a fresh clone `npm run test:all` fails to compile the catalogue SQL spec. The agent reproduced that by hiding the generated client, then fixed the instructions. The same check brought up a fresh Compose stack from an empty volume, so the README's quick start is proven rather than assumed.

6. **Kept the PrimeNG licence notice visible.** The agent first reported the notice as console-only, then found it covered a button on phones and proposed hiding it. Hiding it would breach the licence, so I kept it visible, added spacing so it does not cover the control, and raised the licensing question for the business in DECISIONS.md instead.

## Decisions in DECISIONS.md that I changed or stand behind

Changed by me: the monorepo and clean-architecture slices (1 above), the separate import image and process (2), the composition of the frontend into shells, pages and dumb blocks (3), one file per query, command and handler, and the `API_PORT` variable name after the Angular dev server took `PORT` for itself.

Reviewed and kept, because the reasoning holds: delisting instead of deleting products that leave the export; the URL as the only source of search state; search, filtering and sorting in Postgres with a trigram index from day one; rating totals stored on the product and updated atomically; the shrink guard that refuses an export under half the listed catalogue unless forced; last row wins for duplicate SKUs, to be confirmed with the PIM owner; and reviews closed on discontinued products. The 50,000-row measurement is a lower bound, not a load test, and is labelled as such.

## What the agent got wrong and caught itself

These came out of the agent's own testing and checks. They show where its output was wrong and why I did not take green test runs at face value.

- **A wrong claim about an index.** It dropped the `status` index saying the planner never used it, before the check had run because of a shell error. The check showed 64 scans, so the index was restored in a new migration. That is why the repository has a drop migration followed by a restore.
- **A filter bug that every test missed.** All tests passed, but a browser run showed the EMEA filter disappearing when the only matches were Global products, which are sold in EMEA. The region list was built only from matching rows. Fixed, with tests added.
- **A rate-limit test passing the wrong way.** After the library split, the review-limit test got 201 instead of 429, because the infrastructure module read the environment when the shell module was first imported, before the test set its own limit. Fixed by importing the shell lazily in the test helper, which documented a real ordering hazard.
- **A Docker image missing the Prisma client.** The generated client is gitignored, so Nx's graph could not see it and left `@prisma/client` out of the bundled `package.json`. The dependency is now declared explicitly in the shared infrastructure library.
- **A false Docker failure from stale images.** A missing `main.js` came from a day-old image under the same Compose project name, not from the new build. Verified again with `--build` from an empty database before trusting the result.
- **The web dev server stealing the API port.** Nx passes the root `.env` to every task and the Angular dev server honours `PORT`, so with both apps in one `run-many` the web app tried to start on 3100.
- **Smaller slips.** A `sed` rename without word boundaries that mangled a page title; a `zsh` glob that aborted a command chain so one component file was never written; a spec that pushed nothing into an array and then asserted on its length; a headless screenshot that looked clipped until real device emulation showed no overflow; an error path where recording a failed import could throw and hide the original error; and Prisma's `migrate reset` guard, which the agent respected by writing a forward migration instead of resetting.

## How the output was checked

Automated tests, with six deliberate code breaks confirming that tests fail when they should: 117 unit tests across the backend and frontend libraries and 47 integration tests against a real Postgres with the real migrations. A 50,000-row synthetic performance run. Browser walkthroughs at desktop and phone sizes with screenshots reviewed, including the discontinued and not-found pages and the review form. And, last, a clean `docker compose up --build` from an empty volume following only the README, with the seed run three times to confirm it inserts 199 products once and changes nothing afterwards, leaving existing reviews intact.
