import { Clock } from "lucide-react";

export function VerificationBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-amber-800">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          Your hospital is <strong>pending verification</strong>. You can browse listings, but you cannot post listings or place orders until a platform admin approves your hospital.
        </span>
      </div>
    </div>
  );
}
