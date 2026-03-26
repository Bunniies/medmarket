"use client";

import { Building2, ListChecks, User, CheckCircle, XCircle, ShieldOff, Archive, UserX, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminLogRow {
  id: string;
  action: string;
  targetType: string;
  targetName: string;
  performedByName: string | null;
  performedByEmail: string;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  HOSPITAL_APPROVED: { label: "Hospital approved",   color: "text-accent-700 bg-accent-50",   Icon: CheckCircle },
  HOSPITAL_REJECTED: { label: "Hospital rejected",   color: "text-red-600 bg-red-50",         Icon: XCircle },
  HOSPITAL_REVOKED:  { label: "Verification revoked",color: "text-amber-700 bg-amber-50",     Icon: ShieldOff },
  LISTING_REMOVED:   { label: "Listing removed",     color: "text-red-600 bg-red-50",         Icon: Archive },
  USER_DEACTIVATED:  { label: "User deactivated",    color: "text-red-600 bg-red-50",         Icon: UserX },
  USER_REACTIVATED:  { label: "User reactivated",    color: "text-accent-700 bg-accent-50",   Icon: UserCheck },
};

const TARGET_ICON: Record<string, React.ElementType> = {
  HOSPITAL: Building2,
  LISTING:  ListChecks,
  USER:     User,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)   return "just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminLogsManager({ logs }: { logs: AdminLogRow[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
        No admin actions recorded yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {logs.map((log, i) => {
        const meta = ACTION_META[log.action] ?? { label: log.action, color: "text-muted-foreground bg-secondary", Icon: CheckCircle };
        const TargetIcon = TARGET_ICON[log.targetType] ?? User;

        return (
          <div key={log.id} className={cn("flex items-start gap-4 px-5 py-4", i > 0 && "border-t border-border")}>
            <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", meta.color)}>
              <meta.Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{meta.label}</span>
                <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  <TargetIcon className="h-3 w-3" />
                  {log.targetName}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                by {log.performedByName ?? log.performedByEmail} · {timeAgo(log.createdAt)}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(log.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
