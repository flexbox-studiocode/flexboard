# Figma alignment

## Scope and baseline

Source: https://www.figma.com/design/6VJnow9ExBcHVvLQODUzLw/FlexBoard-MCP?node-id=0-1

Work branch: `feat/figma-alignment`, based on `feat/frontend-foundation`.

Baseline screenshots captured locally with Playwright at 1440 px before implementation (home, tasks, progress, activity, new task, login, members, detail). They are audit artifacts, not runtime assets or committed application data.

| Route | Reference | Target |
| --- | --- | --- |
| `/` | Beranda `1:5` | Navy shared-task panel, blue team panel, compact activity section |
| `/tasks` | Tugas kami `1:148` | Navy task overview and white member progress panel |
| `/team-progress` | Progres team `1:286` | One primary white member progress panel; compact filters |
| `/activity` | aktivitas terbaru `1:408` | White activity feed panel with compact filters |
| `/tasks/new` | Menambahkan tugas `1:573` | White form panel, navy fields, blue accents; preserve PRD fields |
| `/tasks/:id`, `/tasks/:id/edit` | Update Progres `1:468` (adaptation) | White detail panels and navy reporting area; checklist-based progress |
| `/login` | Login `1:544` | White card, logo watermark and navy backing |
| `/members`, dialogs, 404 | No dedicated frame | Reuse the same visual primitives; do not claim exact frame fidelity |

## Approved differences from Figma

- PRD governs functionality: no manual progress input; upload is outside MVP.
- Homepage reporting form is replaced with a compact activity section; reports stay in task detail, pending scope decisions.
- No sample identities, percentages, dates, activity or credentials in production views.
- Backend unavailable differs from an empty result: never label unavailable data as zero or no tasks.
- Auth and domain operations remain disabled/unavailable until contracts and backend exist.
- Missing mobile designs are adapted using flow layout, not fixed screenshot coordinates.
- Navigation highlights the actual route (the activity reference incorrectly highlights progress).
- Additional PRD fields/filters remain, but do not dominate the reference composition.

## Acceptance

- Reuse existing React components, JavaScript and token-based CSS; no Tailwind migration.
- Compare desktop geometry at 1440 px; content-driven page heights rather than fabricated rows.
- Verify 320, 390, 768, 1024 and 1440 px, focus/keyboard/modal behavior, overflow and search geometry.
- Add structural component tests and repeatable screenshot coverage. Test fixtures stay in tests only.
- Run lint, component tests, Node deployment checks, browser tests and build.
- Review rendered screenshots against Figma; passing tests alone does not establish visual fidelity.

## Git procedure

Validate and commit each logical change with explicit staging. Use the existing approved Git identity and authenticated `Constanvel` account. Leave the nested untracked `flexboard/` repository untouched. Push only after the full alignment package and final validation; no force push or merge to main.

## Implementation result

- Shared header/banner/heading composition aligned; preview notice moved below content.
- Home restored to navy shared task, blue team panel and compact activity section. Project preview remains a secondary extension.
- Tasks use navy overview and white member panel; filters no longer occupy a separate dominant card.
- Task form uses full-width white panel/navy fields; detail uses navy reporting surface, without manual progress/upload.
- Progress, activity and members use a primary white panel with compact controls; login retains the white card/watermark/navy backing.
- Validation: lint passed; 78 component tests, 3 Node checks, 30 Chromium tests passed; production build passed.
- Browser screenshots cover 10 routes at 390/1440 px and are written under ignored `test-results/`. Existing overflow tests cover nine widths from 320 to 1920 px.
- Visual review found and fixed cross-route CSS overriding homepage panel colors. Color assertions now cover the navy/blue surfaces. Screenshot capture is not an automated Figma pixel-diff.
- No new dependencies, production data mocks, API endpoints, database changes or credentials were introduced. No claim of pixel-perfect rendering for unavailable content or screens without dedicated frames.

## Integration boundary

This work aligns frontend presentation, not production integration. API contracts, auth, role capabilities, reporting scope and timezone decisions remain pending. See `FRONTEND_API_PROPOSAL.md` and `FRONTEND_STATUS.md`.
