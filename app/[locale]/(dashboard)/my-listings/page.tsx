import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MyListingsManager } from "@/components/listings/MyListingsManager";
import type { ListingRow } from "@/components/listings/MyListingsManager";
import { PlusCircle } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "myListings" });
  return { title: t("metaTitle") };
}

export default async function MyListingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const userId = (session.user as any).id;
  const t = await getTranslations("myListings");

  // Auto-expire listings whose expiry date has passed and are still ACTIVE/PENDING_REVIEW
  await db.listing.updateMany({
    where: {
      sellerId: userId,
      status: { in: ["ACTIVE", "PENDING_REVIEW"] },
      expiryDate: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  const listings = await db.listing.findMany({
    where: { sellerId: userId },
    include: {
      category: true,
      orders: {
        include: {
          buyer: { select: { name: true, email: true } },
          buyerHospital: { select: { name: true, city: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize Decimal fields for client
  const serialized: ListingRow[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    medicineName: l.medicineName,
    unit: l.unit,
    quantity: l.quantity,
    pricePerUnit: Number(l.pricePerUnit),
    currency: l.currency,
    expiryDate: l.expiryDate.toISOString(),
    status: l.status,
    condition: l.condition,
    category: l.category ? { name: l.category.name } : null,
    orders: l.orders.map((o) => ({
      id: o.id,
      quantity: o.quantity,
      unitPrice: Number(o.unitPrice),
      totalPrice: Number(o.totalPrice),
      currency: o.currency,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      notes: o.notes,
      buyer: { name: o.buyer.name, email: o.buyer.email },
      buyerHospital: { name: o.buyerHospital.name, city: o.buyerHospital.city },
    })),
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
  <div className="mb-8 flex items-center justify-between">
    <h1 className="text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
    <Link
      href="/listings/new"
      className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
    >
      <PlusCircle className="h-4 w-4" />
      New listing
    </Link>
  </div>

  {serialized.length === 0 ? (
    <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
      <p className="text-lg font-medium">{t("noListings")}</p>
      <p className="text-sm">{t("noListingsHint")}</p>
      <Link href="/listings/new" className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
        {t("createListing")}
      </Link>
    </div>
  ) : (
    <MyListingsManager listings={serialized} />
  )}
</main>
  );
}
