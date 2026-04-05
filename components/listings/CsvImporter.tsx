"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CheckCircle, XCircle, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { parseCsvFile, buildCsvTemplate, type CsvRow } from "@/lib/csv-import";
import type { Category } from "@prisma/client";

type Phase = "upload" | "preview" | "publishing" | "done";

interface PublishSummary {
  succeeded: number;
  failed: number;
}

interface CsvImporterProps {
  categories: Category[];
}

export function CsvImporter({ categories }: CsvImporterProps) {
  const t = useTranslations("csvImport");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [dragging, setDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<PublishSummary | null>(null);

  const validRows = rows.filter((r) => r.payload !== null);
  const invalidRows = rows.filter((r) => r.payload === null);

  async function handleFile(file: File) {
    setParseError(null);
    try {
      const parsed = await parseCsvFile(file, categories);
      setRows(parsed);
      setPhase("preview");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse CSV.");
    }
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function downloadTemplate() {
    const csv = buildCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medmarket-listing-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function publish() {
    setPhase("publishing");
    setProgress({ done: 0, total: validRows.length });
    let succeeded = 0;
    let failed = 0;

    for (const row of validRows) {
      try {
        const res = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row.payload),
        });
        if (res.ok) succeeded++;
        else failed++;
      } catch {
        failed++;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setSummary({ succeeded, failed });
    setPhase("done");
  }

  // ── Upload phase ──────────────────────────────────────────────────────────
  if (phase === "upload") {
    return (
      <div className="flex flex-col gap-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-16 transition-colors ${
            dragging
              ? "border-brand-400 bg-brand-50"
              : "border-border bg-white hover:border-brand-300 hover:bg-brand-50/50"
          }`}
        >
          <Upload className={`h-10 w-10 ${dragging ? "text-brand-500" : "text-muted-foreground"}`} />
          <p className="text-sm font-medium text-gray-700">{t("dropzone")}</p>
          <p className="text-xs text-muted-foreground">{t("dropzoneAccepts")}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onFileInput}
          />
        </div>

        {parseError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{parseError}</div>
        )}

        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center justify-center gap-2 text-sm text-brand-600 hover:underline"
        >
          <FileText className="h-4 w-4" />
          {t("downloadTemplate")}
        </button>
      </div>
    );
  }

  // ── Preview phase ─────────────────────────────────────────────────────────
  if (phase === "preview") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {validRows.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
              <CheckCircle className="h-3.5 w-3.5" />
              {t("validRows", { count: validRows.length })}
            </span>
          )}
          {invalidRows.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 font-medium text-red-800">
              <XCircle className="h-3.5 w-3.5" />
              {t("invalidRows", { count: invalidRows.length })}
            </span>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">{t("columnMedicine")}</th>
                <th className="px-4 py-3 text-left">{t("columnExpiry")}</th>
                <th className="px-4 py-3 text-left">{t("columnQty")}</th>
                <th className="px-4 py-3 text-left">{t("columnPrice")}</th>
                <th className="px-4 py-3 text-left">{t("columnStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {rows.map((row) => (
                <tr
                  key={row.index}
                  className={row.payload ? "hover:bg-gray-50" : "bg-red-50/60"}
                >
                  <td className="px-4 py-3 text-muted-foreground">{row.index}</td>
                  <td className="px-4 py-3 font-medium">{row.raw.medicineName || "—"}</td>
                  <td className="px-4 py-3">{row.raw.expiryDate || "—"}</td>
                  <td className="px-4 py-3">
                    {row.raw.quantity && row.raw.unit
                      ? `${row.raw.quantity} ${row.raw.unit}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.raw.pricePerUnit ? `€${row.raw.pricePerUnit}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.payload ? (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        {t("statusValid")}
                      </span>
                    ) : (
                      <span className="flex items-start gap-1 text-red-600">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {row.errors[0]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setRows([]); setPhase("upload"); }}
          >
            {t("backToUpload")}
          </Button>
          <Button
            type="button"
            disabled={validRows.length === 0}
            onClick={publish}
          >
            {t("publishButton", { count: validRows.length })}
          </Button>
        </div>
      </div>
    );
  }

  // ── Publishing phase ──────────────────────────────────────────────────────
  if (phase === "publishing") {
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <p className="text-sm font-medium text-gray-700">
          {t("publishing", { done: progress.done, total: progress.total })}
        </p>
        <div className="w-full max-w-xs overflow-hidden rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{pct}%</p>
      </div>
    );
  }

  // ── Done phase ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <CheckCircle className="h-12 w-12 text-green-500" />
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t("doneTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("doneSuccess", { count: summary!.succeeded })}
          {summary!.failed > 0 && (
            <> · <span className="text-red-600">{t("doneFailed", { count: summary!.failed })}</span></>
          )}
        </p>
      </div>
      <Link
        href="/my-listings"
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        {t("viewListings")}
      </Link>
    </div>
  );
}
