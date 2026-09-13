# Setup Guide

For any developer (including future-you) picking this project up.

## Prerequisites
- Node.js 20+
- npm (or pnpm/yarn — examples below use npm)
- A PostgreSQL database (local install, or a free Neon/Railway/Supabase instance)

## First-time setup
```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in real values
cp .env.example .env.local

# 3. Push the schema to your database (creates tables)
npx prisma migrate dev --name init

# 4. (Phase 2+) Seed sample category/product data
npx prisma db seed

# 5. Run the dev server
npm run dev
```
App runs at http://localhost:3000

## Environment variables
See `.env.example` for the full list with comments. At minimum you need:
- `DATABASE_URL` — Postgres connection string
- `NEXTAUTH_SECRET` — random string for session encryption
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — from Phase 5 onward
- `CLOUDINARY_URL` (or equivalent) — from Phase 2 onward, for image/design uploads

## Useful commands
```bash
npx prisma studio        # visual DB browser
npx prisma migrate dev   # apply a new schema change as a migration
npm run build            # production build
npm run lint              # lint check
```

## Where to look first
1. `docs/00-PROJECT-OVERVIEW.md` — what this project is and who it's for
2. `docs/01-ARCHITECTURE.md` — how it's built and why
3. `docs/04-PAGES-AND-FEATURES.md` — what's actually done vs. still planned
4. `docs/05-CHANGELOG.md` — history of decisions, phase by phase
