"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Archive, Building2, Calendar, Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface AdminListingRow {
  id: string;
  title: string;
  medicineName: string;
  status: string;
  expiryDate: string;
  createdAt: string;
  hospitalName: string;
  sellerName: string | null;
  sellerEmail: string;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:         "bg-accent-50 text-accent-700",
  SOLD:           "bg-blue-50 text-blue-700",
  EXPIRED:        "bg-red-50 text-red-600",
  ARCHIVED:       "bg-secondary text-muted-foreground",
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
};

export function AdminListingsManager({ listings }: { listings: AdminListingRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function archive(id: string) {
    setLoadingId(id);
    setErrors((e) => ({ ...e, [id]: "" }));
    const res = await fetch(`/api/admin/listings/${id}`, { method: "PATCH" });
    if (!res.ok) {
      const data = await res.json();
      setErrors((e) => ({ ...e, [id]: data.error ?? "Failed." }));
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
        No listings found.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {listings.map((l, i) => (
        <div key={l.id} className={cn("flex flex-wrap items-center gap-4 px-5 py-4", i > 0 && "border-t border-border")}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 truncate">{l.medicineName}</p>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[l.status] ?? "bg-secondary text-muted-foreground")}>
                {l.status.toLowerCase().replace("_", " ")}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {l.hospitalName}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {l.sellerName ?? l.sellerEmail}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expires {formatDate(l.expiryDate)}
              </span>
              <span className="text-xs text-muted-foreground">Created {formatDate(l.createdAt)}</span>
            </div>
            {errors[l.id] && <p className="mt-1 text-xs text-red-600">{errors[l.id]}</p>}
          </div>
          {l.status !== "ARCHIVED" && (
            <button
              onClick={() => archive(l.id)}
              disabled={loadingId === l.id}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              <Archive className="h-3.5 w-3.5" />
              {loadingId === l.id ? "…" : "Remove"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
