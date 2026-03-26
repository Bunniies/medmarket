import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/layout/Navbar";
import { db } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { PlusCircle, Package, ShoppingCart, TrendingUp } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("metaTitle") };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if ((session.user as any).role === "PLATFORM_ADMIN") redirect(`/${locale}/admin`);

  const t = await getTranslations("dashboard");

  const userId = (session.user as any).id;
  const hospitalId = (session.user as any).hospitalId;

  const [myListings, myOrders, totalEarnings] = await Promise.all([
    db.listing.findMany({
      where: { sellerId: userId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.order.findMany({
      where: { buyerId: userId },
      include: { listing: true, sellerHospital: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.order.aggregate({
      where: { sellerHospitalId: hospitalId, status: { in: ["CONFIRMED", "DELIVERED"] } },
      _sum: { totalPrice: true },
    }),
  ]);

  const stats = [
    { label: t("activeListings"), value: myListings.filter((l) => l.status === "ACTIVE").length, icon: Package },
    { label: t("ordersPlaced"), value: myOrders.length, icon: ShoppingCart },
    { label: t("totalEarnings"), value: formatPrice(totalEarnings._sum.totalPrice ?? 0), icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("welcomeBack", { name: session.user.name ?? "there" })}
            </h1>
            <p className="mt-1 text-muted-foreground">{t("activityOverview")}</p>
          </div>
          <Link
            href="/listings/new"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            {t("newListing")}
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <stat.icon className="h-5 w-5 text-brand-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* My listings */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t("myListings")}</h2>
            <Link href="/my-listings" className="text-sm text-brand-600 hover:underline">
              {t("viewAll")}
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            {myListings.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                {t("noListingsYet")}{" "}
                <Link href="/listings/new" className="text-brand-600 hover:underline">
                  {t("createFirstListing")}
                </Link>
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">{t("columnMedicine")}</th>
                    <th className="px-6 py-3">{t("columnQty")}</th>
                    <th className="px-6 py-3">{t("columnPricePerUnit")}</th>
                    <th className="px-6 py-3">{t("columnExpires")}</th>
                    <th className="px-6 py-3">{t("columnStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-secondary/20">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        <Link href={`/listings/${listing.id}`} className="hover:text-brand-700">
                          {listing.medicineName}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {listing.quantity} {listing.unit}
                      </td>
                      <td className="px-6 py-3">{formatPrice(listing.pricePerUnit, listing.currency)}</td>
                      <td className="px-6 py-3 text-muted-foreground">{formatDate(listing.expiryDate)}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            listing.status === "ACTIVE"
                              ? "bg-accent-50 text-accent-700"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t("recentOrders")}</h2>
            <Link href="/orders" className="text-sm text-brand-600 hover:underline">
              {t("viewAll")}
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            {myOrders.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                {t("noOrdersYet")}{" "}
                <Link href="/listings" className="text-brand-600 hover:underline">
                  {t("browseListings")}
                </Link>
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">{t("columnMedicine")}</th>
                    <th className="px-6 py-3">{t("columnSeller")}</th>
                    <th className="px-6 py-3">{t("columnQty")}</th>
                    <th className="px-6 py-3">{t("columnTotal")}</th>
                    <th className="px-6 py-3">{t("columnStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/20">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {order.listing.medicineName}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {order.sellerHospital.name}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {order.quantity} {order.listing.unit}
                      </td>
                      <td className="px-6 py-3">{formatPrice(order.totalPrice, order.currency)}</td>
                      <td className="px-6 py-3">
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
