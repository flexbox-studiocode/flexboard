# Visual refinement

## Boundary and Git baseline

Work branch: `feat/visual-refinement`, based on local `feat/figma-alignment` at `ae939fa` (includes an existing merge from main and database work). Existing commits are preserved, not authored by this visual pass. The untracked nested repository `flexboard/` is excluded.

Figma file: `6VJnow9ExBcHVvLQODUzLw`. Frames: home `1:5`, tasks `1:148`, progress `1:286`, activity `1:408`, update `1:468`, login `1:544`, new task `1:573`.

Approved differences remain frozen: checklist/server-based progress; no manual percentage/upload; compact homepage activity instead of Feedback; PRD fields and filters; project/account previews; no example production data; anonymous welcome; accurate active navigation. No backend, dependencies, auth or database changes.

## Baseline and measurement method

Before screenshots: 10 routes at 390 and 1440 px, captured before edits with the existing alignment browser suite. Local artifact directory: `C:/Users/IDEAPAD SLIM 3/AppData/Local/Temp/opencode/visual-refinement-before`.

Compare the 1440 px implementation with the natural 1440 px Figma frames, not scaled thumbnails. Font readiness is awaited. Source values below are from high-fidelity Figma design context, not estimated from the screenshot. Existing CSS values are recorded before edits. Screens without dedicated frames use the same primitives without claiming exact matching.

| Area | Before | Reference / action |
| --- | --- | --- |
| Header | 110 px minimum height on desktop | Home `1:7`: visible bottom at y=100; use 100 px header including border |
| Desktop content/banner | x=48, y≈138; banner width 1344 | `1:116`: x=48, y=137, width=1351, height=214; preserve responsive content width (7 px right-edge exception) |
| Navigation | Oxanium 15.2 px/500 | `1:13–19`: 16 px/500, 30 px line height |
| Banner heading | Oxanium 57.6 px; negative tracking | `1:133`: 64 px/700, 70 px line height; retain anonymous two-line copy |
| Banner search | Orbitron 16 px; button 72 px; generic 27 px icon | `1:134–137`: input 61 px, text 24 px/700, button 82×75 px, search asset 49×49 px |
| Page title | Fluid to 64 px, negative tracking | `1:114`: Oxanium 64 px/700; remove unreferenced condensed tracking, use natural line height rather than clipped Figma text boxes |
| Task panel | Inset includes 13 px accent + 40 px padding; top padding 32 px | `1:22/30/32/90`: content inset 42 px total, top 27 px, title 40 px/700, separator 2 px |
| Team panel | 40 px inset; title inherits 600 | `1:23/33/91`: 42 px inset, 27 px top, title 40 px/500; bottom navy stripe separated by 8 px |
| Home progress label | 16 px mono, 700 inherited strong | `1:63/64`: 24 px Share Tech Mono; value Oxanium 24 px/500 |
| Controls | 13.6 px bold body type; irregular icon sizes | Reference add task `1:99`: 16 px/600; preserve 44 px minimum interactive target |

## Acceptance and exceptions

- Target <=4 px for explicitly matched static dimensions at 1440 px; measure them in browser tests. Not a blanket claim for all coordinates.
- The reference home task panel is 1286 px wide while the banner is 1351 px. Do not narrow existing primary panels: retain shared full-width composition and record the 58 px width difference from that task panel.
- No fixed panel heights to simulate missing rows. Unavailable states and longer PRD forms remain content-driven. Figma fixed text heights/30 px line boxes that would clip large headings are not reproduced.
- Existing logo is reused with contained aspect ratio. Dynamic profile images/sample avatars are not downloaded. Existing responsive decorative brackets remain; use the exact search asset for the desktop banner.
- Validate 320–1920 px, keyboard/dialog/filter/checklist regression, font loading, local image geometry, screenshots before/after and production build. Screenshot capture is not a Figma pixel-diff.

## Per-page refinements

