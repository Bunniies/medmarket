"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";
import type { ListingWithRelations } from "@/types";

interface OrderFormProps {
  listing: ListingWithRelations;
  isLoggedIn: boolean;
  isOwnListing: boolean;
}

export function OrderForm({ listing, isLoggedIn, isOwnListing }: OrderFormProps) {
  const t = useTranslations("listingDetail");
  const tListings = useTranslations("listings");
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const maxQty = listing.quantity;
  const total = Number(listing.pricePerUnit) * quantity;
  const isActive = listing.status === "ACTIVE";

  if (!isActive) {
    return (
      <div className="rounded-xl border border-border bg-gray-50 p-5 text-center text-sm text-muted-foreground">
        {t("soldOut")}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-border bg-gray-50 p-5 text-center">
        <p className="text-sm text-muted-foreground mb-3">{t("loginToOrder")}</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t("loginToOrder")}
        </Link>
      </div>
    );
  }

  if (isOwnListing) {
    return (
      <div className="rounded-xl border border-border bg-gray-50 p-5 text-center text-sm text-muted-foreground">
        {t("ownListing")}
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <p className="text-sm font-medium text-green-700">{t("orderSuccess")}</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, quantity, notes: notes || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t("orderError"));
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError(t("orderError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-900">{t("orderTitle")}</h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          {t("labelQuantity")} (max {maxQty} {listing.unit})
        </label>
        <input
          type="number"
          min={1}
          max={maxQty}
          value={quantity}
          onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">{t("labelNotes")}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("notesPlaceholder")}
          rows={3}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3 text-sm">
        <span className="text-muted-foreground">{t("totalPrice")}</span>
        <span className="text-lg font-bold text-brand-700">
          {formatPrice(total, listing.currency)}
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "…" : t("submitOrder")}
      </button>
    </form>
  );
}
