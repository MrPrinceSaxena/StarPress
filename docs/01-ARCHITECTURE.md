# Architecture

## Stack
| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR/SSG for SEO on product & category pages |
| Styling | Tailwind CSS | Utility-first, fast to theme with brand colors |
| Backend | Next.js Route Handlers (`src/app/api/**`) | Same codebase as frontend for now; can be split into a standalone Node/Express service later without changing the DB layer |
| Database | PostgreSQL | Relational — fits categories → products → variants → orders well |
| ORM | Prisma | Schema-as-code, versioned migrations, type-safe queries |
| Auth | NextAuth.js (credentials + optional Google login) | Separate `role` field distinguishes CUSTOMER vs ADMIN |
| Payments | Razorpay | India-first payment gateway (UPI, cards, netbanking) |
| File uploads | Cloudinary (or S3-compatible bucket) | Product images + customer-uploaded designs for Custom Printing |
| Hosting (frontend+backend) | Vercel | Free/low tier suitable for local-scale traffic |
| Hosting (DB) | Neon / Railway / Supabase (managed Postgres) | Free/low tier, easy to upgrade tier later |

## Why this stack (given the constraints)
- **Local scale now, room to grow later**: Next.js + Postgres is a default that
  comfortably handles a few thousand monthly visitors on free/cheap tiers, and scales
  up (more DB compute, CDN caching, edge functions) without switching frameworks.
- **One codebase to start**: frontend and backend living together (API routes) means
  less to set up and document right now. If traffic/complexity grows, the `src/server`
  business logic is written framework-agnostic enough to lift into a separate Express/
  Nest service later (see "Decoupling path" below).
- **Relational DB fits the domain**: categories, products, pricing rules, orders and
  order items are inherently relational (foreign keys, joins) — Postgres is a better
  fit than a document store here.

## Folder structure
```
star-press/
├── docs/                     # All project documentation (this folder)
├── prisma/
│   ├── schema.prisma         # Single source of truth for DB structure
│   └── seed.ts                # (Phase 2) seeds categories/products from client brief
├── public/                   # Static assets (logo, favicon, etc.)
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (storefront)/     # Public-facing pages: /, /shop, /categories, etc.
│   │   ├── admin/            # Admin panel pages (protected)
│   │   └── api/              # Route handlers (backend endpoints)
│   ├── components/           # Reusable UI components
│   ├── lib/                  # Shared utilities (db client, auth config, helpers)
│   └── server/                # Business logic (pricing engine, order logic, etc.)
│                              # kept separate from route handlers so it can be
│                              # lifted into a standalone backend later if needed
├── .env.example               # Documented list of required environment variables
└── package.json
```

## Decoupling path (future scalability note)
Business logic lives in `src/server/`, not directly inside `src/app/api/**/route.ts`
files. Route handlers call into `src/server/`. This means: if Star Press outgrows a
single Next.js deployment, `src/server/` can be extracted into its own Express/Nest
service with minimal rewrite — the route handlers become thin HTTP wrappers either way.

## Environments
- **Local dev**: local Postgres (or a free Neon/Railway dev branch) + `.env.local`
- **Production**: Vercel (frontend/backend) + managed Postgres + Razorpay live keys

## Conventions
- All new pages/features get an entry in `docs/04-PAGES-AND-FEATURES.md` the same
  phase they're built.
- All schema changes go through a Prisma migration (`prisma migrate dev`) — never
  edit the production DB by hand — and get reflected in
  `docs/02-DATABASE-SCHEMA.md`.
- All new API routes get documented in `docs/03-API-REFERENCE.md` before being
  considered "done" for a phase.
