"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";

interface ContactSellerButtonProps {
  listingId: string;
  isLoggedIn: boolean;
  isOwnListing: boolean;
}

export function ContactSellerButton({ listingId, isLoggedIn, isOwnListing }: ContactSellerButtonProps) {
  const t = useTranslations("conversations");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoggedIn || isOwnListing) return null;

  async function handleClick() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    if (res.ok) {
      const conv = await res.json();
      router.push(`/conversations/${conv.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? t("startError"));
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-secondary disabled:opacity-50 transition-colors"
      >
        <MessageSquare className="h-4 w-4" />
        {loading ? "…" : t("contactSeller")}
      </button>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  );
}
