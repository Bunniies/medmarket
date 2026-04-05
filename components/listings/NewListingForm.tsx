"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Category } from "@prisma/client";
import { ScanLine, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BarcodeScanner } from "@/components/listings/BarcodeScanner";
import { parseGs1DataMatrix } from "@/lib/gs1";

export interface ListingForEdit {
  id: string;
  title: string;
  medicineName: string;
  genericName: string | null;
  aicCode: string | null;
  atcCode: string | null;
  manufacturer: string | null;
  batchNumber: string | null;
  expiryDate: string;   // YYYY-MM-DD
  quantity: number;
  remainingQuantity: number | null;
  unit: string;
  totalValue: number | null;
  storageCondition: string | null;
  pricePerUnit: number;
  categoryId: string | null;
  description: string | null;
}

interface NewListingFormProps {
  categories: Category[];
  listing?: ListingForEdit;
  aiSuggestEnabled?: boolean;
}

const STORAGE_OPTIONS = ["2–8°C", "8–15°C", "15–20°C", "<25°C"] as const;

// ATC first letter → category slug (full first-level ATC coverage)
const ATC_FIRST_LETTER_TO_SLUG: Record<string, string> = {
  A: "gastroenterology", // Gastrointestinal system and metabolism
  B: "hematology",       // Blood and hematopoietic organs
  C: "cardiology",       // Cardiovascular system
  D: "dermatology",      // Dermatological agents
  G: "gynecology",       // Genitourinary system and sex hormones
  H: "endocrinology",    // Systemic hormonal preparations
  I: "immunology",       // Immunological agents
  J: "antibiotics",      // Antimicrobials for systemic use
  L: "oncology",         // Antineoplastic agents; AI can disambiguate with immunology
  M: "rheumatology",     // Musculoskeletal system
  N: "neurology",        // Nervous system
  P: "antibiotics",      // Antiparasitic drugs → closest match
  R: "respiratory",      // Respiratory system
  S: "ophthalmology",    // Sensory organs
};

