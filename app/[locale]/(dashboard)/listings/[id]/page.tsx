import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Calendar, Package, Building2, Tag, Hash, FlaskConical, ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { OrderForm } from "@/components/listings/OrderForm";
import { ContactSellerButton } from "@/components/chat/ContactSellerButton";
import { Link } from "@/i18n/navigation";
import { formatPrice, formatDate, isExpiringSoon, isExpired } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ListingWithRelations } from "@/types";

interface ListingDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: ListingDetailPageProps) {
  const { locale, id } = await params;
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) return {};
  const t = await getTranslations({ locale, namespace: "listingDetail" });
  return { title: t("metaTitle", { title: listing.title }) };
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [listing, session] = await Promise.all([
    db.listing.findUnique({
      where: { id },
      include: {
        hospital: true,
        seller: { select: { id: true, name: true, email: true, image: true } },
        category: true,
      },
    }),
    auth(),
  ]);

  if (!listing) notFound();

  const t = await getTranslations("listingDetail");
  const tListings = await getTranslations("listings");

  const typedListing: ListingWithRelations = { ...listing, pricePerUnit: Number(listing.pricePerUnit) };
  const expiring = isExpiringSoon(listing.expiryDate);
  const expired = isExpired(listing.expiryDate);

  const sessionUser = session?.user as { id?: string; hospitalId?: string } | undefined;
  const isLoggedIn = !!session;
  const isOwnListing = !!sessionUser?.hospitalId && sessionUser.hospitalId === listing.hospitalId;

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/listings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToListings")}
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-3">
          {/* ── Left: listing details ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-start gap-3">
                <h1 className="text-2xl font-bold text-gray-900 flex-1">{listing.title}</h1>
                {listing.category && (
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                    {listing.category.name}
                  </span>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">{listing.medicineName}</p>

              {/* Expiry warning */}
              {expiring && !expired && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {tListings("expiresSoon")} — {tListings("expiresLabel", { date: formatDate(listing.expiryDate) })}
                </div>
              )}
              {expired && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {tListings("expired")}
                </div>
              )}
            </div>

            {/* Details grid */}
            <div className="rounded-xl border border-border bg-white p-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailRow
                  icon={<Package className="h-4 w-4" />}
                  label={t("quantityAvailable")}
                  value={`${listing.quantity} ${listing.unit}`}
                />
                <DetailRow
                  icon={<Calendar className="h-4 w-4" />}
                  label={t("expiryDate")}
                  value={formatDate(listing.expiryDate)}
                  valueClassName={cn(
                    expiring && !expired && "text-amber-600 font-medium",
                    expired && "text-red-600 font-medium"
                  )}
                />
                <DetailRow
                  icon={<Tag className="h-4 w-4" />}
                  label={t("condition")}
                  value={listing.condition === "SEALED" ? tListings("sealed") : tListings("opened")}
                />
                {listing.genericName && (
                  <DetailRow
                    icon={<FlaskConical className="h-4 w-4" />}
                    label={t("genericName")}
                    value={listing.genericName}
                  />
                )}
                {listing.atcCode && (
                  <DetailRow
                    icon={<Hash className="h-4 w-4" />}
                    label={t("atcCode")}
                    value={listing.atcCode}
                  />
                )}
                {listing.manufacturer && (
                  <DetailRow
                    icon={<Building2 className="h-4 w-4" />}
                    label={t("manufacturer")}
                    value={listing.manufacturer}
                  />
                )}
                {listing.batchNumber && (
                  <DetailRow
                    icon={<Hash className="h-4 w-4" />}
                    label={t("batchNumber")}
                    value={listing.batchNumber}
                  />
                )}
              </dl>
            </div>

            {/* Seller hospital */}
            <div className="rounded-xl border border-border bg-white p-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("sellerHospital")}
              </p>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-gray-900">{listing.hospital.name}</span>
                <span className="text-muted-foreground">· {listing.hospital.city}</span>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("description")}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{listing.description}</p>
              </div>
            )}
          </div>

          {/* ── Right: price + order form ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-xl border border-border bg-white p-5 flex flex-col gap-5">
              {/* Price */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  {t("pricePerUnit")}
                </p>
                <p className="text-3xl font-bold text-brand-700">
                  {formatPrice(Number(listing.pricePerUnit), listing.currency)}
                </p>
                <span className="text-xs text-muted-foreground">/ {listing.unit}</span>
              </div>

              <hr className="border-border" />

              <OrderForm
                listing={typedListing}
                isLoggedIn={isLoggedIn}
                isOwnListing={isOwnListing}
              />

              <ContactSellerButton
                listingId={listing.id}
                isLoggedIn={isLoggedIn}
                isOwnListing={isOwnListing}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className={cn("text-sm font-medium text-gray-900", valueClassName)}>{value}</dd>
    </div>
  );
}
