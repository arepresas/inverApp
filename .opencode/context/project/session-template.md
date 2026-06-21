<!-- Context: project/loader | Priority: high | Version: 1.0 | Updated: 2026-06-21 -->

# Session Context Template

**When you start a non-trivial feature, create a session bundle at `.tmp/sessions/<date>-<slug>/context.md`.**

This is the handoff format for delegating work to other AI agents (CoderAgent, specialist subagents) and for resuming your own work later.

## When to create

- Multi-file feature (≥ 4 files)
- Multi-step dependency chain
- Delegation to specialist subagents
- Complex bug investigation

For one-off edits or single-file changes, skip this — use a `loader.md`-based direct load instead.

## File template

Copy and customize:

```markdown
# Task Context: <Feature name>

Session ID: <YYYY-MM-DD>-<kebab-slug>
Created: <YYYY-MM-DD>T<HH:MM:SSZ>
Status: in_progress | done | blocked

## Current Request
<One paragraph: what user wants and why>

## Context Files (Standards to Follow)
- <paths to .opencode/context/ files>

## Reference Files (Source Material to Look At)
- <paths in repo>

## External Docs Fetched
- <Library>: <what you learned + version + URL>

## Components
1. <Component/task 1> — <brief>
2. <Component/task 2> — <brief>
...

## Constraints
- <project conventions that apply>
- <library API quirks>
- <existing patterns to match>

## Exit Criteria
- [ ] <verifiable outcome 1>
- [ ] <verifiable outcome 2>
...
```

## Storage location

`.tmp/sessions/<YYYY-MM-DD>-<short-slug>/context.md`

Example: `.tmp/sessions/2026-07-15-bulk-csv-import/context.md`

## Cleanup

When the feature ships and PR is merged, ask the user before deleting the session folder. See the universal workflow's `confirm_cleanup` rule.

## Existing sessions (in this repo)

| Folder | Feature |
|--------|---------|
| `2026-05-28-watchlist/` | Watchlist/Seguimiento tab |
| `2026-06-03-locale-settings/` | Country selector + locale formatting |
| `2026-06-03-visual-redesign/` | Refined minimalist visual overhaul |
| `portfolio-feature/` | Initial portfolio MVP (older naming) |
| `tx-history/` | History tab (older naming) |
