# Project Context — AI Knowledge Base

This directory contains project-specific context for AI coding agents working on InverApp.

## Contents

| File | Purpose | Priority |
|------|---------|----------|
| `navigation.md` | **Start here.** Routes to the right file by task. | critical |
| `loader.md` | Loading protocol (which file for which task, when to update). | critical |
| `session-template.md` | Template for `.tmp/sessions/` context bundles. | high |
| `CHANGELOG.md` | History of changes to this ctx dir. | low |
| `architecture.md` | Layered structure, module map, data flow. | high |
| `data-model.md` | Tables, RLS, PPC cost basis, migration conventions. | high |
| `state-stores.md` | 5 Pinia stores (state of record). Fields, computeds, actions. | high |
| `api-integration.md` | Supabase client, Yahoo Finance proxy, currency inference. | high |
| `routing-views.md` | 5 routes, view→store→component wiring. | medium |
| `conventions.md` | Vue 3, TS strict, naming, commit format. | critical |
| `ui-system.md` | Mozaic components, CSS tokens, design system. | high |
| `feature-history.md` | Build arc, prior sessions, current gaps. | medium |
| `gotchas.md` | Real traps. Mozaic props, Sass wrapper, RLS, etc. | critical |

## Load Order

1. **Always**: `conventions.md` (style/naming baseline)
2. **By task type**: from the table above
3. **Before any code**: skim `gotchas.md`

## Companion Files

- `../navigation.md` in the global ctx dir (at `~/.opencode/context/`) holds universal standards.
- `../../AGENTS.md` is the compact resume — start there for orientation.
- `../../.tmp/sessions/` has prior feature session context bundles.

## Metadata Convention

Every file starts with an HTML comment header:

```html
<!-- Context: project/<filename> | Priority: critical|high|medium | Version: 1.0 | Updated: YYYY-MM-DD -->
```

The `Updated:` field must be bumped whenever content changes. Use the `Priority` field to signal criticality for loading.

## When to Update

- **New feature built**: append to `feature-history.md`, bump `Updated:`.
- **Pattern changed** (naming, store style, etc.): update `conventions.md`.
- **New pitfall discovered**: add to `gotchas.md`.
- **New store / view / migration**: update the relevant file (state-stores, routing-views, data-model).
- **Mozaic prop quirk found**: add to `ui-system.md` and `gotchas.md`.

## When NOT to Duplicate

- Universal code-quality standards live in `~/.opencode/context/core/standards/` — link to them, don't re-copy.
- Per-file content (function bodies, config values) doesn't belong here. This is **meta-knowledge** about the project, not the project itself.
