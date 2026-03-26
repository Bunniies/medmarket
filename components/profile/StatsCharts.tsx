"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface OrderForChart {
  id: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  listingCategory: string | null;
}

const PERIODS = ["7d", "30d", "90d", "180d", "1y"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "1y": 365,
};

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getDateKey(date: Date, days: number): string {
  if (days <= 30) {
    // daily
    return date.toISOString().slice(0, 10);
  }
  if (days <= 180) {
    // weekly — snap to Monday
    const d = new Date(date);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }
  // monthly
  return date.toISOString().slice(0, 7);
}

function formatDateKey(key: string, days: number): string {
  if (days > 180) {
    const [y, m] = key.split("-");
    return `${MONTH_SHORT[Number(m) - 1]} '${y.slice(2)}`;
  }
  const [, m, d] = key.split("-");
  return `${Number(d)} ${MONTH_SHORT[Number(m) - 1]}`;
}

export function StatsCharts({ orders }: { orders: OrderForChart[] }) {
  const t = useTranslations("profile");
  const [period, setPeriod] = useState<Period>("30d");

  const days = PERIOD_DAYS[period];
  const cutoff = useMemo(
    () => new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    [days]
  );

  const filtered = useMemo(
    () => orders.filter((o) => new Date(o.createdAt) >= cutoff && o.status !== "CANCELLED"),
    [orders, cutoff]
  );

  const timeData = useMemo(() => {
    const map = new Map<string, { spending: number; count: number }>();
    for (const o of filtered) {
      const key = getDateKey(new Date(o.createdAt), days);
      const prev = map.get(key) ?? { spending: 0, count: 0 };
      map.set(key, { spending: prev.spending + o.totalPrice, count: prev.count + 1 });
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { spending, count }]) => ({
        date: formatDateKey(key, days),
        spending: Math.round(spending * 100) / 100,
        count,
      }));
  }, [filtered, days]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filtered) {
      const cat = o.listingCategory ?? "Other";
      map.set(cat, (map.get(cat) ?? 0) + o.totalPrice);
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([category, spending]) => ({
        category,
        spending: Math.round(spending * 100) / 100,
      }));
  }, [filtered]);

  const periodLabels: Record<Period, string> = {
    "7d": t("period7d"),
    "30d": t("period30d"),
    "90d": t("period90d"),
    "180d": t("period180d"),
    "1y": t("period1y"),
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Period selector */}
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              p === period
                ? "bg-brand-600 text-white"
                : "border border-border bg-white text-gray-600 hover:bg-secondary"
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t("noDataForPeriod")}
        </p>
      ) : (
        <>
          {/* Spending over time */}
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              {t("chartSpendingTitle")}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `€${v}`}
                />
                <Tooltip
                  formatter={(value) => [`€${Number(value).toFixed(2)}`, t("spendingLabel")]}
                />
                <Area
                  type="monotone"
                  dataKey="spending"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#spendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders per period */}
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              {t("chartOrdersTitle")}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [Number(value), t("ordersLabel")]}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          {categoryData.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                {t("chartCategoriesTitle")}
              </h3>
              <ResponsiveContainer
                width="100%"
                height={Math.max(140, categoryData.length * 40)}
              >
                <BarChart
                  layout="vertical"
                  data={categoryData}
                  margin={{ top: 4, right: 8, bottom: 0, left: 90 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => `€${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11 }}
                    width={86}
                  />
                  <Tooltip
                    formatter={(value) => [`€${Number(value).toFixed(2)}`, t("spendingLabel")]}
                  />
                  <Bar dataKey="spending" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