| Area | Before | Implemented reference |
| --- | --- | --- |
| Tasks | 3 px divider, 16 px workspace label | 5 px divider (`1:279`), 20 px/30 px label (`1:284–285`) |
| Task card | Oxanium title, small deadline | Plus Jakarta Sans 24 px/30 px title (`1:190`), 16 px deadline (`1:192`) |
| Task form | 28 px section heading, smaller controls | 36 px section heading (`1:606`), 20 px/30 px labels/controls and 65 px input (`1:583/601–605`) |
| Form description | 232 px minimum; 7 native rows | 236 px minimum (`1:584`), 6 native rows to prevent intrinsic height exceeding target |
| Form columns | 3:1 ratio, 32 px gap | 1000:220 proportion with up to 85 px gap (`1:583/609`); native datetime keeps 256 px minimum instead of reference date-only 220 px |
| Detail report | Full available width | 78.5%, up to 993 px (`1:493/538`); mobile full width; no progress/upload controls |
| Progress/activity panels | Effective 32 px shared padding overriding page rule | 52 px vertical, 40 px horizontal (`1:294/307`, `1:416/427`), protected from shared `.panel` override |
| Progress identity | 51 px width but inherited 42 px flex basis | Actual 51 px basis (`1:350`), 20 px initials (`1:352`) |
| Progress measurement | Percentage above rounded track | Percentage beside 8 px square track (`1:326/330`) |
| Activity rows | 18.4 px title, 12.8 px metadata, 14.4 px body | 20/15/16 px with 30 px rhythm (`1:450/436/441`); 178 px desktop row minimum, content can grow |
| Login | 48 px top, 76.8 px horizontal card padding | 50 px top, 78 px left, 67 px right; 915 px card and 74 px input (`1:554/559`) |

Members reuses the supported panel/avatar/control patterns. No dedicated frame fidelity claimed. Mobile form controls use 16 px text and reduced horizontal inset for readability; desktop-only typography is not forced onto narrow inputs.

## Final verification

- `npm run lint`: passed.
- `npm test`: 78 tests passed (13 files).
- `npm run test:browser`: 38 tests passed, including eight new numerical geometry/font/touch-target checks. Captures 10 routes at 390/1440 px; regression coverage includes nine widths 320–1920 px.
- `node --test tests/node/deployment.test.js`: 3 passed.
- `npm run build`: passed.
- Broader Node suite is blocked by pre-existing database setup: installed modules lack `pg`; `.env` is absent. Direct full Node run produced three failures in database/seed checks. No database config, dependencies or secrets were added to make visual work pass. `npm run test:node` now requires `.env` in the inherited package script.
- Geometric checks found and corrected missing Orbitron 700 usage, textarea native-row height, and shared panel specificity. Reference font checks passed for Oxanium, Orbitron, Share Tech Mono and Plus Jakarta Sans in Chromium.
- A same-scale banner overlay was inspected against Figma. It exposed vertically centered welcome text, corrected to the reference top inset. Header navigation horizontal positions, logo baseline and decorative bracket geometry still differ from the fixed Figma canvas; they are retained responsive primitives, not claimed within the numeric <=4 px set. Anonymous title copy necessarily differs.
- Final local screenshots: `C:/Users/IDEAPAD SLIM 3/AppData/Local/Temp/opencode/visual-refinement-after`. Before/after captures use identical viewport, routes and unavailable-data state. Representative desktop/mobile screenshots reviewed; this remains measured refinement, not a whole-page Figma pixel-diff.
- Static numerical targets explicitly tested meet the <=4 px tolerance. Whole-page positions differ for approved extra fields, notices, placeholder copy and absent production rows. Those differences are not hidden with fixed heights or invented data.

## Commit procedure

Commit this baseline, then shared typography/tokens, shared spacing/icons, home, tasks/forms, supporting pages, tests and final evidence in logical commits. Run relevant checks before each commit and explicitly stage paths. Identity: `Rainer <rainersimanjuntak59@gmail.com>`, authenticated account `Constanvel`. Push the new branch once after final validation. No force push, merge to main, hook bypass or unrelated staging.
