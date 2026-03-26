"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import type { OrderForChart } from "./StatsCharts";

const StatsCharts = dynamic(
  () => import("./StatsCharts").then((m) => ({ default: m.StatsCharts })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-secondary" />
        <div className="h-56 animate-pulse rounded-xl bg-secondary" />
        <div className="h-48 animate-pulse rounded-xl bg-secondary" />
      </div>
    ),
  }
);

export interface OrderForTable {
  id: string;
  listingId: string;
  medicineName: string;
  unit: string;
  counterparty: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  createdAt: string;
  status: string;
}

interface Props {
  ordersAsBuyer: OrderForChart[];
  ordersAsSeller: OrderForChart[];
  buyerOrdersForTable: OrderForTable[];
  sellerOrdersForTable: OrderForTable[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  SHIPPED:   "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-accent-50 text-accent-700",
  CANCELLED: "bg-secondary text-muted-foreground",
  DISPUTED:  "bg-red-50 text-red-700",
};

function computeStats(orders: OrderForChart[]) {
  const active = orders.filter((o) => o.status !== "CANCELLED");
  const total = active.reduce((s, o) => s + o.totalPrice, 0);
  return {
    total,
    count: active.length,
    avg: active.length > 0 ? total / active.length : 0,
  };
}

function formatEur(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProfileAnalytics({
  ordersAsBuyer,
  ordersAsSeller,
  buyerOrdersForTable,
  sellerOrdersForTable,
}: Props) {
  const t = useTranslations("profile");
  const tOrders = useTranslations("orders");
  const [mode, setMode] = useState<"bought" | "sold">("bought");

  const isBought = mode === "bought";
  const chartOrders = isBought ? ordersAsBuyer : ordersAsSeller;
  const tableOrders = isBought ? buyerOrdersForTable : sellerOrdersForTable;
  const stats = computeStats(chartOrders);

  return (
    <div className="flex flex-col gap-10">
      {/* ── Toggle ── */}
      <div className="inline-flex rounded-lg border border-border bg-white p-1 self-start">
        <button
          onClick={() => setMode("bought")}
          className={cn(
            "rounded-md px-5 py-1.5 text-sm font-medium transition-colors",
            isBought ? "bg-brand-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
          )}
        >
          {t("tabBought")}
        </button>
        <button
          onClick={() => setMode("sold")}
          className={cn(
            "rounded-md px-5 py-1.5 text-sm font-medium transition-colors",
            !isBought ? "bg-brand-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
          )}
        >
          {t("tabSold")}
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-brand-400" />}
          label={isBought ? t("statsTotalSpent") : t("statsTotalEarned")}
          value={formatEur(stats.total)}
        />
        <StatCard
          icon={<ShoppingCart className="h-5 w-5 text-brand-400" />}
          label={isBought ? t("statsOrderCount") : t("statsOrdersReceived")}
          value={String(stats.count)}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-brand-400" />}
          label={isBought ? t("statsAvgOrderValue") : t("statsAvgSaleValue")}
          value={stats.count > 0 ? formatEur(stats.avg) : "—"}
        />
      </div>

      {/* ── Charts ── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("sectionAnalytics")}</h2>
        <StatsCharts orders={chartOrders} />
      </section>

      {/* ── Order table ── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("sectionOrders")}</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          {tableOrders.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              {tOrders("noOrders")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">{tOrders("columnMedicine")}</th>
                    <th className="px-6 py-3">
                      {isBought ? t("columnCounterpartySeller") : t("columnCounterpartyBuyer")}
                    </th>
                    <th className="px-6 py-3">{tOrders("columnQty")}</th>
                    <th className="px-6 py-3">{tOrders("columnTotal")}</th>
                    <th className="px-6 py-3">{tOrders("columnDate")}</th>
                    <th className="px-6 py-3">{tOrders("columnStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tableOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/20">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        <Link href={`/listings/${order.listingId}`} className="hover:text-brand-700">
                          {order.medicineName}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{order.counterparty}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {order.quantity} {order.unit}
                      </td>
                      <td className="px-6 py-3 font-semibold">{formatEur(order.totalPrice)}</td>
                      <td className="px-6 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            STATUS_STYLES[order.status] ?? "bg-secondary text-muted-foreground"
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
