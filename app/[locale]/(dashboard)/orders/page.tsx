import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { formatPrice, formatDate } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "orders" });
  return { title: t("metaTitle") };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  SHIPPED:   "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-accent-50 text-accent-700",
  CANCELLED: "bg-secondary text-muted-foreground line-through",
  DISPUTED:  "bg-red-50 text-red-700",
};

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const userId = (session.user as any).id;
  const t = await getTranslations("orders");

  const orders = await db.order.findMany({
    where: { buyerId: userId },
    include: {
      listing: { select: { id: true, medicineName: true, unit: true } },
      sellerHospital: { select: { name: true, city: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <ShoppingCart className="h-7 w-7 text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
              <p className="text-lg font-medium">{t("noOrders")}</p>
              <p className="text-sm">{t("noOrdersHint")}</p>
              <Link
                href="/listings"
                className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Browse listings
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">{t("columnMedicine")}</th>
                    <th className="px-6 py-3">{t("columnSeller")}</th>
                    <th className="px-6 py-3">{t("columnQty")}</th>
                    <th className="px-6 py-3">{t("columnUnitPrice")}</th>
                    <th className="px-6 py-3">{t("columnTotal")}</th>
                    <th className="px-6 py-3">{t("columnDate")}</th>
                    <th className="px-6 py-3">{t("columnStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/20">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <Link
                          href={`/listings/${order.listing.id}`}
                          className="hover:text-brand-700"
                        >
                          {order.listing.medicineName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {order.sellerHospital.name}
                        <span className="block text-xs">{order.sellerHospital.city}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {order.quantity} {order.listing.unit}
                      </td>
                      <td className="px-6 py-4">
                        {formatPrice(Number(order.unitPrice), order.currency)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatPrice(Number(order.totalPrice), order.currency)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            STATUS_STYLES[order.status] ?? "bg-secondary text-muted-foreground"
                          )}
                        >
                          {t(`status${order.status.charAt(0) + order.status.slice(1).toLowerCase()}` as any)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
