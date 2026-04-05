# App — Routes & Implementation Notes

## Route structure

```
[locale]/                        # /en/... and /it/...
  layout.tsx                     # real root: html, body, NextIntlClientProvider, Providers
  page.tsx                       # home / marketing
  privacy|terms|contact|guide    # static bilingual pages
  (auth)/login                   # login — useSearchParams wrapped in <Suspense>; ?reset=1 shows success banner
  (auth)/register                # register; ?token= for invite-based signup
  (auth)/forgot-password         # request password reset email
  (auth)/reset-password          # set new password via ?token= link (1h expiry, uses VerificationToken)
  (dashboard)/layout.tsx         # owns <Navbar />, <DashboardSidebar />, bg; shows VerificationBanner if unverified
  (dashboard)/dashboard          # stats cards
  (dashboard)/listings           # browse/search/filter
  (dashboard)/listings/new       # create listing (verified only); links to /listings/import
  (dashboard)/listings/import    # bulk CSV import (drag/drop → preview table → publish); uses CsvImporter
  (dashboard)/listings/[id]      # detail + order form + "Message seller"
  (dashboard)/orders             # buyer order history
  (dashboard)/my-listings        # seller: manage listings + orders; auto-expiry on load
  (dashboard)/my-listings/[id]/edit
  (dashboard)/profile            # analytics charts, notification toggle, environmental impact card
  (dashboard)/conversations      # messaging inbox
  (dashboard)/conversations/[id] # chat (4s polling)
  (dashboard)/my-hospital        # HOSPITAL_ADMIN: team + invite staff
  (dashboard)/admin/             # PLATFORM_ADMIN: stats + charts + platform-wide environmental impact
  (dashboard)/admin/hospitals    # approve/reject/revoke
  (dashboard)/admin/listings     # remove (archive) any listing
  (dashboard)/admin/users        # deactivate/reactivate
  (dashboard)/admin/logs         # audit log
  (dashboard)/alerts             # medicine alerts: create/delete; notified on matching new listing
api/
  auth/[...nextauth]             # NextAuth handler
  auth/register                  # standard (new hospital) or invite-based
  auth/forgot-password           # POST — creates VerificationToken, sends reset email
  auth/reset-password            # POST — validates token, updates passwordHash, deletes token
  listings                       # GET search/filter/paginate · POST create (verified only)
  listings/[id]                  # GET · PATCH edit or update status
  orders                         # GET buyer orders · POST place (verified only)
  orders/[id]                    # PATCH update status (seller only)
  conversations                  # GET threads · POST upsert thread
  conversations/[id]             # GET thread+messages
  conversations/[id]/messages    # GET poll · POST send+notify
  conversations/[id]/read        # PATCH mark read
  conversations/unread           # GET unread count
  invitations                    # GET list · POST create+email
  invitations/[token]            # GET validate
  admin/hospitals/[id]           # PATCH approve/reject/revoke (PLATFORM_ADMIN)
  admin/listings/[id]            # PATCH archive (PLATFORM_ADMIN)
  admin/users/[id]               # PATCH toggle active (PLATFORM_ADMIN)
  profile/settings               # PATCH notification prefs
  alerts                         # GET list · POST create
  alerts/[id]                    # DELETE (soft: active=false)
```

## i18n rules

- Navigation: use `Link`, `useRouter`, `usePathname` from `@/i18n/navigation`
- **`redirect` must use `next/navigation`** (not `@/i18n/navigation`) — use `redirect(\`/\${locale}/path\`)`
- Server: `getTranslations('ns')` from `next-intl/server`; Client: `useTranslations('ns')`
- Call `setRequestLocale(locale)` in every server page/layout receiving `params`
- `params` is `Promise<{ locale: string }>` in Next.js 15 — always `await` it
- Static long-form pages use inline bilingual `CONTENT` objects (not translation keys) — use single quotes inside strings

## Implementation gotchas

