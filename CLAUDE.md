# MedMarket

B2B marketplace for hospital pharmacies to sell/exchange near-expiry medicines. MVP stage, deployed on Vercel + Neon PostgreSQL.

## Tech stack

Next.js 16 (App Router) · NextAuth.js v5 beta (JWT + PrismaAdapter, **pinned** to `5.0.0-beta.25` — no `^`, upgrade explicitly) · Prisma + PostgreSQL · Tailwind + Radix UI · Recharts (client-only, `ssr:false`) · TanStack React Query · Resend (email) · Zod · next-intl (en/it) · TypeScript · papaparse (CSV) · @zxing/browser + @zxing/library (barcode scanning) · @upstash/ratelimit + @upstash/redis (login rate limiting) · @anthropic-ai/sdk (AI category suggestion)

## Local dev

```bash
brew services start postgresql@16
npm run dev          # localhost:3000
npm run db:push      # sync schema
npm run db:seed      # seed demo data
npm run db:studio    # Prisma Studio
```

## Deployment (Vercel + Neon)

Auto-deploys on push to `main`. Required env vars: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`.

Optional env vars (features silently degrade without them — see `.env.example`):
- `RESEND_API_KEY` — all email flows no-op without it; needs custom domain in Resend dashboard + `FROM` update in `lib/email.ts`
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — login rate limiting (10 attempts/15 min per IP); disabled when absent
- `ANTHROPIC_API_KEY` — AI-powered category suggestion in the listing form; "Suggest with AI" button hidden when absent

- `postinstall: prisma generate` in `package.json` handles Prisma Client on build
- PLATFORM_ADMIN setup: `DATABASE_URL="<neon-url>" npx tsx prisma/seed-admin.ts` (never commit credentials)
- Demo data: `DATABASE_URL="<neon-url>" npx tsx prisma/seed.ts`

## Next priorities

1. **Barcode scanning** — investigate and fix `@zxing` GS1 DataMatrix reading; likely not working reliably in the browser
2. **Image uploads** — Vercel Blob
3. **Real-time chat** — upgrade 4s polling to SSE
4. **Resend setup** — add custom domain in Resend dashboard, update `FROM` in `lib/email.ts`, add `RESEND_API_KEY` to Vercel env vars

## Categories (2026-03-29)

Full ATC first-level coverage now seeded. 15 categories total:

| Slug | ATC | Icon |
|------|-----|------|
| oncology | L | 🔬 |
| cardiology | C | ❤️ |
| neurology | N | 🧠 |
| immunology | I | 🛡️ |
| antibiotics | J / P | 💊 |
| anesthesiology | — | 😴 |
| gastroenterology | A | 🫁 |
| hematology | B | 🩸 |
| dermatology | D | 🩹 |
| gynecology | G | 🌸 |
| endocrinology | H | ⚗️ |
| rheumatology | M | 🦴 |
| respiratory | R | 🫀 |
| ophthalmology | S | 👁️ |
| urology | — | 💧 |

ATC first-letter → slug mapping lives in `components/listings/NewListingForm.tsx` (`ATC_FIRST_LETTER_TO_SLUG`). Covers A, B, C, D, G, H, I, J, L, M, N, P, R, S.

## Listing form — recent changes (2026-03-28)

Fields renamed (i18n only, no DB column rename):
- `medicineName` → Farmaco commerciale / Commercial name
- `genericName` → Principio attivo / Active ingredient — **now required**
- `unit` → Forma/Dosaggio / Form/Dosage
- `quantity` → Quantità iniziale / Initial quantity

New DB fields added to `Listing` (run `prisma db push` on production):
- `aicCode String?` — AIC code, **required in form**
- `remainingQuantity Int?` — initialized to `quantity` on create; shown in listing cards/detail; editable in the edit form only
- `totalValue Decimal?` — auto-computed as `quantity × pricePerUnit` on submit; shown as read-only in the form, displayed in listing detail
- `storageCondition String?` — dropdown: `2–8°C | 8–15°C | 15–20°C | <25°C`

Category auto-detection (`components/listings/NewListingForm.tsx`):
- ATC code first letter triggers instant auto-select (full ATC coverage: A→gastroenterology, B→hematology, C→cardiology, D→dermatology, G→gynecology, H→endocrinology, I→immunology, J→antibiotics, L→oncology, M→rheumatology, N→neurology, P→antibiotics, R→respiratory, S→ophthalmology)
- "Suggest with AI" button (visible when `ANTHROPIC_API_KEY` set + medicine name filled) calls `POST /api/listings/suggest-category` — uses `claude-haiku-4-5-20251001` to pick the best category from the full list
- Auto-detected category shows an inline badge; user can always override manually

## Seed data (2026-03-29)

Demo listings refreshed — all now include `aicCode`, `remainingQuantity`, `totalValue`, `storageCondition`. Medicine names in Italian. Covers: Oncology, Gastroenterology, Hematology, Antibiotics, Respiratory, Immunology, Neurology. Run `npx tsx prisma/seed.ts` to apply (deletes all orders + listings, then recreates).

## Domain

- ATC codes for medicine categorization · EUR currency · "Expiring soon" = 90 days (`lib/utils.ts`)
- Target: Italian hospital pharmacies (Lombardy first), potential EU expansion
- Medicine exchange is currently informal/unregulated in Italy

## Sub-directory guides

- `app/CLAUDE.md` — routes, i18n rules, implementation gotchas
- `prisma/CLAUDE.md` — data model, seed accounts, DB ops
