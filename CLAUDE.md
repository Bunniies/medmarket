# MedMarket — Project Context

## What this is

A B2B marketplace for hospital pharmacies to sell/exchange medicines that are close to their expiration date. The idea comes from a real problem observed in Lombardy, Italy: pharmacists manually call colleagues at nearby hospitals to offload expensive medicines before they expire, wasting millions of euros/year. This platform digitizes and scales that process.

The project is a **brainstorming/MVP stage startup** — not in production.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: NextAuth.js v5 (Credentials Provider, JWT, PrismaAdapter)
- **Database**: PostgreSQL (local) via Prisma ORM
- **UI**: Tailwind CSS, Radix UI, Lucide icons, CVA for variants
- **Charts**: Recharts (client-only, loaded with `ssr: false`)
- **Data fetching**: TanStack React Query
- **Email**: Resend (`lib/email.ts`) — order notifications, message notifications, invite emails
- **Validation**: Zod
- **i18n**: next-intl — supports English (`en`) and Italian (`it`)
- **Runtime**: Node.js / TypeScript

## Running locally

Prerequisites: PostgreSQL must be running (`brew services start postgresql@16`).

```bash
npm run dev          # start dev server on localhost:3000
npm run db:push      # sync schema to DB
npm run db:seed      # seed initial data
npm run db:studio    # open Prisma Studio
```

The `.env` file is configured for local dev with:
- `DATABASE_URL` pointing to local `medmarket` DB, user `alessandroconigli`
- `AUTH_SECRET` already set
- `NEXTAUTH_URL=http://localhost:3000`
- `RESEND_API_KEY` — set to your Resend key (get one at resend.com); emails silently fail if missing

### Demo accounts (from seed)

| Email | Password | Hospital | Location |
|-------|----------|----------|----------|
| `admin@niguarda.demo` | `password123` | Ospedale Niguarda | Milan |
| `admin@gemelli.demo` | `password123` | Policlinico Gemelli | Rome |
| `admin@sanmartino.demo` | `password123` | Ospedale San Martino | Genoa |
| `admin@aopd.demo` | `password123` | Azienda Ospedaliera di Padova | Padova |
| `admin@meyer.demo` | `password123` | Ospedale Meyer | Florence |

**Note:** seed hospitals are created with `verified: false`. Approve them via `/admin/hospitals` using a PLATFORM_ADMIN account, or update the seed to set `verified: true`.

### PLATFORM_ADMIN setup

Use `prisma/seed-admin.ts` — edit email/password then run:
```bash
npx tsx prisma/seed-admin.ts
```
For production: `DATABASE_URL="<prod-url>" npx tsx prisma/seed-admin.ts`

## Project structure

