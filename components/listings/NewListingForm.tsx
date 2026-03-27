"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Category } from "@prisma/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface ListingForEdit {
  id: string;
  title: string;
  medicineName: string;
  genericName: string | null;
  atcCode: string | null;
  manufacturer: string | null;
  batchNumber: string | null;
  expiryDate: string;   // YYYY-MM-DD
  quantity: number;
  unit: string;
  pricePerUnit: number;
  categoryId: string | null;
  description: string | null;
}

interface NewListingFormProps {
  categories: Category[];
  listing?: ListingForEdit;
}

export function NewListingForm({ categories, listing }: NewListingFormProps) {
  const router = useRouter();
  const t = useTranslations("newListing");
  const tMy = useTranslations("myListings");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [medicineName, setMedicineName] = useState(listing?.medicineName ?? "");
  const [expiryDate, setExpiryDate] = useState(listing?.expiryDate ?? "");
  const isEdit = !!listing;

  const canSubmit = isEdit || (
    disclaimerAccepted &&
    medicineName.trim().length >= 2 &&
    expiryDate.length > 0
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const payload = {
      ...data,
      quantity: Number(data.quantity),
      pricePerUnit: Number(data.pricePerUnit),
    };

    const res = await fetch(isEdit ? `/api/listings/${listing.id}` : "/api/listings", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? t("errorFallback"));
    } else {
      router.push(isEdit ? "/my-listings" : `/listings/${json.id}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-xl border border-border bg-white p-8 shadow-sm"
    >
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionMedicine")}
        </h2>
        <div className="flex flex-col gap-4">
          <Input id="title" name="title" label={t("labelTitle")} placeholder="Trastuzumab 440mg — 10 vials available" required defaultValue={listing?.title} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="medicineName" name="medicineName" label={t("labelMedicineName")} placeholder="Trastuzumab" required value={medicineName} onChange={(e) => setMedicineName(e.target.value)} />
            <Input id="genericName" name="genericName" label={t("labelGenericName")} placeholder="Trastuzumab" defaultValue={listing?.genericName ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="atcCode" name="atcCode" label={t("labelAtcCode")} placeholder="L01FD01" defaultValue={listing?.atcCode ?? ""} />
            <Input id="manufacturer" name="manufacturer" label={t("labelManufacturer")} placeholder="Roche" defaultValue={listing?.manufacturer ?? ""} />
          </div>
          <Input id="batchNumber" name="batchNumber" label={t("labelBatchNumber")} placeholder="BT-20241001" defaultValue={listing?.batchNumber ?? ""} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="categoryId" className="text-sm font-medium text-gray-700">
              {t("labelCategory")}
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={listing?.categoryId ?? ""}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t("labelSelectCategory")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionStock")}
        </h2>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="quantity" name="quantity" label={t("labelQuantity")} type="number" min={1} placeholder="10" required defaultValue={listing?.quantity} />
            <Input id="unit" name="unit" label={t("labelUnit")} placeholder="vials" required defaultValue={listing?.unit ?? "units"} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="pricePerUnit" name="pricePerUnit" label={t("labelPrice")} type="number" step="0.01" min={0} placeholder="850.00" required defaultValue={listing?.pricePerUnit} />
            <Input id="expiryDate" name="expiryDate" label={t("labelExpiryDate")} type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>

          <input type="hidden" name="condition" value="SEALED" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionDescription")}
        </h2>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder={t("descriptionPlaceholder")}
          defaultValue={listing?.description ?? ""}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </section>

      {!isEdit && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-700">
            {t("disclaimerTitle")}
          </p>
          <p className="text-sm text-amber-900 leading-relaxed">
            {t("disclaimerBody")}
          </p>
          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-amber-600"
            />
            <span className="text-sm font-medium text-amber-900">
              {t("disclaimerCheckbox")}
            </span>
          </label>
        </section>
      )}

      <Button type="submit" isLoading={loading} size="lg" disabled={!canSubmit}>
        {isEdit ? tMy("saveChanges") : t("submitButton")}
      </Button>
    </form>
  );
}
