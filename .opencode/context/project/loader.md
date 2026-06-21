<!-- Context: project/loader | Priority: critical | Version: 1.0 | Updated: 2026-06-21 -->

# Project Context Loader

**Use this checklist at the start of EVERY task on InverApp.**

## Step 1: Classify the task

| Task type | Load this file first | Then load |
|-----------|---------------------|-----------|
| Code (any file) | `conventions.md` | relevant domain file + `gotchas.md` |
| DB / SQL / migration | `data-model.md` | `conventions.md` + `gotchas.md` |
| Pinia store | `state-stores.md` | `conventions.md` + `gotchas.md` |
| Vue component | `ui-system.md` | `conventions.md` + `gotchas.md` |
| Route / view | `routing-views.md` | `conventions.md` + `state-stores.md` |
| API / external | `api-integration.md` | `conventions.md` + `gotchas.md` |
| Bug / regression | `gotchas.md` | relevant file + `feature-history.md` |
| Refactor | `architecture.md` | `conventions.md` + relevant file |
| New feature | `feature-history.md` | all relevant domain files + `conventions.md` + `gotchas.md` |
| Style / UI | `ui-system.md` | `conventions.md` |
| Documentation | `conventions.md` (style section) | — |

## Step 2: Read the file(s)

Use the Read tool, not Bash `cat`. Confirm each file's `Updated:` date is recent.

## Step 3: Sanity checks

Before writing ANY code, verify:

- [ ] Have I checked `gotchas.md` for the relevant area? (Mozaic props, RLS, Sass)
- [ ] Does the task touch RLS or grants? → `data-model.md` (Supabase 2026 GRANT change)
- [ ] Does it use a Pinia store? → `state-stores.md` (fetch* prefix, setup-store syntax)
- [ ] Does it format money/numbers? → `getNumberLocale()` (never hardcode locale)
- [ ] Does it add a new table? → explicit GRANTs required
- [ ] Does it add a Mozaic component? → check `ui-system.md` prop quirks

## Step 4: After the task

- Bump `Updated:` on any ctx file that became stale.
- Add new gotchas to `gotchas.md`.
- Append to `feature-history.md` if it's a meaningful change.

## Quick reference: file locations

```
.opencode/context/project/
├── README.md           (this dir's index)
├── navigation.md       (TASK → FILE router — start here for content)
├── loader.md           (this file — loading protocol)
├── architecture.md
├── data-model.md
├── state-stores.md
├── api-integration.md
├── routing-views.md
├── conventions.md
├── ui-system.md
├── feature-history.md
└── gotchas.md
```

## Cross-references

- `AGENTS.md` at repo root is the compact resume.
- `~/.opencode/context/core/standards/` holds universal coding standards.
- `~/.opencode/context/core/workflows/` holds delegation + review workflows.
- `.tmp/sessions/<feature>/` has prior feature context bundles (read before similar work).
- `.tmp/tasks/<feature>/` has TaskManager subtask JSONs (read before parallel work).