export function NewListingForm({ categories, listing, aiSuggestEnabled = false }: NewListingFormProps) {
  const router = useRouter();
  const t = useTranslations("newListing");
  const tMy = useTranslations("myListings");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [medicineName, setMedicineName] = useState(listing?.medicineName ?? "");
  const [genericName, setGenericName] = useState(listing?.genericName ?? "");
  const [aicCode, setAicCode] = useState(listing?.aicCode ?? "");
  const [expiryDate, setExpiryDate] = useState(listing?.expiryDate ?? "");
  const [batchNumber, setBatchNumber] = useState(listing?.batchNumber ?? "");
  const [quantity, setQuantity] = useState<number>(listing?.quantity ?? 0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(listing?.pricePerUnit ?? 0);
  const totalValue = quantity > 0 && pricePerUnit > 0 ? quantity * pricePerUnit : null;
  const [atcCode, setAtcCode] = useState(listing?.atcCode ?? "");
  const [categoryId, setCategoryId] = useState(listing?.categoryId ?? "");
  const [categoryAutoDetected, setCategoryAutoDetected] = useState(false);
  const [suggestingCategory, setSuggestingCategory] = useState(false);

  function handleAtcCodeChange(value: string) {
    setAtcCode(value);
    const letter = value.trim().charAt(0).toUpperCase();
    const slug = ATC_FIRST_LETTER_TO_SLUG[letter];
    if (slug) {
      const match = categories.find((c) => c.slug === slug);
      if (match) {
        setCategoryId(match.id);
        setCategoryAutoDetected(true);
      }
    } else {
      setCategoryAutoDetected(false);
    }
  }

  async function handleSuggestCategory() {
    setSuggestingCategory(true);
    setCategoryAutoDetected(false);
    try {
      const res = await fetch("/api/listings/suggest-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineName, aicCode, atcCode }),
      });
      const json = await res.json();
      if (json.categoryId) {
        setCategoryId(json.categoryId);
        setCategoryAutoDetected(true);
      }
    } finally {
      setSuggestingCategory(false);
    }
  }
  const [showScanner, setShowScanner] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(false);
  const isEdit = !!listing;

  function handleScan(raw: string) {
    setShowScanner(false);
    const gs1 = parseGs1DataMatrix(raw);
    if (gs1.batchNumber !== undefined) setBatchNumber(gs1.batchNumber);
    if (gs1.expiryDate !== undefined) setExpiryDate(gs1.expiryDate);
    setScanFeedback(true);
    setTimeout(() => setScanFeedback(false), 4000);
  }

  const canSubmit = isEdit || (
    disclaimerAccepted &&
    medicineName.trim().length >= 2 &&
    genericName.trim().length >= 1 &&
    aicCode.trim().length >= 1 &&
    expiryDate.length > 0
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const payload: Record<string, unknown> = {
      ...data,
      quantity,
      pricePerUnit,
      totalValue,
    };
    if (isEdit && data.remainingQuantity !== undefined && data.remainingQuantity !== "") {
      payload.remainingQuantity = Number(data.remainingQuantity);
    }

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
    <>
    {showScanner && (
      <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
    )}
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-xl border border-border bg-white p-8 shadow-sm"
    >
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {scanFeedback && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {t("scanFilled")}
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("sectionMedicine")}
          </h2>
          {!isEdit && (
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
            >
              <ScanLine className="h-3.5 w-3.5" />
              {t("scanBarcode")}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <Input id="title" name="title" label={t("labelTitle")} placeholder="Trastuzumab 440mg — 10 vials available" required defaultValue={listing?.title} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="medicineName" name="medicineName" label={t("labelMedicineName")} placeholder="Trastuzumab" required value={medicineName} onChange={(e) => setMedicineName(e.target.value)} />
            <Input id="genericName" name="genericName" label={t("labelGenericName")} placeholder="Trastuzumab" required value={genericName} onChange={(e) => setGenericName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="aicCode" name="aicCode" label={t("labelAicCode")} placeholder="034532016" required value={aicCode} onChange={(e) => setAicCode(e.target.value)} />
            <Input id="atcCode" name="atcCode" label={t("labelAtcCode")} placeholder="L01FD01" value={atcCode} onChange={(e) => handleAtcCodeChange(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="manufacturer" name="manufacturer" label={t("labelManufacturer")} placeholder="Roche" defaultValue={listing?.manufacturer ?? ""} />
            <Input id="batchNumber" name="batchNumber" label={t("labelBatchNumber")} placeholder="BT-20241001" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="categoryId" className="text-sm font-medium text-gray-700">
                {t("labelCategory")}
                {categoryAutoDetected && (
                  <span className="ml-2 text-xs font-normal text-brand-600">{t("categoryAutoDetected")}</span>
                )}
              </label>
              {aiSuggestEnabled && medicineName.trim().length >= 2 && (
                <button
                  type="button"
                  onClick={handleSuggestCategory}
                  disabled={suggestingCategory}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800 disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  {suggestingCategory ? t("categorySuggesting") : t("categorySuggestAi")}
                </button>
              )}
            </div>
            <select
              id="categoryId"
              name="categoryId"
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setCategoryAutoDetected(false); }}
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
            <Input id="quantity" name="quantity" label={t("labelQuantity")} type="number" min={1} placeholder="10" required value={quantity || ""} onChange={(e) => setQuantity(Number(e.target.value))} />
            <Input id="unit" name="unit" label={t("labelUnit")} placeholder="fiale" required defaultValue={listing?.unit ?? ""} />
          </div>
          {isEdit && (
            <Input
              id="remainingQuantity"
              name="remainingQuantity"
              label={t("labelRemainingQuantity")}
              type="number"
              min={0}
              placeholder="10"
              defaultValue={listing.remainingQuantity ?? listing.quantity}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input id="pricePerUnit" name="pricePerUnit" label={t("labelPrice")} type="number" step="0.01" min={0} placeholder="850.00" required value={pricePerUnit || ""} onChange={(e) => setPricePerUnit(Number(e.target.value))} />
            <Input id="expiryDate" name="expiryDate" label={t("labelExpiryDate")} type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">{t("labelTotalValue")}</label>
            <div className="flex h-10 items-center rounded-lg border border-input bg-secondary px-3 text-sm text-muted-foreground">
              {totalValue !== null
                ? `€ ${totalValue.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—"}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="storageCondition" className="text-sm font-medium text-gray-700">
              {t("labelStorageCondition")}
            </label>
            <select
              id="storageCondition"
              name="storageCondition"
              defaultValue={listing?.storageCondition ?? ""}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t("labelSelectStorage")}</option>
              {STORAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
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
    </>
  );
}