```
app/
  layout.tsx                          # minimal root shell — must have <html><body> for Next.js
  [locale]/                           # all routes are locale-prefixed: /en/... and /it/...
    layout.tsx                        # real root layout: html, body, NextIntlClientProvider, Providers
    page.tsx                          # home / marketing page
    privacy/page.tsx                  # Privacy Policy
    terms/page.tsx                    # Terms of Service
    contact/page.tsx                  # Contact page
    (auth)/login                      # login page
    (auth)/register                   # register page; handles ?token= for invite-based signup
    (dashboard)/layout.tsx            # shows VerificationBanner if hospital is unverified
    (dashboard)/dashboard             # stats: active listings, orders, earnings
    (dashboard)/listings              # browse/search/filter marketplace
    (dashboard)/listings/new          # create a new medicine listing
    (dashboard)/listings/[id]         # listing detail + order placement + "Message seller" button
    (dashboard)/orders                # full buyer order history
    (dashboard)/my-listings           # seller's own listings: manage status, view/action orders
    (dashboard)/my-listings/[id]/edit # edit an existing listing
    (dashboard)/profile               # user info, analytics (bought/sold toggle + charts), order history
    (dashboard)/conversations         # messaging inbox (by listing or by contact view)
    (dashboard)/conversations/[id]    # individual chat thread with polling
    (dashboard)/my-hospital           # HOSPITAL_ADMIN: team members + invite staff
    (dashboard)/admin/page.tsx        # PLATFORM_ADMIN: overview — stat cards + Recharts charts
    (dashboard)/admin/hospitals       # PLATFORM_ADMIN: pending + verified hospitals, approve/reject/revoke
    (dashboard)/admin/listings        # PLATFORM_ADMIN: all listings, remove (archive) any listing
    (dashboard)/admin/users           # PLATFORM_ADMIN: all hospital users, deactivate/reactivate
    (dashboard)/admin/logs            # PLATFORM_ADMIN: audit log of all admin actions
  api/
    auth/[...nextauth]                # NextAuth handler
    auth/register                     # registration: standard (new hospital) or invite-based (join existing)
    listings                          # GET (search/filter/paginate) + POST (create — verified only)
    listings/[id]                     # GET + PATCH (edit listing or update status)
    orders                            # GET (buyer orders) + POST (place order — verified only)
    orders/[id]                       # PATCH (update order status — seller only)
    conversations                     # GET (list user's threads) + POST (create/upsert thread)
    conversations/[id]                # GET (thread + messages)
    conversations/[id]/messages       # GET (poll) + POST (send message + notify recipient)
    conversations/[id]/read           # PATCH (mark conversation as read for current user)
    conversations/unread              # GET (count of conversations with unread messages)
    invitations                       # GET (list hospital's invites) + POST (create + send email)
    invitations/[token]               # GET (validate token — used by register page)
    admin/hospitals/[id]              # PATCH (approve/reject/revoke hospital — PLATFORM_ADMIN only)
    admin/listings/[id]               # PATCH (archive listing — PLATFORM_ADMIN only)
    admin/users/[id]                  # PATCH (toggle active — PLATFORM_ADMIN only)
    profile/settings                  # PATCH (update notification preferences)
components/
  layout/Navbar, Providers, LocaleSwitcher, VerificationBanner
  listings/ListingCard, NewListingForm, OrderForm, MyListingsManager
  chat/ChatWindow, ContactSellerButton, ConversationList, UnreadBadge
  profile/ProfileAnalytics, StatsCharts, StatsChartsWrapper, NotificationSettings
  admin/AdminNav, AdminHospitalsManager, AdminListingsManager, AdminUsersManager,
        AdminLogsManager, AdminCharts, AdminChartsWrapper, InviteManager
  ui/Button, Input
i18n/
  routing.ts      # locale config (locales: ['en', 'it'], defaultLocale: 'en')
  request.ts      # next-intl server config (loads messages per locale)
  navigation.ts   # locale-aware Link, redirect, useRouter, usePathname
messages/
  en.json         # English strings
  it.json         # Italian strings
lib/
  db.ts           # Prisma singleton
  utils.ts        # cn, formatPrice, formatDate, isExpiringSoon, isExpired, haversineKm
  validations.ts  # Zod schemas: register, inviteRegister, login, listing, order
  geocode.ts      # Nominatim geocoding (city → lat/lng, best-effort)
  email.ts        # Resend helpers: sendOrderNotification, sendMessageNotification, sendInvitationEmail
types/index.ts    # extended Prisma types + API input types
prisma/
  schema.prisma   # full DB schema
  seed.ts         # seed script (5 hospitals, 5 users, 10 listings, 27 orders)
  seed-admin.ts   # one-off script to create PLATFORM_ADMIN user (safe to re-run, upsert)
```

## i18n notes

- All page/component navigation uses `Link`, `useRouter`, `redirect` from `@/i18n/navigation` (not `next/link` or `next/navigation`)
- Server components use `getTranslations('namespace')` from `next-intl/server`
- Client components use `useTranslations('namespace')` from `next-intl`
- `setRequestLocale(locale)` must be called in every server page/layout that receives `params`
- `params` in Next.js 15 is a `Promise<{ locale: string }>` — always `await` it
- The locale switcher (`LocaleSwitcher`) is embedded in `Navbar`
- Translation message files are the source of truth for all user-visible strings — **exception**: long-form static pages (`/privacy`, `/terms`, `/contact`) use inline bilingual `CONTENT` objects keyed by locale instead of translation keys, to avoid bloating message files with wall-of-text content. Use single quotes inside body strings to avoid syntax errors from unescaped double quotes.

