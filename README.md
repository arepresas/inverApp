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
| Database | Supabase                                   |
| Language | TypeScript 6                               |
| Tests    | Vitest + jsdom                             |
| Lint     | ESLint + Prettier                          |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start dev server
npm run dev
```

## Scripts


| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Dev server with HMR                 |
| `npm run build`      | TypeScript check + production build |
| `npm run preview`    | Preview production build            |
| `npm run test`       | Run tests once                      |
| `npm run test:watch` | Run tests in watch mode             |
| `npm run lint`       | Lint with ESLint                    |
| `npm run format`     | Format with Prettier                |

## Project Structure

```
src/
├── main.ts              # App entry (Pinia, Router, Mozaic CSS)
├── App.vue              # Root shell with <RouterView>
├── router/index.ts      # Vue Router config
├── views/               # Page components
├── components/          # Reusable UI components
├── stores/              # Pinia stores (auth, portfolio)
├── lib/supabase.ts      # Supabase client
└── assets/              # Static assets
```

## Environment Variables


| Variable                 | Description            |
| ------------------------ | ---------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL   |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
