/**
 * GS1 DataMatrix parser for EU pharmaceutical packaging (FMD-compliant).
 *
 * EU Regulation 2016/161 mandates a GS1 DataMatrix on all prescription medicine
 * packaging sold in Italy and the broader EU. It encodes:
 *   AI 01 — GTIN (14 digits, fixed)
 *   AI 10 — Batch/Lot number (variable, up to 20 chars)
 *   AI 17 — Expiry date YYMMDD (6 digits, fixed)
 *   AI 21 — Serial number (variable, up to 20 chars)
 *
 * Medicine name and ATC code are NOT encoded in any barcode standard —
 * they require a drug database lookup by GTIN which has no free EU/Italian API.
 */

export interface Gs1Data {
  gtin?: string;
  batchNumber?: string;
  /** ISO date string YYYY-MM-DD */
  expiryDate?: string;
  serialNumber?: string;
}

/** ASCII Group Separator (FNC1 in GS1 DataMatrix) used between variable-length fields. */
const GS = "\x1d";

/** AIs with fixed content lengths (not counting the AI digits themselves). */
const FIXED_LENGTH: Record<string, number> = {
  "00": 18,
  "01": 14,
  "02": 14,
  "11": 6,
  "13": 6,
  "15": 6,
  "17": 6,
  "31": 8,
  "32": 8,
  "33": 8,
  "34": 8,
  "35": 8,
  "36": 8,
};

/** AIs with variable content lengths (terminated by GS or the next AI). */
const VARIABLE_AIS = new Set(["10", "21", "22", "30", "240", "241", "242"]);

export function parseGs1DataMatrix(raw: string): Gs1Data {
  // Strip scanner-added symbol identifier prefix (e.g. ]d2, ]C1, ]e0).
  let str = raw.replace(/^\][A-Za-z][0-9A-Za-z]?/, "");

  const result: Gs1Data = {};

  // Human-readable format with parenthesised AIs: (01)1234…(17)251231(10)LOT…
  if (str.includes("(")) {
    for (const [, ai, value] of str.matchAll(/\((\d{2,4})\)([^(]+)/g)) {
      applyAi(result, ai, value.trim());
    }
    return result;
  }

  // Compact binary format: AI digits immediately followed by content.
  let i = 0;
  while (i < str.length) {
    // Try to match a known AI (2-digit first, then 3-digit).
    let ai: string | null = null;
    let fixedLen: number | undefined;

    for (const len of [2, 3]) {
      const candidate = str.slice(i, i + len);
      if (FIXED_LENGTH[candidate] !== undefined) {
        ai = candidate;
        fixedLen = FIXED_LENGTH[candidate];
        break;
      }
      if (VARIABLE_AIS.has(candidate)) {
        ai = candidate;
        break;
      }
    }

    if (!ai) { i++; continue; }
    i += ai.length;

    let value: string;
    if (fixedLen !== undefined) {
      value = str.slice(i, i + fixedLen);
      i += fixedLen;
    } else {
      const gsPos = str.indexOf(GS, i);
      if (gsPos !== -1) {
        value = str.slice(i, gsPos);
        i = gsPos + 1;
      } else {
        value = str.slice(i);
        i = str.length;
      }
    }

    applyAi(result, ai, value);
  }

  return result;
}

function applyAi(result: Gs1Data, ai: string, value: string): void {
  switch (ai) {
    case "01":
      result.gtin = value;
      break;
    case "10":
      result.batchNumber = value;
      break;
    case "17": {
      if (value.length !== 6) break;
      const yy = value.slice(0, 2);
      const mm = value.slice(2, 4);
      const dd = value.slice(4, 6);
      const year = parseInt(yy, 10) >= 50 ? `19${yy}` : `20${yy}`;
      // GS1 allows day "00" to mean last day of the month.
      const day =
        dd === "00"
          ? new Date(parseInt(year, 10), parseInt(mm, 10), 0)
              .getDate()
              .toString()
              .padStart(2, "0")
          : dd;
      result.expiryDate = `${year}-${mm}-${day}`;
      break;
    }
    case "21":
      result.serialNumber = value;
      break;
  }
}
