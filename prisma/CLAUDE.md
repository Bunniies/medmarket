# Prisma — Data Model & DB Ops

## Data model

- **User** — role: `HOSPITAL_ADMIN | HOSPITAL_STAFF | PLATFORM_ADMIN`; `emailNotifyMessages` bool; `active` bool (false = cannot log in)
- **Hospital** — `verified` flag; `latitude`/`longitude` (Nominatim geocoding on registration)
- **Listing** — medicine for sale: name, ATC code, batch, expiry, qty, price, condition (`SEALED` only in UI; `OPENED` kept in enum for legacy), status (`ACTIVE|SOLD|EXPIRED|ARCHIVED|PENDING_REVIEW`)
- **Order** — buyer (User+Hospital) → Listing; statuses: `PENDING|CONFIRMED|SHIPPED|DELIVERED|CANCELLED|DISPUTED`
- **Category** — optional listing grouping
- **Conversation** — unique per `(listingId, initiatorId)`; tracks `initiatorLastReadAt` / `sellerLastReadAt`
- **Message** — belongs to Conversation, cascades on delete
- **Invitation** — token-based staff invite; status `PENDING|ACCEPTED|EXPIRED`; expires 7 days
- **AdminLog** — audit: `action`, `targetType`, `targetId`, `targetName` (denormalized), `performedById`. Actions: `HOSPITAL_APPROVED|REJECTED|REVOKED`, `LISTING_REMOVED`, `USER_DEACTIVATED|REACTIVATED`
- **MedicineAlert** — `userId`, `medicineName`, `atcCode?`, `maxDistanceKm?`, `active`; matched against new listings on creation
- **VerificationToken** — used for password reset (identifier=email, 1h expiry); also reserved by NextAuth for email verification

## Scripts

```bash
npm run db:push      # sync schema (local)
npm run db:seed      # seed demo data (local)
npm run db:studio    # Prisma Studio
npx tsx prisma/seed-admin.ts                          # create PLATFORM_ADMIN (local)
DATABASE_URL="<url>" npx tsx prisma/seed-admin.ts     # production
DATABASE_URL="<url>" npx tsx prisma/seed.ts           # seed demo data (production)
```

## Demo accounts (seed)

| Email | Password | Hospital | City |
|-------|----------|----------|------|
| `admin@niguarda.demo` | `password123` | Ospedale Niguarda | Milan |
| `admin@gemelli.demo` | `password123` | Policlinico Gemelli | Rome |
| `admin@sanmartino.demo` | `password123` | Ospedale San Martino | Genoa |
| `admin@aopd.demo` | `password123` | AO di Padova | Padova |
| `admin@meyer.demo` | `password123` | Ospedale Meyer | Florence |

Seed hospitals are created with `verified: false` — approve via `/admin/hospitals` or set `verified: true` in seed.

## Notes

- `seed-admin.ts` is safe to re-run (upsert). Never commit real credentials — `git checkout prisma/seed-admin.ts` after production use.
- `postinstall: prisma generate` in `package.json` ensures Prisma Client is generated on Vercel build.
- Schema changes (e.g. new tables) require `DATABASE_URL="<neon-url>" npx prisma db push` against production — Vercel does NOT run this automatically.
