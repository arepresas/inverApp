<!-- Context: project/conventions | Priority: critical | Version: 1.0 | Updated: 2026-06-21 -->

# Conventions

## Vue / TS

- **Vue 3 Composition API only** with `<script setup lang="ts">`. No Options API.
- **TypeScript strict**. `tsconfig.app.json` adds: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`. Build fails on unused.
- **No `any` abuse**. `eslint` config is minimal (just `@eslint/js` recommended + `eslint-plugin-vue` flat/recommended, with `vue/multi-word-component-names` OFF — single-word names like `Home`, `Buy` are allowed).
- **No semicolons in Vue SFCs** (Prettier).
- **Trailing comma: all** (Prettier).
- **Single quotes** (Prettier).
- **`@/*` path alias** resolves to `./src/*` — use `@/stores/...`, `@/lib/...`, `@/components/...`, etc.

## File naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `PortfolioTable.vue` |
| Views | PascalCase + `View` suffix | `DashboardView.vue` |
| Stores | camelCase | `portfolio.ts` |
| Types | camelCase, single file `portfolio.ts` | `types/portfolio.ts` |
| Lib utilities | camelCase | `yahoo.ts`, `locale.ts` |
| CSS modules | `kebab-case` (only `global.css`, `table.css` exist) | |

## Store naming

- **Setup-store syntax**: `defineStore('name', () => { ... })` with refs/computed/return.
- **Exported as `use{Name}Store`** — e.g. `usePortfolioStore`, `useAuthStore`.
- **Async loaders prefixed `fetch*`** (NOT `load*`, `get*`): `fetchPortfolio`, `fetchMarketPrices`, `fetchWatchlist`, `fetchProfile`. Mutation actions without prefix: `addTransaction`, `addToWatchlist`, `removeFromWatchlist`, `saveCountry`.
- **Init function on auth only**: `auth.init()` (session restore, not data fetch).

## Component conventions

- `<script setup lang="ts">` — never plain `<script>` or Options API.
- `defineProps<{ ... }>()` with TS types. Optional props via `propName?: type`.
- `defineEmits<{ eventName: [args] }>()` — typed emit signature.
- Component-local state via `ref()` / `computed()`.
- Styles: `<style scoped>` default. Use unscoped `<style>` only when targeting teleported content (e.g. `MPopover` body). BEM naming for class selectors: `.component-name`, `.component-name__element`, `.component-name--modifier`.
- Avoid `any`. Use generics or `unknown` + narrowing.
- Cross-store access: call `useXStore()` INSIDE the function, not at module top level (avoids circular init issues).

## Commit / PR conventions (from CONTRIBUTING.md)

- Semantic Release format: `<type>: <description>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`
- Breaking change: `feat!: description` or `BREAKING CHANGE:` footer
- Branch from `main`, use `.github/pull_request_template.md`
- Run `pnpm build` (vue-tsc + vite) before PR

## PR template checklist (`.github/pull_request_template.md`)

Sections: Summary, Changes, Screenshots, How to test, Checklist (Functionality / Code Quality / Security / Testing / Build), Related issues.

The Code Quality section explicitly demands:
- "Follows project coding standards (pure functions, immutability, composition)"
- "Functions are small and focused (< 50 lines)"
- "No duplication (DRY)"
- "TypeScript types are correct, no `any` abuse"

The Testing section says tests added/updated with `npm run test` — but actual command is `pnpm test` (template is stale).

## Env files

- `.env` — local dev (gitignored). Real Supabase URL + anon key.
- `.env.example` — committed template. Values are placeholders.
- App throws on import (`src/lib/supabase.ts`) if env vars missing — fails fast at boot.

## Dependency policy

- pnpm with `verify-deps-before-run=false` in `.npmrc` (pnpm 11 quirk).
- Single `package.json`, no workspaces.
- All deps pinned with `^` in `package.json` (lock file is `pnpm-lock.yaml`).
- Supabase CLI installed as devDependency (`supabase: ^2.104`).
- No backend service — pure SPA + cloud DB.

## Documentation in code

- Migration files have header comment block (`-- Migration:`, `-- Description:`).
- Major functions have JSDoc-style comments (e.g. `getNumberLocale` in `lib/locale.ts`).
- `scripts/sass-modern.cjs` has a doc block explaining the legacy→modern API wrapper.
- No README files inside `src/` (just root `README.md`).

## Patterns to follow

- **Composable components**: `DataTable.vue` is a generic wrapper. `PortfolioTable`/`WatchlistTable`/`HistoryTable` define `headers` array and delegate to `DataTable`.
- **Reactive class lookup**: `pnlClass()` helpers in `DataTable.vue` map value → CSS class.
- **Telemetry-free**: no analytics, no error tracking, no logging beyond `console.error` (which is unused).
- **No i18n library**: hardcoded English strings in templates (and one Spanish word: "Seguimiento" for the Watchlist tab label).
- **Currency formatting**: always via `Intl.NumberFormat(getNumberLocale(), ...)`. Never hardcode locale.
