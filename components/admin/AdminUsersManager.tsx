"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Building2, UserCheck, UserX } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  hospitalName: string | null;
}

const ROLE_STYLES: Record<string, string> = {
  HOSPITAL_ADMIN: "bg-brand-50 text-brand-700",
  HOSPITAL_STAFF: "bg-secondary text-muted-foreground",
};

const ROLE_LABELS: Record<string, string> = {
  HOSPITAL_ADMIN: "Admin",
  HOSPITAL_STAFF: "Staff",
};

export function AdminUsersManager({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function toggle(user: AdminUserRow) {
    setLoadingId(user.id);
    setErrors((e) => ({ ...e, [user.id]: "" }));
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    if (!res.ok) {
      const data = await res.json();
      setErrors((e) => ({ ...e, [user.id]: data.error ?? "Failed." }));
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
        No users found.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {users.map((u, i) => (
        <div key={u.id} className={cn("flex flex-wrap items-center gap-4 px-5 py-4", i > 0 && "border-t border-border", !u.active && "opacity-60")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {(u.name ?? u.email)[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{u.name ?? "—"}</p>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ROLE_STYLES[u.role] ?? "bg-secondary text-muted-foreground")}>
                {ROLE_LABELS[u.role] ?? u.role}
              </span>
              {!u.active && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">Deactivated</span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>{u.email}</span>
              {u.hospitalName && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {u.hospitalName}
                </span>
              )}
              <span>Joined {formatDate(u.createdAt)}</span>
            </div>
            {errors[u.id] && <p className="mt-1 text-xs text-red-600">{errors[u.id]}</p>}
          </div>
          <button
            onClick={() => toggle(u)}
            disabled={loadingId === u.id}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50",
              u.active
                ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                : "border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100"
            )}
          >
            {u.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
            {loadingId === u.id ? "…" : u.active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      ))}
    </div>
  );
}
