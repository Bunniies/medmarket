import Papa from "papaparse";
import { createListingSchema, type CreateListingInput } from "@/lib/validations";
import type { Category } from "@prisma/client";

export interface CsvRow {
  index: number;
  raw: Record<string, string>;
  payload: CreateListingInput | null;
  errors: string[];
}

/** Column headers expected in the CSV (order does not matter — papaparse uses header names). */
export const CSV_HEADERS = [
  "title",
  "medicineName",
  "genericName",
  "atcCode",
  "manufacturer",
  "batchNumber",
  "expiryDate",
  "quantity",
  "unit",
  "pricePerUnit",
  "description",
  "category",
] as const;

/** Returns a ready-to-download CSV template string. */
export function buildCsvTemplate(): string {
  const example = [
    "Trastuzumab 440mg — 10 vials available",
    "Trastuzumab",
    "Trastuzumab",
    "L01FD01",
    "Roche",
    "BT-20241001",
    "2025-06-30",
    "10",
    "vials",
    "850.00",
    "Sealed, stored at 2-8°C",
    "",
  ];
  return [CSV_HEADERS.join(","), example.join(",")].join("\n");
}

/** Parses a CSV File and validates every row against the listing schema. */
export function parseCsvFile(
  file: File,
  categories: Category[]
): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
      complete({ data, errors }) {
        if (errors.length > 0 && data.length === 0) {
          reject(new Error(errors[0].message));
          return;
        }
        resolve(data.map((raw, i) => validateRow(raw, i + 1, categories)));
      },
      error(err) {
        reject(err);
      },
    });
  });
}

function validateRow(
  raw: Record<string, string>,
  index: number,
  categories: Category[]
): CsvRow {
  // Resolve optional category name → ID
  let categoryId: string | undefined;
  if (raw.category) {
    const match = categories.find(
      (c) => c.name.toLowerCase() === raw.category.toLowerCase()
    );
    if (!match) {
      return {
        index,
        raw,
        payload: null,
        errors: [`Unknown category "${raw.category}"`],
      };
    }
    categoryId = match.id;
  }

  const candidate = {
    title: raw.title || "",
    medicineName: raw.medicineName || "",
    genericName: raw.genericName || undefined,
    atcCode: raw.atcCode || undefined,
    manufacturer: raw.manufacturer || undefined,
    batchNumber: raw.batchNumber || undefined,
    expiryDate: raw.expiryDate || "",
    quantity: Number(raw.quantity),
    unit: raw.unit || "",
    pricePerUnit: Number(raw.pricePerUnit),
    description: raw.description || undefined,
    categoryId,
    condition: "SEALED" as const,
  };

  const result = createListingSchema.safeParse(candidate);

  if (!result.success) {
    return {
      index,
      raw,
      payload: null,
      errors: result.error.errors.map((e) => e.message),
    };
  }

  return { index, raw, payload: result.data, errors: [] };
}
