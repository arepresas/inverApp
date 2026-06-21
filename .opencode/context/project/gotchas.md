<!-- Context: project/gotchas | Priority: critical | Version: 1.0 | Updated: 2026-06-21 -->

# Gotchas & Pitfalls

Real traps that have bitten (or will bite) devs working on this project.

---

## Mozaic UI

### MStatusNotification prop names

WRONG: `<MStatusNotification variant="success" message="..." />`
RIGHT: `<MStatusNotification status="success" title="..." description="..." />`

Three props: `status` (string), `title` (string), `description` (string). Optional: no slot.

### MButton size values

WRONG: `<MButton size="small">`
RIGHT: `<MButton size="s">`

Mozaic uses `s`/`m`/`l`. Not the Bootstrap-style `sm`/`md`/`lg` and not `small`.

### MField + MTextInput id binding

`MField` requires `id`. `MTextInput` (inside it) requires the same `id`. `MDatepicker` same.

```vue
<MField id="tx-qty" label="Quantity">
  <MTextInput id="tx-qty" v-model="quantity" />
</MField>
```

If you omit `id` on MField, focus management breaks. If ids don't match, label click doesn't focus input.

### MTextInput `input-type` (not `type`)

WRONG: `<MTextInput type="number">`
RIGHT: `<MTextInput input-type="number">`

### MDataTable requires CSS import

```ts
import { MDataTable } from '@mozaic-ds/datatable-vue'
import '@mozaic-ds/datatable-vue/style.css'  // mandatory
```

Forgetting the CSS gives you a working table with zero styling.

### MPopover teleports to body

`MPopover` content is rendered via `<Teleport to="body">`. Scoped styles on the activator component **do not apply** to the popover body. You need an unscoped `<style>` block (without `scoped`) for `.app-header__menu*` classes.

Pattern from `AppHeader.vue`:

```vue
<style>           <!-- unscoped -->
.app-header__menu { ... }
</style>

<style scoped>    <!-- scoped -->
.app-header__nav { ... }
</style>
```

### MCombobox search is boolean

WRONG: `<MCombobox :search="searchQuery">` (binding a string)
RIGHT: `<MCombobox :search="true">` (enables the search feature)

---

## Sass / PostCSS

### Mozaic PostCSS pipeline uses legacy sass.render()

The `@mozaic-ds/css-dev-tools` package and its PostCSS plugin still call `sass.render()` and `sass.renderSync()` (legacy API). Dart Sass 1.100+ logs deprecation warnings.

`scripts/sass-modern.cjs` wraps the modern `compileString()` API in a `render()`/`renderSync()` shim that silences the deprecation. Wired via `mozaic.config.cjs`:

```js
sass: {
  config: {
    ...
    sass: require('./scripts/sass-modern.cjs'),
  },
}
```

**Do NOT remove or replace this wrapper** unless you also remove Mozaic's PostCSS plugin (which would break the design system). If you see "legacy JS API deprecated" warnings on build, this wrapper is being bypassed.

### postcss.config.cjs syntax

`module.exports = { syntax: scssSyntax, plugins: pluginList }` — `syntax: scssSyntax` (from `postcss-scss`) is required so PostCSS parses SCSS, not plain CSS. Don't replace with the standard PostCSS config.

### Vite SCSS deprecations

`vite.config.ts` already silences `legacy-js-api`:

```ts
css: {
  preprocessorOptions: {
    scss: { silenceDeprecations: ['legacy-js-api'] },
  },
}
```

If more SCSS deprecations appear (e.g. `import`), add them here.

---

## pnpm

### `.npmrc` requires `verify-deps-before-run=false`

`verify-deps-before-run=true` (pnpm default in 11+) fails on install with "Lockfile is incompatible with current projects" if you ever run `pnpm install` after editing `package.json` without running `pnpm install --lockfile-only`.

`verify-deps-before-run=false` makes pnpm skip the check. Keeps `pnpm dev` / `pnpm build` fast.

---

## Supabase / RLS

### Assets: authenticated users can SELECT, but only INSERT (not UPDATE)

`assets` policies:
- SELECT: any authenticated user
- INSERT: authenticated (with symbol+name check) OR service_role
- UPDATE: service_role only
- DELETE: service_role only

This means the catalog is "append-only" from the client. If you need to rename an asset, use a migration or service_role script.

### assets.symbol is UNIQUE

The `upsertAsset()` INSERT-then-SELECT-on-conflict pattern depends on this. **Do not remove the unique constraint** without rewriting the upsert.

### get_transaction_history has a defensive oversell check (but doesn't block)

```sql
if rec.quantity > running_qty then
  raise notice 'Sell quantity (%) exceeds holdings (%) for asset %', rec.quantity, running_qty, rec.symbol;
  rec.quantity := running_qty;
end if;
```

This MUTATES the output row's quantity to `running_qty` if oversold. The INSERT in `transactions` table is **not blocked** — only the historical view shows clamped quantity.

The real guard lives in `useTransactionStore.addTransaction` (client-side fetch + compare). Don't rely on the RPC to enforce.

### Portfolio view filters out net_qty ≤ 0

