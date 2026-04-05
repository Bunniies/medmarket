"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X, ScanLine } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (raw: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const t = useTranslations("newListing");

  // Keep ref in sync so the effect closure never goes stale.
  useEffect(() => { onScanRef.current = onScan; });

  useEffect(() => {
    let cancelled = false;
    let readerReset: (() => void) | null = null;
    // Guard so continuous decoding only fires the callback once.
    let fired = false;

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled || !videoRef.current) return;

        const reader = new BrowserMultiFormatReader();

        const controls = await reader.decodeFromVideoDevice(
          undefined, // use system-default camera
          videoRef.current,
          (result) => {
            if (result && !cancelled && !fired) {
              fired = true;
              onScanRef.current(result.getText());
            }
          }
        );

        readerReset = () => controls.stop();
      } catch {
        if (!cancelled) setCameraError(t("scannerCameraError"));
      }
    })();

    return () => {
      cancelled = true;
      readerReset?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold text-gray-900">
              {t("scannerTitle")}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {cameraError ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {cameraError}
            </div>
          ) : (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {/* scanning frame */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-36 w-52 rounded border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>
            </div>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t("scannerHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
