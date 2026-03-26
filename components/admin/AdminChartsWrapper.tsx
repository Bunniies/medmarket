"use client";

import dynamic from "next/dynamic";
import type { AdminChartsData } from "./AdminCharts";

const AdminCharts = dynamic(
  () => import("./AdminCharts").then((m) => ({ default: m.AdminCharts })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-8">
        <div className="h-64 animate-pulse rounded-xl bg-secondary" />
        <div className="grid grid-cols-2 gap-8">
          <div className="h-48 animate-pulse rounded-xl bg-secondary" />
          <div className="h-48 animate-pulse rounded-xl bg-secondary" />
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-secondary" />
      </div>
    ),
  }
);

export function AdminChartsWrapper({ data }: { data: AdminChartsData }) {
  return <AdminCharts data={data} />;
}
