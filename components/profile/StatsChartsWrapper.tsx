"use client";

import dynamic from "next/dynamic";
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

export function StatsChartsWrapper({ orders }: { orders: OrderForChart[] }) {
  return <StatsCharts orders={orders} />;
}
