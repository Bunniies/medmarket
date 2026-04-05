import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { ProfileAnalytics } from "@/components/profile/ProfileAnalytics";
import { NotificationSettings } from "@/components/profile/NotificationSettings";
import { ImpactCard } from "@/components/impact/ImpactCard";
import { computeImpact } from "@/lib/impact";
import type { OrderForChart } from "@/components/profile/StatsCharts";
import type { OrderForTable } from "@/components/profile/ProfileAnalytics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: t("metaTitle") };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const userId = (session.user as any).id;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { hospital: true },
  });

  if (!user) notFound();

  const [buyerOrders, sellerOrders] = await Promise.all([
    db.order.findMany({
      where: { buyerId: userId },
      include: {
        listing: { select: { id: true, medicineName: true, unit: true, category: { select: { name: true } } } },
        sellerHospital: { select: { name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: { listing: { sellerId: userId } },
      include: {
        listing: { select: { id: true, medicineName: true, unit: true, category: { select: { name: true } } } },
        buyerHospital: { select: { name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const t = await getTranslations("profile");

  // Environmental impact — deduplicate by order ID across buyer + seller roles
  const deliveredMap = new Map<string, { quantity: number; totalPrice: number }>();
  for (const o of [...buyerOrders, ...sellerOrders]) {
    if (o.status === "DELIVERED" && !deliveredMap.has(o.id)) {
      deliveredMap.set(o.id, { quantity: o.quantity, totalPrice: Number(o.totalPrice) });
    }
  }
  const userImpact = computeImpact(Array.from(deliveredMap.values()));

  // Serialize for charts
  const ordersAsBuyer: OrderForChart[] = buyerOrders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    totalPrice: Number(o.totalPrice),
    status: o.status,
    listingCategory: o.listing.category?.name ?? null,
  }));

  const ordersAsSeller: OrderForChart[] = sellerOrders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    totalPrice: Number(o.totalPrice),
    status: o.status,
    listingCategory: o.listing.category?.name ?? null,
  }));

  // Serialize for table
  const buyerOrdersForTable: OrderForTable[] = buyerOrders.map((o) => ({
    id: o.id,
    listingId: o.listing.id,
    medicineName: o.listing.medicineName,
    unit: o.listing.unit,
    counterparty: `${o.sellerHospital.name} · ${o.sellerHospital.city}`,
    quantity: o.quantity,
    totalPrice: Number(o.totalPrice),
    currency: o.currency,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
  }));

  const sellerOrdersForTable: OrderForTable[] = sellerOrders.map((o) => ({
    id: o.id,
    listingId: o.listing.id,
    medicineName: o.listing.medicineName,
    unit: o.listing.unit,
    counterparty: `${o.buyerHospital.name} · ${o.buyerHospital.city}`,
    quantity: o.quantity,
    totalPrice: Number(o.totalPrice),
    currency: o.currency,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
  }));

  const roleLabel: Record<string, string> = {
    HOSPITAL_ADMIN: t("roleHospitalAdmin"),
    HOSPITAL_STAFF: t("roleHospitalStaff"),
    PLATFORM_ADMIN: t("rolePlatformAdmin"),
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
  <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>

  {/* ── Info cards ── */}
  <div className="mb-10 grid gap-5 sm:grid-cols-2">
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-lg font-bold">
          {(user.name ?? user.email ?? "?")[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user.name ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        <InfoRow label={t("labelRole")} value={roleLabel[user.role] ?? user.role} />
        <InfoRow label={t("labelMemberSince")} value={formatDate(user.createdAt)} />
      </dl>
    </div>

    {user.hospital && (
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand-600" />
          <p className="font-semibold text-gray-900">{user.hospital.name}</p>
          <span
            className={cn(
              "ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium",
              user.hospital.verified
                ? "bg-accent-50 text-accent-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {user.hospital.verified ? t("hospitalVerified") : t("hospitalUnverified")}
          </span>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          <InfoRow label={t("labelCity")} value={user.hospital.city} />
          <InfoRow label={t("labelCountry")} value={user.hospital.country} />
        </dl>
      </div>
    )}
  </div>

  {/* ── Notification settings ── */}
  <div className="mb-10">
    <NotificationSettings emailNotifyMessages={user.emailNotifyMessages} />
  </div>

  {/* ── Environmental impact ── */}
  <div className="mb-10">
    <ImpactCard data={userImpact} variant="user" />
  </div>

  {/* ── Analytics + orders (client, toggle-driven) ── */}
  <ProfileAnalytics
    ordersAsBuyer={ordersAsBuyer}
    ordersAsSeller={ordersAsSeller}
    buyerOrdersForTable={buyerOrdersForTable}
    sellerOrdersForTable={sellerOrdersForTable}
  />
</main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-gray-900 text-right">{value}</dd>
    </div>
  );
}
