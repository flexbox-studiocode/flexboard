# Consistent field controls

## Scope

User screenshot showed different select/date typography and height, with the native chevron too close to the right edge. Fix branch: `fix/consistent-field-controls`, based on `0d6b920`.

- Shared single-value Select keeps its native element, keyboard behavior, label, disabled state, validation and description. Only native arrow appearance is replaced with a decorative Lucide ChevronDown.
- Chevron is 20 px, inset 16 px from the inline end; 48 px trailing padding reserves text space. Pointer events are disabled on the decoration. Multiple selects and size>1 listboxes do not receive an arrow.
- Task form dark surface retains its own typography/colors/65 px controls; the same chevron inset applies. Multiple-assignee control remains a listbox.
- All FilterToolbar consumers (Tasks, Progress, Activity, Members) use one shared 48 px height, 16 px Plus Jakarta Sans text, 24 px line height, common border/radius and 8 px label gap. Search retains leading-icon padding; select retains trailing-icon padding. Native date/calendar behavior is unchanged.
- Removed conflicting per-page filter font/height rules. Top-aligned fields keep controls level even with invalid date hints underneath. Reset remains aligned with the control row.
- Project/account dialogs and project picker also inherit the shared Select decoration. No data/API/auth/permissions/PRD changes.

## Checks

- Lint and 80 component tests passed, including native selection, disabled semantics, accessible descriptions and multiple/listbox exceptions.
- Five targeted browser tests passed at 320/390/768/1440 px across Tasks, Progress, Activity and Members, plus task form checks. Assert equal geometry/typography, >=15 px icon inset, 48 px reserved padding and no horizontal overflow. Invalid date range/reset also verified.
- Deployment configuration: 3 Node tests passed. Production build passed.
- Full browser suite: 43 passed. Existing database suite setup remains outside this frontend patch (missing `.env`/installed `pg` in the previous check).
- Filter screenshot artifacts: `C:/Users/IDEAPAD SLIM 3/AppData/Local/Temp/opencode/consistent-field-controls`.

## Git

Explicit staging; separate commits for shared select, filter standardization, regression tests and evidence. Identity `Rainer <rainersimanjuntak59@gmail.com>`, authenticated `Constanvel`. One push after final checks. Preserve nested `flexboard/`, inherited commits and user work. No force push or merge to main.