## Data model (key entities)

- **User** — belongs to a Hospital, has a role (HOSPITAL_ADMIN, HOSPITAL_STAFF, PLATFORM_ADMIN); `emailNotifyMessages` boolean preference; `active` boolean (false = cannot log in)
- **Hospital** — has `verified` flag + `latitude`/`longitude` (set via Nominatim geocoding on registration)
- **Listing** — the medicine for sale: name, ATC code, batch number, expiry date, quantity, price, condition (SEALED/OPENED), status (ACTIVE/SOLD/EXPIRED/ARCHIVED/PENDING_REVIEW)
- **Order** — links buyer (User + Hospital) to a Listing; statuses: PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED/DISPUTED
- **Category** — optional grouping for listings
- **Conversation** — one thread per (listing, initiator) pair (`@@unique`). Tracks `initiatorLastReadAt` and `sellerLastReadAt` for unread state.
- **Message** — belongs to a Conversation; cascades on delete.
- **Invitation** — token-based staff invite: email, hospitalId, status (PENDING/ACCEPTED/EXPIRED), expiresAt (7 days). Used to let HOSPITAL_ADMINs add staff without creating duplicate hospitals.
- **AdminLog** — audit record for every platform admin action: `action` (string enum), `targetType`, `targetId`, `targetName` (denormalized — survives deletion), `performedById`. Actions: HOSPITAL_APPROVED, HOSPITAL_REJECTED, HOSPITAL_REVOKED, LISTING_REMOVED, USER_DEACTIVATED, USER_REACTIVATED.

## Important implementation notes

- **Prisma `Decimal` serialization**: `pricePerUnit` on `Listing` is a Prisma `Decimal` and cannot be passed to Client Components directly. Always convert with `Number()` at the DB boundary.
- **`ssr: false` with `next/dynamic`**: cannot be used in Server Components. Always wrap in a Client Component (see `StatsChartsWrapper`, `AdminChartsWrapper`).
- **Navbar dropdown**: click-based with `useState` + `useRef` click-outside handler (not hover-based, which had a gap bug).
- **Distance filtering**: uses Haversine formula in `lib/utils.ts`. Fetches all hospitals with coordinates, filters by radius, then uses `hospitalId: { in: [...] }` in the Prisma query to keep DB-level pagination correct.
- **Geocoding**: happens at registration time (best-effort, never blocks). Hospitals without coordinates simply don't show the distance filter.
- **Auto-expiry**: on every load of `/my-listings`, a `db.listing.updateMany` flips ACTIVE/PENDING_REVIEW listings past their `expiryDate` to EXPIRED.
- **Chat polling**: `ChatWindow` polls `GET /api/conversations/[id]/messages` every 4 seconds via `setInterval`.
- **Conversation upsert**: `POST /api/conversations` uses Prisma `upsert` on `@@unique([listingId, initiatorId])` — idempotent.
- **Unread tracking**: `initiatorLastReadAt` / `sellerLastReadAt` on `Conversation`. `ChatWindow` marks read on mount, after polls with new messages, and after sending. `UnreadBadge` polls `/api/conversations/unread` every 30s.
- **Verification enforcement**: `POST /api/listings` and `POST /api/orders` return 403 if the user's hospital is not verified. `(dashboard)/layout.tsx` shows `VerificationBanner` for unverified hospitals.
- **Invite flow**: `POST /api/invitations` creates a token + sends email. `/register?token=xxx` pre-fills email, hides hospital fields, joins the existing hospital. Token validated server-side; accepted token → user created as HOSPITAL_STAFF.
- **Hospital rejection**: deletes the hospital and cascades to its users. Use with care.
- **User deactivation**: sets `active = false` on User; checked in `auth.ts` `authorize()` — deactivated users cannot log in. PLATFORM_ADMIN accounts cannot be deactivated.
- **PLATFORM_ADMIN redirects**: `/dashboard` redirects to `/admin` for PLATFORM_ADMIN (hospitalId is null, so hospital-scoped queries would fail). Apply the same pattern to any page that queries by hospitalId. **Important**: use `redirect` from `next/navigation` (not `@/i18n/navigation`) with an explicit locale-prefixed path — e.g. `redirect(\`/\${locale}/admin\`)` — because the i18n redirect can fail to infer the locale in this context and produce a localeless URL that matches no route.
- **Admin audit log**: every admin action writes an `AdminLog` record. `targetName` is denormalized so the log remains readable even after the target is deleted (e.g. rejected hospitals).
- **Email**: all send functions in `lib/email.ts` are fire-and-forget (try/catch, never block the main request).
- **Root layout**: `app/layout.tsx` must render `<html><body>{children}</body></html>` — Next.js requires this even though `[locale]/layout.tsx` is the real layout.

