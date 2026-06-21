<!-- Context: project/ui-system | Priority: high | Version: 1.0 | Updated: 2026-06-21 -->

# UI System

## Mozaic Design System (ADEO)

All UI components from `@mozaic-ds/vue` v2.19+. DataTable from separate package `@mozaic-ds/datatable-vue`. Icons from `@mozaic-ds/icons-vue` (32px variants).

### Component prefix

All Mozaic components use `M` prefix: `MButton`, `MTile`, `MTextInput`, `MStatusNotification`, `MLoader`, `MTabs`, `MPopover`, `MPageHeader`, `MField`, `MDatepicker`, `MDataTable`.

### Import patterns

```ts
import { MButton, MTile, MTextInput, MField, MDatepicker } from '@mozaic-ds/vue'
import { MDataTable } from '@mozaic-ds/datatable-vue'
import '@mozaic-ds/datatable-vue/style.css'   // must import CSS too
import { Settings32, LogOut32, ChevronDown32 } from '@mozaic-ds/icons-vue'
```

Global CSS: imported once in `main.ts`:
```ts
import '@mozaic-ds/vue/style.css'
import './styles/global.css'
import './styles/table.css'
```

### Mozaic prop quirks (TRIPS people up)

| Component | Gotcha |
|-----------|--------|
| `MButton` | `size="s"` (NOT `"small"`), `variant="primary\|secondary"`, `appearance="standard"`, `ghost` for borderless, `icon-position="left"` |
| `MStatusNotification` | Props: `title`, `description`, `status` (NOT `variant` or `message`) |
| `MField` / `MTextInput` | Both require `id` prop (same value) |
| `MTextInput` | `input-type="number"` (NOT `type="number"`), `is-invalid`, `is-clearable` |
| `MDatepicker` | Binds `v-model` to ISO date string `YYYY-MM-DD` |
| `MDataTable` | Separate package `@mozaic-ds/datatable-vue`, needs CSS import |
| `MCombobox` | `search` prop is **boolean** (not string) |
| `MTabs` | `tabs` array of `{ id, label }`, v-model on `id` string |
| `MPopover` | Slot `#activator` scoped `{ id }` for the trigger button |
| `MPageHeader` | Slot `#actions` for right-side actions |
| `MTile` | `bordered` (boolean) for outlined card |

**Source**: AGENTS.md "Mozaic UI Gotchas" + observed in code.

### Current components used

- `MButton` — buttons everywhere
- `MTile` — cards (DashboardView, WatchlistTable, etc.)
- `MTextInput`, `MField` — forms (TransactionForm, AssetSearch, SettingsView)
- `MDatepicker` — date input (TransactionForm)
- `MStatusNotification` — success/error banners (BuyView, SellView, SettingsView, PortfolioTab)
- `MLoader` — loading spinners
- `MTabs` — DashboardView tabs
- `MPopover` — AppHeader user menu (teleported to body)
- `MPageHeader` — AppHeader
- `MDataTable` — generic table (DataTable wraps it)
- Icons: `Settings32`, `LogOut32`, `ChevronDown32`

---

## Design tokens (in `src/styles/global.css`)

### Colors

```css
--color-primary:        #2563eb  /* blue-600 */
--color-primary-hover:  #1d4ed8
--color-primary-light:  #eff6ff
--color-surface:        #fafafa  /* warm gray bg */
--color-card:           #ffffff
--color-card-hover:     #f5f5f5
--color-border:         #e5e5e5
--color-border-hover:   #d4d4d4
--color-text:           #171717
--color-text-secondary: #737373
--color-text-muted:     #a3a3a3
--color-success:        #16a34a
--color-success-bg:     #f0fdf4
--color-success-tag-bg: #dcfce7
--color-danger:         #dc2626
--color-danger-bg:      #fef2f2
--color-danger-tag-bg:  #fee2e2
--color-warning-bg:     #fffbeb
--color-purple-bg:      #faf5ff
```

P&L classes (in `table.css`):

```css
.text--gain   { color: var(--color-success); font-weight: 600; }
.text--loss   { color: var(--color-danger);  font-weight: 600; }
.text--muted  { color: var(--color-text-muted); }
```

### Spacing scale (4-based)

`--space-1: 4px, --space-2: 8px, --space-3: 12px, --space-4: 16px, --space-5: 20px, --space-6: 24px, --space-8: 32px, --space-10: 40px, --space-12: 48px`

No `--space-7`, `--space-9`, `--space-11`. Use `var(--space-N)`.

### Radius

`--radius-sm: 6px, --radius-md: 8px, --radius-lg: 12px, --radius-xl: 16px, --radius-full: 9999px`

### Shadows

`--shadow-sm: 0 1px 2px rgba(0,0,0,0.04)` (cards)
`--shadow-md: 0 2px 8px rgba(0,0,0,0.06)` (hover)
`--shadow-lg: 0 4px 16px rgba(0,0,0,0.08)` (popovers)

## Typography

- Font: Inter via Google Fonts (`index.html` preconnect + stylesheet link)
- Weights: 400, 500, 600, 700
- Body: 16px, line-height 1.6
- Headings: line-height 1.3, weight 600
- Anti-aliased: `-webkit-font-smoothing: antialiased`

## Table conventions

`DataTable.vue` is the wrapper. Define `headers` array with:

```ts
interface HeaderDef {
  label: string
  value: string                              // field key on item
  sortable?: boolean
  render?: 'symbol' | 'name' | 'number' | 'currency' | 'pnl' | 'date' | 'tag'
  currencyField?: string                     // item field for currency code (default 'currency')
}
```

Built-in cell renderers handle formatting via `getNumberLocale()`. To override (e.g. custom column), use the named slot `cell.${value}`.

`expandable: true` + `data-key-expand="asset_id"` enables expandable rows; provide `#expandContent="{ item }"` slot.

## BEM in scoped styles

```vue
<style scoped>
.component-name { ... }
.component-name__element { ... }
.component-name--modifier { ... }
</style>
```

Scoped styles get `data-v-*` attribute, so child components' roots are unaffected. Use unscoped `<style>` only when the component teleports content to body (e.g. MPopover menus, NameCell popup).

## Page shells

Three common patterns:

1. **Wide dashboard**: `max-width: 64rem`, padding `var(--space-6)`
2. **Form view (Buy/Sell)**: `max-width: 40rem`, centered
3. **Settings**: `max-width: 860px`

`.page`, `.page__main` utilities in global.css.

## No dark mode

Single light theme. No `prefers-color-scheme` handling. No theme tokens beyond light-mode values.

## Accessibility

Mostly default browser semantics. Some components add:
- `tabindex="0"` on `NameCell` for keyboard focus
- `:focus-visible` outline on `NameCell`
- `@keydown.escape` on `NameCell` to hide popup
- `sr-only` utility class in global.css for screen-reader-only text

Not audited — no axe/lighthouse runs in CI.
