"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export interface AdminChartsData {
  monthlyOrders: { month: string; orders: number; gmv: number }[];
  monthlyHospitals: { month: string; hospitals: number; users: number }[];
  orderStatusBreakdown: { name: string; value: number }[];
  topHospitals: { name: string; orders: number; gmv: number }[];
  usersPerHospital: { name: string; users: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  Delivered:  "#22c55e",
  Confirmed:  "#3b82f6",
  Pending:    "#f59e0b",
  Shipped:    "#8b5cf6",
  Cancelled:  "#ef4444",
  Disputed:   "#f97316",
};

export function AdminCharts({ data }: { data: AdminChartsData }) {
  return (
    <div className="flex flex-col gap-8">
      {/* Monthly orders + GMV */}
      <div className="rounded-xl border border-border bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Orders & GMV — last 6 months</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.monthlyOrders} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
            <Tooltip formatter={(value, name) => name === "gmv" ? [`€${Number(value).toFixed(0)}`, "GMV"] : [value, "Orders"]} />
            <Legend />
            <Line yAxisId="left"  type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} dot={false} name="Orders" />
            <Line yAxisId="right" type="monotone" dataKey="gmv"    stroke="#16a34a" strokeWidth={2} dot={false} name="GMV (€)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {/* New hospitals + users per month */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">New hospitals & users — last 6 months</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.monthlyHospitals} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="hospitals" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Hospitals" />
              <Bar dataKey="users" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order status pie */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Order status breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data.orderStatusBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                dataKey="value"
                nameKey="name"
              >
                {data.orderStatusBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {/* Top hospitals by order volume */}
        {data.topHospitals.length > 0 && (
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Top hospitals by order volume</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topHospitals} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(value, name) => name === "gmv" ? [`€${Number(value).toFixed(0)}`, "GMV"] : [value, "Orders"]} />
                <Legend />
                <Bar dataKey="orders" fill="#2563eb" radius={[0, 4, 4, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Users per hospital */}
        {data.usersPerHospital.length > 0 && (
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Users per hospital</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.usersPerHospital} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="users" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
