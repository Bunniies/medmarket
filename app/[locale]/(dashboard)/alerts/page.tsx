"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Bell, Trash2, Plus, MapPin } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface MedicineAlert {
  id: string;
  medicineName: string;
  atcCode: string | null;
  maxDistanceKm: number | null;
  createdAt: string;
}

const DISTANCE_OPTIONS = [
  { value: "", label: "Any distance" },
  { value: "50", label: "50 km" },
  { value: "100", label: "100 km" },
  { value: "200", label: "200 km" },
  { value: "500", label: "500 km" },
];

export default function AlertsPage() {
  const t = useTranslations("alerts");
  const qc = useQueryClient();

  const [form, setForm] = useState({ medicineName: "", atcCode: "", maxDistanceKm: "" });
  const [formError, setFormError] = useState("");

  const { data: alerts = [], isLoading } = useQuery<MedicineAlert[]>({
    queryKey: ["alerts"],
    queryFn: () => fetch("/api/alerts").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineName: form.medicineName,
          atcCode: form.atcCode || undefined,
          maxDistanceKm: form.maxDistanceKm ? Number(form.maxDistanceKm) : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? t("errorCreate"));
      }
      return res.json();
    },
    onSuccess: () => {
      setForm({ medicineName: "", atcCode: "", maxDistanceKm: "" });
      setFormError("");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/alerts/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    createMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Bell className="h-6 w-6 text-brand-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {/* Create form */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">{t("newAlert")}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
          )}
          <Input
            id="medicineName"
            label={t("labelMedicineName")}
            placeholder={t("placeholderMedicineName")}
            value={form.medicineName}
            onChange={(e) => setForm((f) => ({ ...f, medicineName: e.target.value }))}
            required
          />
          <Input
            id="atcCode"
            label={t("labelAtcCode")}
            placeholder={t("placeholderAtcCode")}
            value={form.atcCode}
            onChange={(e) => setForm((f) => ({ ...f, atcCode: e.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="maxDistanceKm" className="text-sm font-medium text-gray-700">
              {t("labelDistance")}
            </label>
            <select
              id="maxDistanceKm"
              value={form.maxDistanceKm}
              onChange={(e) => setForm((f) => ({ ...f, maxDistanceKm: e.target.value }))}
              className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {DISTANCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            className="mt-2 flex items-center gap-2 self-start"
            isLoading={createMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            {t("submitButton")}
          </Button>
        </form>
      </div>

      {/* Alert list */}
      <div className="mt-8">
        <h2 className="mb-4 font-semibold text-gray-900">{t("activeAlerts")}</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : alerts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex items-center justify-between rounded-xl border border-border bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-gray-900">{alert.medicineName}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {alert.atcCode && <span>ATC: {alert.atcCode}</span>}
                    {alert.maxDistanceKm ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {t("withinKm", { km: alert.maxDistanceKm })}
                      </span>
                    ) : (
                      <span>{t("anyDistance")}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(alert.id)}
                  disabled={deleteMutation.isPending}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  aria-label={t("deleteAlert")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
