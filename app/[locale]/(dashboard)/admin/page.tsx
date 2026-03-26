import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminChartsWrapper } from "@/components/admin/AdminChartsWrapper";
import type { AdminChartsData } from "@/components/admin/AdminCharts";
import { Building2, Users, ListChecks, ShoppingCart, TrendingUp, CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Admin Overview" };

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function last6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });
}

export default async function AdminOverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "PLATFORM_ADMIN") notFound();

  const sixMonthsAgo = last6Months()[0];

  const [
    totalHospitals,
    verifiedHospitals,
    totalListings,
    activeListings,
    totalUsers,
    allOrders,
    allHospitals,
    recentHospitals,
  ] = await Promise.all([
    db.hospital.count(),
    db.hospital.count({ where: { verified: true } }),
    db.listing.count(),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { role: { not: "PLATFORM_ADMIN" } } }),
    db.order.findMany({
      select: { status: true, totalPrice: true, createdAt: true, sellerHospitalId: true, buyerHospitalId: true },
    }),
    db.hospital.findMany({ select: { id: true, name: true }, where: { verified: true } }),
    db.hospital.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
  ]);

  // GMV + completion rate
  const deliveredOrders = allOrders.filter((o) => o.status === "DELIVERED");
  const gmv = deliveredOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const completionRate = allOrders.length > 0
    ? Math.round((deliveredOrders.length / allOrders.length) * 100)
    : 0;
  const avgOrderValue = deliveredOrders.length > 0
    ? gmv / deliveredOrders.length
    : 0;

  // Monthly orders + GMV
  const months = last6Months();
  const monthlyOrders = months.map((d) => {
    const label = monthLabel(d);
    const nextMonth = new Date(d);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const inMonth = allOrders.filter(
      (o) => o.createdAt >= d && o.createdAt < nextMonth
    );
    const monthGmv = inMonth
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.totalPrice), 0);
    return { month: label, orders: inMonth.length, gmv: Math.round(monthGmv) };
  });

  // Monthly new hospitals
  const monthlyHospitals = months.map((d) => {
    const label = monthLabel(d);
    const nextMonth = new Date(d);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return {
      month: label,
      hospitals: recentHospitals.filter((h) => h.createdAt >= d && h.createdAt < nextMonth).length,
    };
  });

  // Order status breakdown
  const statusCounts: Record<string, number> = {};
  for (const o of allOrders) {
    const label = o.status.charAt(0) + o.status.slice(1).toLowerCase();
    statusCounts[label] = (statusCounts[label] ?? 0) + 1;
  }
  const orderStatusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Top 5 hospitals by order count
  const hospitalOrderCounts: Record<string, { orders: number; gmv: number }> = {};
  for (const o of allOrders) {
    const hid = o.sellerHospitalId;
    if (!hospitalOrderCounts[hid]) hospitalOrderCounts[hid] = { orders: 0, gmv: 0 };
    hospitalOrderCounts[hid].orders += 1;
    if (o.status === "DELIVERED") hospitalOrderCounts[hid].gmv += Number(o.totalPrice);
  }
  const hospitalMap = Object.fromEntries(allHospitals.map((h) => [h.id, h.name]));
  const topHospitals = Object.entries(hospitalOrderCounts)
    .map(([id, stats]) => ({ name: hospitalMap[id] ?? "Unknown", ...stats, gmv: Math.round(stats.gmv) }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  const chartsData: AdminChartsData = { monthlyOrders, monthlyHospitals, orderStatusBreakdown, topHospitals };

  const statCards = [
    {
      label: "Hospitals",
      value: totalHospitals,
      sub: `${verifiedHospitals} verified · ${totalHospitals - verifiedHospitals} pending`,
      icon: Building2,
      color: "text-brand-600",
      bg: "bg-brand-50",
    },
    {
      label: "Listings",
      value: totalListings,
      sub: `${activeListings} active`,
      icon: ListChecks,
      color: "text-accent-600",
      bg: "bg-accent-50",
    },
    {
      label: "Orders",
      value: allOrders.length,
      sub: `${completionRate}% completion rate`,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Users",
      value: totalUsers,
      sub: "hospital staff & admins",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "GMV",
      value: formatPrice(gmv),
      sub: "delivered orders",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Avg order",
      value: formatPrice(avgOrderValue),
      sub: "per delivered order",
      icon: CheckCircle,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
  ];

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="mb-1 text-3xl font-bold text-gray-900">Admin</h1>
        <p className="mb-8 text-sm text-muted-foreground">Platform overview</p>
        <AdminNav />

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-white p-5">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="mt-0.5 text-sm font-medium text-gray-700">{s.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        <AdminChartsWrapper data={chartsData} />
      </main>
    </div>
  );
}