- **Prisma Decimal**: `pricePerUnit` is `Decimal` — always convert with `Number()` before passing to client components
- **`ssr: false`**: only usable in Client Components; wrap with a Client Component (e.g. `StatsChartsWrapper`, `AdminChartsWrapper`)
- **`useSearchParams()`**: must be in a child component wrapped in `<Suspense>` (see `login/page.tsx`, `register/page.tsx`)
- **Auth split**: `middleware.ts` uses `auth.config.ts` (edge-safe, no bcryptjs/Prisma). Never import `auth.ts` from middleware.
- **Middleware RBAC**: `adminRoutes` (`/admin`) requires `PLATFORM_ADMIN`; non-admins → `/dashboard`. `platformAdminForbidden` (`/profile`, `/orders`, `/my-listings`) redirects `PLATFORM_ADMIN` → `/admin`. Locale list is read from `routing.locales` — never hardcode `(en|it)` in middleware.
- **Login rate limiting**: `lib/ratelimit.ts` — Upstash sliding window, 10 attempts/15 min per IP. Returns `null` when env vars absent (fails open). Check runs before `bcrypt.compare` in `auth.ts`.
- **Login error codes**: deactivated users get `result.error === "account_deactivated"` (thrown as `AccountDeactivatedError extends CredentialsSignin` in `auth.ts`); generic wrong-password stays `"CredentialsSignin"`.
- **NextAuth types**: `types/next-auth.d.ts` augments `Session`, `User`, and `JWT` with `role: UserRole` and `hospitalId`. No `as any` needed for these fields.
- **Root layout**: `app/layout.tsx` renders `<html lang><body>` using `getLocale()` from next-intl; `[locale]/layout.tsx` must NOT render html/body again — only wraps with providers
- **PLATFORM_ADMIN redirects**: middleware enforces RBAC automatically. For manual server-side redirects use `redirect` from `next/navigation` with explicit locale path (`/\${locale}/admin`) — i18n redirect can produce localeless URLs
- **Distance filtering**: Haversine in `lib/utils.ts`; fetches hospitals with coords, filters by radius, then `hospitalId: { in: [...] }` in Prisma
- **Auto-expiry**: every `/my-listings` load runs `updateMany` flipping past-expiry ACTIVE/PENDING_REVIEW → EXPIRED
- **Chat polling**: `ChatWindow` polls every 4s via `setInterval`; `UnreadBadge` polls `/api/conversations/unread` every 30s
- **Conversation upsert**: idempotent on `@@unique([listingId, initiatorId])`
- **Verification**: `POST /api/listings` and `POST /api/orders` return 403 for unverified hospitals
- **Hospital rejection**: deletes hospital + cascades to users
- **User deactivation**: `active = false`; `authorize()` throws `AccountDeactivatedError` (surfaces as `"account_deactivated"` on the client). PLATFORM_ADMIN cannot be deactivated.
- **Admin audit log**: every admin action writes `AdminLog`; `targetName` denormalized (survives deletion)
- **Email**: all sends are fire-and-forget; Resend initialized lazily — safe without `RESEND_API_KEY`
- **Navbar dropdown**: click-based (`useState` + `useRef` click-outside), not hover-based
- **Dashboard layout**: `<Navbar />` and `<DashboardSidebar />` live in `(dashboard)/layout.tsx` — individual pages must NOT import/render Navbar
- **DashboardSidebar**: hidden on mobile; shows role-appropriate nav; PLATFORM_ADMIN sees admin-only items; active state via `usePathname`
- **Medicine alerts**: matched in `POST /api/listings` (fire-and-forget) — name substring + optional ATC prefix + optional Haversine distance check; skips sender
- **New listing disclaimer**: seller must tick a responsibility checkbox (+ fill medicine name and expiry date) before submitting; checkbox not shown on edit
- **Listing condition**: only `SEALED` is allowed; `OPENED` remains in the DB enum for legacy data but is not exposed in the UI
- **Geocoding**: Nominatim at registration (best-effort, never blocks); hospitals without coords skip distance filter
- **Barcode scanner**: `BarcodeScanner` component dynamically imports `@zxing/browser` inside `useEffect` (never in the initial bundle). `IScannerControls.stop()` (returned by `decodeFromVideoDevice`) releases the camera on unmount — not `reader.reset()`. GS1 DataMatrix parsing in `lib/gs1.ts`; auto-fills `batchNumber` and `expiryDate` only — name/ATC require a drug DB lookup not available for free in the EU.
- **CSV bulk import**: `lib/csv-import.ts` uses papaparse + reuses `createListingSchema` for row validation. `CsvImporter` publishes valid rows sequentially to `POST /api/listings` (no new endpoint). Template download is a client-side Blob — no server needed.
- **Environmental impact**: `lib/impact.ts` computes waste/CO₂ estimates from delivered order quantities (50 g/unit, 6 kg CO₂e/kg). `ImpactCard` (`components/impact/ImpactCard.tsx`, `"use client"`) accepts `variant: "user" | "platform"`. Rendered in profile page (buyer+seller delivered orders, deduplicated) and admin page (all delivered orders). Admin `allOrders` query must include `quantity` in its select.
