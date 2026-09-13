# Changelog

Reverse-chronological log of what was actually built each phase, plus decisions made
and open questions. This is the audit trail for the whole project.

---

## Phase 0 — Project Scaffold, Docs & DB Schema Draft
**Date:** 2026-09-13

**Built:**
- Repo folder structure (`src/app`, `src/components`, `src/lib`, `src/server`, `prisma`, `docs`)
- Documentation skeleton: this file plus `00` through `06`
- Draft Prisma schema covering Users/Auth, Catalog, Cart/Orders, Reviews, and lead
  forms (Bulk Order & Contact inquiries) — see `docs/02-DATABASE-SCHEMA.md`
- `package.json`, base configs (`tsconfig`, `next.config`, `tailwind.config`,
  `postcss.config`), `.env.example`, `.gitignore`
- Minimal running Next.js shell (root layout + placeholder home page) so the repo
  boots before any real feature is built

**Decisions made:**
- Stack confirmed: Next.js + TypeScript + Tailwind + Prisma/PostgreSQL + NextAuth +
  Razorpay + Vercel — see `docs/01-ARCHITECTURE.md` for reasoning
- Business logic will live in `src/server/`, separate from route handlers, to keep a
  future decoupling option open
- `PricingRule` model is a deliberate placeholder — real size/quantity/text pricing
  logic is designed in Phase 2, not now

**Open questions / deferred:**
- Guest checkout vs. forced account creation — decide in Phase 3
- Whether admin panel needs multiple staff accounts or just one owner login — revisit
  if the client asks for it
- Exact Razorpay account setup (client needs to provide their own Razorpay
  business account credentials before Phase 5)

**Not yet built:** everything under "🔲 Planned" in `docs/04-PAGES-AND-FEATURES.md`

---
