# InverApp

Investment portfolio tracker — record your asset purchases and sales.

## Stack


| Layer    | Technology                                 |
| -------- | ------------------------------------------ |
| Frontend | Vue 3 + Composition API (`<script setup>`) |
| Build    | Vite 8                                     |
| Routing  | Vue Router 5                               |
| State    | Pinia 3                                    |
| UI       | Mozaic Design System (ADEO)                |
| Auth     | Supabase (Google OAuth)                    |
| Database | Supabase (PostgreSQL 15)                   |
| Language | TypeScript 6                               |
| Tests    | Vitest + jsdom                             |
| Lint     | ESLint + Prettier                          |

## Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- Docker (required by Supabase CLI for local dev)
- [Supabase CLI](https://supabase.com/docs/guides/cli) — installed as devDependency

## Getting Started

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
# → http://localhost:5173
```

## Environment

InverApp uses **two Supabase projects**: one for development, one for production. Switch between them by changing `.env`.

### Setup

1. Create two projects in [Supabase Dashboard](https://supabase.com/dashboard):

   - `inverapp-dev`
   - `inverapp-prod`
2. For each, get the URL and anon key from **Settings → API**.
3. Point `.env` to the environment you want:

```bash
# .env — development (default)
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> The frontend always reads from `.env`. The database scripts (`db:*`) work against a **local** Supabase stack, not the cloud projects.

## Database: dev vs prod


|                    | Dev (local)                            | Prod (cloud)                    |
| ------------------ | -------------------------------------- | ------------------------------- |
| **Where**          | `npm run db:start` (Docker containers) | Supabase cloud project          |
| **PostgreSQL**     | `localhost:54322`                      | `<project>.supabase.co`         |
| **Studio UI**      | `http://localhost:54323`               | Supabase Dashboard              |
| **Schema changes** | `npm run db:migrate:up`                | `npm run db:push`               |
| **Full reset**     | `npm run db:reset`                     | ❌ never on prod                |
| **Seed data**      | Automatic with`db:reset`               | Manual via Dashboard SQL Editor |

### Dev workflow

```bash
npm run db:start         # Start local Supabase (PostgreSQL + Studio + Auth)
npm run db:reset         # Apply migrations + seed (27 assets)
npm run dev              # Frontend → http://localhost:5173

# After changing the schema:
npm run db:migrate:new -- add_column   # Create empty migration file
# ... write your SQL in supabase/migrations/<timestamp>_add_column.sql ...
npm run db:migrate:up                  # Apply to local DB
npm run db:reset                       # Verify full reset still works
```

### Prod workflow

```bash
# Login in web browser
npx supabase login

# One-time: link to your cloud project
npx supabase link --project-ref <prod-project-id>

# Deploy migrations
npm run db:push

# First time on a new project, also run the seed:
# Dashboard → SQL Editor → paste supabase/seed.sql
```

### Local Supabase services


| Service          | URL                      | Credentials             |
| ---------------- | ------------------------ | ----------------------- |
| PostgreSQL       | `localhost:54322`        | `postgres` / `postgres` |
| Supabase Studio  | `http://localhost:54323` | —                      |
| Inbucket (email) | `http://localhost:54324` | —                      |

Connection string: `postgresql://postgres:postgres@localhost:54322/postgres`

## Scripts

### Frontend


| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Dev server with HMR                 |
| `npm run build`      | TypeScript check + production build |
| `npm run preview`    | Preview production build            |
| `npm run test`       | Run tests once                      |
| `npm run test:watch` | Run tests in watch mode             |
| `npm run lint`       | Lint with ESLint                    |
| `npm run format`     | Format with Prettier                |

### Database


| Command                         | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `npm run db:start`              | Start local Supabase stack (Docker)                |
| `npm run db:stop`               | Stop local Supabase stack                          |
| `npm run db:reset`              | Reset local DB → apply all migrations → run seed |
| `npm run db:migrate:new -- <name>` | Create new migration file |
| `npm run db:migrate:up`         | Apply pending migrations to local DB               |
| `npm run db:migrate:list`       | Compare local vs remote migration state            |
| `npm run db:push`               | Deploy migrations to cloud Supabase project        |
| `npm run db:diff -- <name>` | Generate migration from schema diff |

## Database Schema

```
profiles ──< transactions >── assets
                │
                ▼
           portfolio (view)
```

### Tables

#### `profiles`

User profiles linked to Supabase Auth. Auto-created on Google signup via trigger.


| Column       | Type          | Notes                                      |
| ------------ | ------------- | ------------------------------------------ |
| `id`         | `uuid PK`     | References `auth.users(id)`, cascade delete |
| `email`      | `text`        | From Google OAuth                          |
| `name`       | `text`        | Display name                               |
| `currency`   | `text`        | Default `EUR`                              |
| `created_at` | `timestamptz` |                                            |
| `updated_at` | `timestamptz` | Auto-updated via trigger                   |

#### `assets`

Shared catalog of investable assets. Managed by `service_role`.


| Column       | Type          | Notes                                                           |
| ------------ | ------------- | --------------------------------------------------------------- |
| `id`         | `uuid PK`     | Auto-generated                                                  |
| `symbol`     | `text UNIQUE` | Ticker (AAPL, BTC, VWCE...)                                     |
| `name`       | `text`        | Full name                                                       |
| `asset_type` | `enum`        | `stock`, `crypto`, `etf`, `bond`, `commodity`, `forex`, `other` |
| `currency`   | `text`        | `USD`, `EUR`...                                                 |
| `active`     | `boolean`     | Soft-delete flag                                                |

#### `transactions`

Buy and sell operations. Each row represents one trade.


| Column             | Type            | Notes                                    |
| ------------------ | --------------- | ---------------------------------------- |
| `id`               | `uuid PK`       | Auto-generated                           |
| `user_id`          | `uuid FK`       | References`profiles(id)`, cascade delete |
| `asset_id`         | `uuid FK`       | References`assets(id)`, restrict delete  |
| `transaction_type` | `enum`          | `buy` or `sell`                          |
| `quantity`         | `numeric(18,8)` | Must be > 0                              |
| `price_per_unit`   | `numeric(18,4)` | Must be > 0                              |
| `fees`             | `numeric(18,4)` | Default 0, must be >= 0                  |
| `transaction_date` | `timestamptz`   | When the trade happened                  |
| `notes`            | `text`          | Optional                                 |
| `created_at`       | `timestamptz`   |                                          |
| `updated_at`       | `timestamptz`   | Auto-updated via trigger                 |

### Views

#### `portfolio`

Calculated view showing current holdings per user/asset. Uses PPC (Prix de Revient Unitaire / Average Cost) method — buys update the average cost, sells only reduce quantity.


| Column           | Description                        |
| ---------------- | ---------------------------------- |
| `user_id`        | Owner                              |
| `asset_id`       | Asset                              |
| `symbol`         | Ticker                             |
| `name`           | Full name                          |
| `asset_type`     | Category                           |
| `currency`       | Quote currency                     |
| `quantity`       | Remaining quantity (buys − sells) |
| `average_cost`   | Weighted average purchase price    |
| `total_invested` | Cost basis of remaining holdings   |

> Only shows rows where `quantity > 0` (active holdings).
>
> **Known limitation:** the view sums all buys across all time. If you sell all holdings of an asset and buy again later, the average cost will include old purchases. For accurate cost basis in that scenario, use a function or track it in application logic.

### Row Level Security


| Table          | Policy            | Who                                       |
| -------------- | ----------------- | ----------------------------------------- |
| `profiles`     | Read / Update own | `auth.uid() = id`                         |
| `assets`       | Read              | All authenticated                         |
| `assets`       | Write             | `service_role` only                       |
| `transactions` | Full CRUD         | `auth.uid() = user_id`                    |
| `portfolio`    | Read              | Inherits RLS via `security_invoker = true` |

### Migrations

Versioned as timestamped SQL files in `supabase/migrations/`:

```
supabase/migrations/
├── 20250524120000_create_profiles.sql       # Profiles table + trigger + RLS
├── 20250524120001_create_assets.sql         # Asset catalog + enums + RLS
├── 20250524120002_create_transactions.sql   # Buy/sell operations + indexes + RLS
└── 20250524120003_create_portfolio_view.sql # Holdings view (PPC method)
```

### Seed data

`supabase/seed.sql` contains 27 sample assets:


| Type        | Count | Examples                            |
| ----------- | ----- | ----------------------------------- |
| Stocks      | 10    | AAPL, MSFT, TSLA, NVDA, SAN, AIR... |
| Crypto      | 5     | BTC, ETH, SOL, USDT, USDC           |
| ETFs        | 5     | VWCE, CSPX, IWDA, EQQQ, MEUD        |
| Bonds       | 2     | AGG, BND                            |
| Commodities | 3     | XAU, XAG, CL                        |
| Forex       | 2     | EURUSD, GBPUSD                      |

## Auth

Google OAuth via Supabase Auth. Configure it in your Supabase project:

1. **Authentication → Providers → Google**
2. Enable and set up OAuth credentials
3. Add `http://localhost:5173` to authorized redirect URLs

The frontend store (`src/stores/auth.ts`) handles the OAuth flow:

- `init()` — restores session on page load, idempotent
- `signInWithGoogle()` — initiates OAuth redirect
- `signOut()` — clears session

## Project Structure

```
src/
├── main.ts              # App entry (Pinia, Router, Mozaic CSS)
├── App.vue              # Root shell with <RouterView>
├── router/index.ts      # Vue Router config
├── views/HomeView.vue   # Landing page (login/logout)
├── components/          # Reusable UI components
├── stores/auth.ts       # Auth store (Supabase Google OAuth)
├── lib/supabase.ts      # Supabase client
└── assets/              # Static assets

supabase/
├── config.toml          # Supabase CLI configuration
├── migrations/          # Versioned SQL migrations (4 files)
└── seed.sql             # 27 sample assets

scripts/
└── sass-modern.cjs      # Sass legacy API wrapper (Mozaic compatibility)
```

## Environment Variables


| Variable                 | Description                     |
| ------------------------ | ------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL            |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |

> Copy `.env.example` to `.env`. Database scripts use the local Supabase stack, not these variables.
