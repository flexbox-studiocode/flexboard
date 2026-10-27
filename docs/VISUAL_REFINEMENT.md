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

## Commit procedure

Commit this baseline, then shared typography/tokens, shared spacing/icons, home, tasks/forms, supporting pages, tests and final evidence in logical commits. Run relevant checks before each commit and explicitly stage paths. Identity: `Rainer <rainersimanjuntak59@gmail.com>`, authenticated account `Constanvel`. Push the new branch once after final validation. No force push, merge to main, hook bypass or unrelated staging.
