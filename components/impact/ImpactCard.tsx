"use client";

import { useTranslations } from "next-intl";
import { Leaf, Recycle, Wind, CircleDollarSign } from "lucide-react";
import type { ImpactData } from "@/lib/impact";

interface ImpactCardProps {
  data: ImpactData;
  variant: "user" | "platform";
}

export function ImpactCard({ data, variant }: ImpactCardProps) {
  const t = useTranslations("impact");

  const metrics = [
    {
      icon: Leaf,
      value: data.unitsTransacted.toLocaleString(),
      label: t("units"),
    },
    {
      icon: Recycle,
      value: `${data.wasteKg.toLocaleString()} kg`,
      label: t("wasteKg"),
    },
    {
      icon: Wind,
      value: `${data.co2Kg.toLocaleString()} kg CO₂e`,
      label: t("co2Kg"),
    },
    {
      icon: CircleDollarSign,
      value: `€${Math.round(data.valueEur).toLocaleString()}`,
      label: t("valueEur"),
    },
  ];

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6">
      <div className="mb-1 flex items-center gap-2">
        <Leaf className="h-5 w-5 text-green-600" />
        <h2 className="font-semibold text-green-900">
          {variant === "user" ? t("profileTitle") : t("adminTitle")}
        </h2>
      </div>
      <p className="mb-5 text-sm text-green-700">
        {variant === "user" ? t("profileSubtitle") : t("adminSubtitle")}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg bg-white/70 p-4">
            <m.icon className="mb-2 h-4 w-4 text-green-600" />
            <p className="text-xl font-bold text-gray-900">{m.value}</p>
            <p className="mt-0.5 text-xs text-green-700">{m.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-green-600/60">{t("disclaimer")}</p>
    </div>
  );
}
