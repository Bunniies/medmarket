"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Package, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export interface OrderRow {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: string;
  createdAt: string;
  notes: string | null;
  buyer: { name: string | null; email: string };
  buyerHospital: { name: string; city: string };
}

export interface ListingRow {
  id: string;
  title: string;
  medicineName: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  currency: string;
  expiryDate: string;
  status: string;
  condition: string;
  category: { name: string } | null;
  orders: OrderRow[];
}

const LISTING_STATUS_STYLES: Record<string, string> = {
  ACTIVE:         "bg-accent-50 text-accent-700",
  SOLD:           "bg-blue-50 text-blue-700",
  ARCHIVED:       "bg-secondary text-muted-foreground",
  EXPIRED:        "bg-red-50 text-red-700",
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  SHIPPED:   "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-accent-50 text-accent-700",
  CANCELLED: "bg-secondary text-muted-foreground",
  DISPUTED:  "bg-red-50 text-red-700",
};

function formatEur(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

const ACTIVE_STATUSES = new Set(["ACTIVE", "PENDING_REVIEW"]);

export function MyListingsManager({ listings }: { listings: ListingRow[] }) {
  const t = useTranslations("myListings");
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    // Auto-expand listings that have pending orders
    new Set(listings.filter((l) => l.orders.some((o) => o.status === "PENDING")).map((l) => l.id))
  );

  const activeListings = listings.filter((l) => ACTIVE_STATUSES.has(l.status));
  const archivedListings = listings.filter((l) => !ACTIVE_STATUSES.has(l.status));

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function updateOrderStatus(orderId: string, status: string) {
    setLoadingId(orderId);
    setErrors((e) => ({ ...e, [orderId]: "" }));
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      setErrors((e) => ({ ...e, [orderId]: data.error ?? t("errorUpdating") }));
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  async function updateListingStatus(listingId: string, status: string) {
    setLoadingId(listingId);
    setErrors((e) => ({ ...e, [listingId]: "" }));
    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      setErrors((e) => ({ ...e, [listingId]: data.error ?? t("errorUpdating") }));
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  const listingStatusLabel: Record<string, string> = {
    ACTIVE: t("listingStatusActive"),
    SOLD: t("listingStatusSold"),
    ARCHIVED: t("listingStatusArchived"),
    EXPIRED: t("listingStatusExpired"),
    PENDING_REVIEW: t("listingStatusPendingReview"),
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Active listings */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t("sectionActive")}
          {activeListings.length > 0 && (
            <span className="ml-2 rounded-full bg-accent-50 px-2.5 py-0.5 text-sm font-medium text-accent-700">
              {activeListings.length}
            </span>
          )}
        </h2>
        {activeListings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            {t("noActiveListings")}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {activeListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isExpanded={expandedIds.has(listing.id)}
                onToggle={() => toggleExpand(listing.id)}
                loadingId={loadingId}
                errors={errors}
                onUpdateOrderStatus={updateOrderStatus}
                onUpdateListingStatus={updateListingStatus}
                listingStatusLabel={listingStatusLabel}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      {/* Archived / past listings */}
      {archivedListings.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-500">
            {t("sectionArchived")}
            <span className="ml-2 rounded-full bg-secondary px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
              {archivedListings.length}
            </span>
          </h2>
          <div className="flex flex-col gap-4 opacity-75">
            {archivedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isExpanded={expandedIds.has(listing.id)}
                onToggle={() => toggleExpand(listing.id)}
                loadingId={loadingId}
                errors={errors}
                onUpdateOrderStatus={updateOrderStatus}
                onUpdateListingStatus={updateListingStatus}
                listingStatusLabel={listingStatusLabel}
                t={t}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ListingCard({
  listing, isExpanded, onToggle, loadingId, errors, onUpdateOrderStatus, onUpdateListingStatus, listingStatusLabel, t,
}: {
  listing: ListingRow;
  isExpanded: boolean;
  onToggle: () => void;
  loadingId: string | null;
  errors: Record<string, string>;
  onUpdateOrderStatus: (id: string, status: string) => void;
  onUpdateListingStatus: (id: string, status: string) => void;
  listingStatusLabel: Record<string, string>;
  t: ReturnType<typeof useTranslations<"myListings">>;
}) {
  const pendingCount = listing.orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Listing header */}
      <div className="p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0", LISTING_STATUS_STYLES[listing.status] ?? "bg-secondary text-muted-foreground")}>
                {listingStatusLabel[listing.status] ?? listing.status}
              </span>
              {listing.category && (
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 shrink-0">
                  {listing.category.name}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                {listing.quantity} {listing.unit} · {formatEur(listing.pricePerUnit)}/{listing.unit}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(listing.expiryDate)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {errors[listing.id] && (
              <span className="text-xs text-red-600">{errors[listing.id]}</span>
            )}
            <Link
              href={`/my-listings/${listing.id}/edit`}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-secondary"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("actionEdit")}
            </Link>
            {listing.status === "ACTIVE" && (
              <button
                onClick={() => onUpdateListingStatus(listing.id, "ARCHIVED")}
                disabled={loadingId === listing.id}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-secondary disabled:opacity-50"
              >
                {loadingId === listing.id ? "…" : t("actionArchive")}
              </button>
            )}
            {listing.status === "ARCHIVED" && (
              <button
                onClick={() => onUpdateListingStatus(listing.id, "ACTIVE")}
                disabled={loadingId === listing.id}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
              >
                {loadingId === listing.id ? "…" : t("actionActivate")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders toggle */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between border-t border-border bg-secondary/30 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-secondary/50"
      >
        <span>
          {t("ordersTitle")}
          {listing.orders.length > 0 && (
            <span className="ml-2 text-muted-foreground">({listing.orders.length})</span>
          )}
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {pendingCount} pending
            </span>
          )}
        </span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Orders table */}
      {isExpanded && (
        <div className="border-t border-border">
          {listing.orders.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/20 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5">{t("columnBuyer")}</th>
                    <th className="px-5 py-2.5">{t("columnQty")}</th>
                    <th className="px-5 py-2.5">{t("columnTotal")}</th>
                    <th className="px-5 py-2.5">{t("columnDate")}</th>
                    <th className="px-5 py-2.5">{t("columnStatus")}</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listing.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/10">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{order.buyerHospital.name}</p>
                        <p className="text-xs text-muted-foreground">{order.buyerHospital.city}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {order.quantity} {listing.unit}
                      </td>
                      <td className="px-5 py-3 font-semibold">{formatEur(order.totalPrice)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", ORDER_STATUS_STYLES[order.status] ?? "bg-secondary text-muted-foreground")}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {errors[order.id] && (
                            <span className="text-xs text-red-600">{errors[order.id]}</span>
                          )}
                          {order.status === "PENDING" && (
                            <>
                              <ActionButton
                                label={t("actionConfirm")}
                                loading={loadingId === order.id}
                                variant="success"
                                onClick={() => onUpdateOrderStatus(order.id, "CONFIRMED")}
                              />
                              <ActionButton
                                label={t("actionReject")}
                                loading={loadingId === order.id}
                                variant="danger"
                                onClick={() => onUpdateOrderStatus(order.id, "CANCELLED")}
                              />
                            </>
                          )}
                          {order.status === "CONFIRMED" && (
                            <ActionButton
                              label={t("actionShip")}
                              loading={loadingId === order.id}
                              variant="default"
                              onClick={() => onUpdateOrderStatus(order.id, "SHIPPED")}
                            />
                          )}
                          {order.status === "SHIPPED" && (
                            <ActionButton
                              label={t("actionDeliver")}
                              loading={loadingId === order.id}
                              variant="success"
                              onClick={() => onUpdateOrderStatus(order.id, "DELIVERED")}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label, loading, variant, onClick,
}: {
  label: string;
  loading: boolean;
  variant: "default" | "success" | "danger";
  onClick: () => void;
}) {
  const styles = {
    default: "border-border text-gray-700 hover:bg-secondary",
    success: "border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100",
    danger:  "border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn("rounded-lg border px-3 py-1 text-xs font-medium disabled:opacity-50", styles[variant])}
    >
      {loading ? "…" : label}
    </button>
  );
}
