"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Building2, CheckCircle, XCircle, MapPin, Calendar, User, ShieldOff } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface HospitalRow {
  id: string;
  name: string;
  city: string;
  country: string;
  verified: boolean;
  createdAt: string;
  adminUser: { name: string | null; email: string; role: string } | null;
  memberCount: number;
  listingCount: number;
}

export function AdminHospitalsManager({ hospitals }: { hospitals: HospitalRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function act(id: string, action: "approve" | "reject" | "revoke") {
    setLoadingId(id);
    setErrors((e) => ({ ...e, [id]: "" }));
    const res = await fetch(`/api/admin/hospitals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const data = await res.json();
      setErrors((e) => ({ ...e, [id]: data.error ?? "Action failed." }));
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  const pending  = hospitals.filter((h) => !h.verified);
  const verified = hospitals.filter((h) => h.verified);

  return (
    <div className="flex flex-col gap-10">
      {/* Pending section */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Pending verification</h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 opacity-30" />
            All caught up — no hospitals pending verification.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((h) => (
              <HospitalCard key={h.id} h={h} loadingId={loadingId} error={errors[h.id]}>
                <button
                  onClick={() => act(h.id, "approve")}
                  disabled={loadingId === h.id}
                  className="flex items-center gap-1.5 rounded-lg border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-700 hover:bg-accent-100 disabled:opacity-50"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {loadingId === h.id ? "…" : "Approve"}
                </button>
                <button
                  onClick={() => act(h.id, "reject")}
                  disabled={loadingId === h.id}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {loadingId === h.id ? "…" : "Reject"}
                </button>
              </HospitalCard>
            ))}
          </div>
        )}
      </section>

      {/* Verified section */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Verified hospitals</h2>
          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700">{verified.length}</span>
        </div>
        {verified.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            No verified hospitals yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {verified.map((h) => (
              <HospitalCard key={h.id} h={h} loadingId={loadingId} error={errors[h.id]}>
                <button
                  onClick={() => act(h.id, "revoke")}
                  disabled={loadingId === h.id}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                  {loadingId === h.id ? "…" : "Revoke"}
                </button>
              </HospitalCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HospitalCard({
  h,
  loadingId,
  error,
  children,
}: {
  h: HospitalRow;
  loadingId: string | null;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
          <Building2 className="h-5 w-5 text-brand-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">{h.name}</p>
          <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {h.city}, {h.country}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Joined {formatDate(h.createdAt)}
            </span>
            {h.adminUser && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {h.adminUser.name ?? h.adminUser.email} · {h.adminUser.email}
              </span>
            )}
            <span className="text-xs">{h.memberCount} member{h.memberCount !== 1 ? "s" : ""} · {h.listingCount} listing{h.listingCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {error && <span className="text-xs text-red-600">{error}</span>}
          {children}
        </div>
      </div>
    </div>
  );
}
