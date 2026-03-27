# App — Routes & Implementation Notes

## Route structure

```
[locale]/                        # /en/... and /it/...
  layout.tsx                     # real root: html, body, NextIntlClientProvider, Providers
  page.tsx                       # home / marketing
  privacy|terms|contact|guide    # static bilingual pages
  (auth)/login                   # login — useSearchParams wrapped in <Suspense>
  (auth)/register                # register; ?token= for invite-based signup
  (dashboard)/layout.tsx         # shows VerificationBanner if hospital unverified
  (dashboard)/dashboard          # stats cards
  (dashboard)/listings           # browse/search/filter
  (dashboard)/listings/new       # create listing (verified only)
  (dashboard)/listings/[id]      # detail + order form + "Message seller"
  (dashboard)/orders             # buyer order history
  (dashboard)/my-listings        # seller: manage listings + orders; auto-expiry on load
  (dashboard)/my-listings/[id]/edit
  (dashboard)/profile            # analytics charts, notification toggle
  (dashboard)/conversations      # messaging inbox
  (dashboard)/conversations/[id] # chat (4s polling)
  (dashboard)/my-hospital        # HOSPITAL_ADMIN: team + invite staff
  (dashboard)/admin/             # PLATFORM_ADMIN: stats + charts
  (dashboard)/admin/hospitals    # approve/reject/revoke
  (dashboard)/admin/listings     # remove (archive) any listing
  (dashboard)/admin/users        # deactivate/reactivate
  (dashboard)/admin/logs         # audit log
api/
  auth/[...nextauth]             # NextAuth handler
  auth/register                  # standard (new hospital) or invite-based
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
- **Root layout**: `app/layout.tsx` must render `<html><body>{children}</body></html>` — required by Next.js
- **PLATFORM_ADMIN redirects**: use `redirect` from `next/navigation` with explicit locale path (`/\${locale}/admin`) — i18n redirect can produce localeless URLs
- **Distance filtering**: Haversine in `lib/utils.ts`; fetches hospitals with coords, filters by radius, then `hospitalId: { in: [...] }` in Prisma
- **Auto-expiry**: every `/my-listings` load runs `updateMany` flipping past-expiry ACTIVE/PENDING_REVIEW → EXPIRED
- **Chat polling**: `ChatWindow` polls every 4s via `setInterval`; `UnreadBadge` polls `/api/conversations/unread` every 30s
- **Conversation upsert**: idempotent on `@@unique([listingId, initiatorId])`
- **Verification**: `POST /api/listings` and `POST /api/orders` return 403 for unverified hospitals
- **Hospital rejection**: deletes hospital + cascades to users
- **User deactivation**: `active = false`; checked in `auth.ts` `authorize()`. PLATFORM_ADMIN cannot be deactivated.
- **Admin audit log**: every admin action writes `AdminLog`; `targetName` denormalized (survives deletion)
- **Email**: all sends are fire-and-forget; Resend initialized lazily — safe without `RESEND_API_KEY`
- **Navbar dropdown**: click-based (`useState` + `useRef` click-outside), not hover-based
- **Geocoding**: Nominatim at registration (best-effort, never blocks); hospitals without coords skip distance filter