```sql
where coalesce(b.total_qty, 0) - coalesce(s.total_qty, 0) > 0;
```

Sold-out positions don't appear in the dashboard. They DO appear in History tab (via RPC). This is intentional.

### Supabase 2026: explicit GRANTs required

Post-May-2026, Supabase no longer auto-exposes `public.*` tables to PostgREST. Every new table needs:

```sql
grant select on public.<table> to authenticated, service_role;
grant insert on public.<table> to authenticated, service_role;
-- + update/delete as appropriate
```

Forgetting GRANTs = `permission denied for table X` at runtime. Existing tables (`profiles`, `assets`, `transactions`, `portfolio`, `watchlist`) all have explicit GRANTs.

---

## Auth

### `auth.init()` is guarded by `initialized` flag

```ts
let initialized = false
async function init() {
  if (initialized) return
  initialized = true
  ...
}
```

Safe to call multiple times. **Always call from `App.vue` `onMounted`** — `init()` both restores session AND subscribes to `onAuthStateChange`. Without the subscribe, `signOut()` from another tab won't update this tab's UI.

### Session check vs user check

`supabase.auth.getSession()` returns `{ session }` — use `data.session` to check auth in router guard.
`supabase.auth.getUser()` returns `{ user }` — use `data.user?.id` in store actions for the user_id FK.

If `getUser()` returns null but `getSession()` is non-null, session is stale. Rare in practice.

---

## Pinia / Vue

### Cross-store calls inside action bodies, not at module top

```ts
// WRONG — circular dep risk at import time
import { usePortfolioStore } from './portfolio'
const portfolio = usePortfolioStore()

// RIGHT — lazy resolve
async function addTransaction() {
  const portfolio = usePortfolioStore()
  await portfolio.fetchPortfolio()
}
```

`useTransactionStore` does this for the oversell guard.

### v-model on Mozaic components

`MDatepicker v-model="date"` binds to ISO string `YYYY-MM-DD`. Storing this in `ref<string>(new Date().toISOString().slice(0, 10))` works. Don't bind to a `Date` object — Mozaic expects string.

---

## Yahoo Finance

### Dev proxy bypasses CORS; prod needs real proxy

Vite proxy in `vite.config.ts` rewrites `/api/yahoo/*` → `query2.finance.yahoo.com`. In production, this rewrite doesn't exist — `fetch('/api/yahoo/...')` would 404 unless you deploy a Cloudflare Worker / Netlify rewrite.

### Yahoo returns non-JSON on rate-limit

If you hit Yahoo too fast, you may get an HTML error page or empty body. `searchAssets` does `if (!res.ok) return []` — silent. `fetchPrices` throws on `!res.ok` but the `Promise.allSettled` wrapper means a rejected promise is silently dropped, leaving the symbol missing from the result map.

No retry logic. No backoff. Add if you start hitting limits.

### `inferAssetType` filters out bond/commodity/forex from search

Yahoo's search returns `quoteType: BOND`, `COMMODITY`, `CURRENCY` but `inferAssetType()` returns `null` for these → filtered out. The DB enum supports them and seed.sql has examples. **Bug**: search won't find them. Fix by extending the switch + EXCHANGE_CURRENCY map.

---

## TypeScript

### `erasableSyntaxOnly: true`

Disallows TS syntax that requires runtime emit (enums, namespaces, parameter properties). Use `const` objects + union types instead.

```ts
// WRONG (enum)
enum AssetType { Stock, Crypto }

// RIGHT (union + const)
const AssetType = { Stock: 'stock', Crypto: 'crypto' } as const
type AssetType = (typeof AssetType)[keyof typeof AssetType]
```

Or just plain union: `type AssetType = 'stock' | 'crypto'`

### `noUnusedLocals` / `noUnusedParameters`

Triggers on unused imports, unused function params. Prefix with `_` to silence: `function fn(_unused: string) {}`.

### Vue SFC type imports

`defineProps<{ ... }>()` infers from inline types. For shared types, import from `@/types/portfolio` etc.

---

## Build / dev

### `pnpm build` runs `vue-tsc -b && vite build`

vue-tsc type-checks ALL `.vue` files via project references (`tsconfig.app.json`, `tsconfig.node.json`). Build fails on ANY type error. Don't skip with `|| true`.

### tsconfig.app.json paths

`"@/*": ["./src/*"]` — both tsconfig and Vite alias must match. They do.

### Vite 8 + Vue plugin

`@vitejs/plugin-vue: ^6.0.7` for Vite 8. Don't downgrade Vite without checking plugin compat.

---

## CSS

### Scoped styles don't pierce Teleport

`<style scoped>` adds `data-v-xxx` attribute selector to root + children of the SFC. When `MPopover` or `NameCell` teleport content to `<body>`, that content does NOT get the data attribute → scoped styles don't apply.

Solution: split into `<style>` (unscoped, for teleported content) + `<style scoped>` (for in-component).

### BEM name collisions across SFCs

Two components can both use `.ex-tag` class. Since both SFCs use scoped styles, this is fine — each gets a unique data attribute. **But** unscoped styles (like `DataTable.vue`'s `.ex-tag`) apply globally.

If you copy a class name into a new unscoped block, you'll affect all components.
