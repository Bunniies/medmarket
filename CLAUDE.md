# MedMarket

B2B marketplace for hospital pharmacies to sell/exchange near-expiry medicines. MVP stage, deployed on Vercel + Neon PostgreSQL.

## Tech stack

Next.js 16 (App Router) · NextAuth.js v5 (JWT + PrismaAdapter) · Prisma + PostgreSQL · Tailwind + Radix UI · Recharts (client-only, `ssr:false`) · TanStack React Query · Resend (email) · Zod · next-intl (en/it) · TypeScript

## Local dev

```bash
brew services start postgresql@16
npm run dev          # localhost:3000
npm run db:push      # sync schema
npm run db:seed      # seed demo data
npm run db:studio    # Prisma Studio
```

## Deployment (Vercel + Neon)

Auto-deploys on push to `main`. Required env vars: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`.

- `postinstall: prisma generate` in `package.json` handles Prisma Client on build
- PLATFORM_ADMIN setup: `DATABASE_URL="<neon-url>" npx tsx prisma/seed-admin.ts` (never commit credentials)
- Demo data: `DATABASE_URL="<neon-url>" npx tsx prisma/seed.ts`

## Next priorities

1. **Image uploads** — Vercel Blob
2. **Real-time chat** — upgrade 4s polling to SSE
3. **PLATFORM_ADMIN guards** — profile/orders/my-listings pages need redirects to `/admin`
4. **Browse listings** — already gated to logged-in users
5. **Resend setup** — add custom domain in Resend dashboard, update `FROM` in `lib/email.ts`, add `RESEND_API_KEY` to Vercel env vars (password reset + medicine alerts emails are all wired up but silently no-op without the key)

## Domain

- ATC codes for medicine categorization · EUR currency · "Expiring soon" = 90 days (`lib/utils.ts`)
- Target: Italian hospital pharmacies (Lombardy first), potential EU expansion
- Medicine exchange is currently informal/unregulated in Italy

## Sub-directory guides

- `app/CLAUDE.md` — routes, i18n rules, implementation gotchas
- `prisma/CLAUDE.md` — data model, seed accounts, DB ops