## What's implemented

- User + hospital registration (single flow, geocodes city on creation)
- Login/logout with session
- Create / edit medicine listing (verified hospitals only)
- Browse and search listings (by medicine name, generic name, title, manufacturer)
- **Expiry-based filtering**: Next 7 / 30 / 90 days
- **Distance-based filtering**: < 50 / 100 / 200 / 500 km from the user's hospital
- Listing detail page with full medicine info + order form
- Place orders (transactional, verified hospitals only, prevents over-ordering and self-orders)
- Full order history page (`/orders`)
- **My listings page** (`/my-listings`): split active/past view, auto-expiry, archive/activate, edit, order management (confirm/reject/ship/deliver)
- User profile page (`/profile`): info cards, bought/sold analytics toggle, Recharts charts, notification settings toggle
- Dashboard stats
- **Messaging / chat** (`/conversations`): listing-detail contact button, bubble chat UI, 4s polling, by-listing and by-contact inbox views, unread badge
- **Email notifications** (Resend): order placed → seller, new message → recipient (if opted in), staff invite
- **Hospital verification flow**:
  - `verified` enforced on listing creation and order placement
  - `VerificationBanner` shown on all dashboard pages for unverified hospitals
  - `/admin/hospitals` — PLATFORM_ADMIN approves/rejects/revokes hospitals
  - `/my-hospital` — HOSPITAL_ADMIN manages team members and sends staff invitations
  - Invite-based registration (`/register?token=`) joins existing hospital without duplicating it
- **Full admin panel** (`/admin`):
  - Overview with 6 stat cards (hospitals, listings, orders, users, GMV, avg order value) + 4 Recharts charts (monthly orders/GMV, new hospitals, order status breakdown, top hospitals)
  - Hospital management: pending + verified sections, approve/reject/revoke
  - Listing moderation: all listings platform-wide, remove (archive) any listing
  - User management: all hospital users, deactivate/reactivate (blocks login)
  - Audit log: every admin action recorded with target, actor, timestamp
- **Static pages**: `/privacy`, `/terms`, `/contact`, `/guide` (bilingual user guide with role cards, step-by-step sections, tips; linked from Navbar)
- i18n: English and Italian, with locale switcher in the navbar

## What's missing / next priorities

1. **Image uploads** for listings — Vercel Blob is the simplest integration
2. **Seed fix** — demo hospitals are created `verified: false`; update seed to set `verified: true` or add a PLATFORM_ADMIN seed account
3. **Real-time chat** — upgrade from 4s polling to SSE
4. **PLATFORM_ADMIN experience** — `/dashboard` already redirects to `/admin`; profile/orders/my-listings pages still need guards to redirect platform admins away

## Domain notes

- Medicines use **ATC codes** (Anatomical Therapeutic Chemical classification) for categorization
- Currency is **EUR** by default
- "Expiring soon" threshold is **90 days** (defined in `lib/utils.ts`)
- Target market: hospital pharmacies in Italy (initially Lombardy), with potential to expand EU-wide
- Regulatory context: medicine exchange between hospitals is currently informal/unregulated in Italy — this platform could eventually operate within or help shape that regulatory framework
