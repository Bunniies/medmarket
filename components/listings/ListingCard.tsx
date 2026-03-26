"use client";

import { Calendar, Package, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice, formatDate, isExpiringSoon, isExpired } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import type { ListingWithRelations } from "@/types";

interface ListingCardProps {
  listing: ListingWithRelations;
}

export function ListingCard({ listing }: ListingCardProps) {
  const t = useTranslations("listings");
  const expiring = isExpiringSoon(listing.expiryDate);
  const expired = isExpired(listing.expiryDate);

  return (
    <Link href={`/listings/${listing.id}`}>
      <article
        className={cn(
          "group flex flex-col gap-3 rounded-xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
          expired && "opacity-60"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2">
              {listing.title}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{listing.medicineName}</p>
          </div>
          {listing.category && (
            <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              {listing.category.name}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              {listing.quantity} {listing.unit}
              {listing.manufacturer && (
                <span className="text-muted-foreground"> · {listing.manufacturer}</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className={cn(expiring && "text-amber-600 font-medium", expired && "text-red-600 font-medium")}>
              {t("expiresLabel", { date: formatDate(listing.expiryDate) })}
              {expiring && !expired && ` ${t("expiresSoon")}`}
              {expired && ` ${t("expired")}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>{listing.hospital.name} · {listing.hospital.city}</span>
          </div>
        </div>

        {/* Price */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <div>
            <span className="text-lg font-bold text-brand-700">
              {formatPrice(listing.pricePerUnit, listing.currency)}
            </span>
            <span className="text-xs text-muted-foreground"> / {listing.unit}</span>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              listing.condition === "SEALED"
                ? "bg-accent-50 text-accent-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {listing.condition === "SEALED" ? t("sealed") : t("opened")}
          </span>
        </div>
      </article>
    </Link>
  );
}
