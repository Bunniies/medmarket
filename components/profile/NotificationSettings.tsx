"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";

export function NotificationSettings({ emailNotifyMessages: initial }: { emailNotifyMessages: boolean }) {
  const t = useTranslations("profile");
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    setError("");
    const res = await fetch("/api/profile/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailNotifyMessages: next }),
    });
    if (res.ok) {
      setEnabled(next);
    } else {
      setError(t("settingsSaveError"));
    }
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-brand-600" />
        <h2 className="font-semibold text-gray-900">{t("notificationsTitle")}</h2>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{t("notifyMessagesLabel")}</p>
          <p className="text-xs text-muted-foreground">{t("notifyMessagesHint")}</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 ${
            enabled ? "bg-brand-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
