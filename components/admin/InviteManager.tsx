"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { UserPlus, Users, Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface InvitationRow {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:  "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-accent-50 text-accent-700",
  EXPIRED:  "bg-secondary text-muted-foreground",
};

const ROLE_LABELS: Record<string, string> = {
  HOSPITAL_ADMIN: "Admin",
  HOSPITAL_STAFF: "Staff",
  PLATFORM_ADMIN: "Platform Admin",
};

export function InviteManager({
  members,
  invitations,
  isVerified,
}: {
  members: Member[];
  invitations: InvitationRow[];
  isVerified: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to send invitation.");
    } else {
      setSuccess(`Invitation sent to ${email}`);
      setEmail("");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Team members */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-gray-900">Team members</h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{members.length}</span>
        </div>
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          {members.map((m, i) => (
            <div key={m.id} className={cn("flex items-center gap-4 px-5 py-3", i > 0 && "border-t border-border")}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {(m.name ?? m.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{m.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                {ROLE_LABELS[m.role] ?? m.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Invite new staff */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-gray-900">Invite staff</h2>
        </div>

        {!isVerified ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Your hospital must be verified before you can invite staff members.
          </div>
        ) : (
          <form onSubmit={sendInvite} className="rounded-xl border border-border bg-white p-5">
            <p className="mb-4 text-sm text-muted-foreground">
              Send an invitation link to a colleague. They'll create their own account and be automatically linked to your hospital.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@hospital.it"
                required
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                {sending ? "Sending…" : "Send invite"}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            {success && <p className="mt-2 text-xs text-accent-600">{success}</p>}
          </form>
        )}
      </section>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-gray-900">Sent invitations</h2>
          </div>
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            {invitations.map((inv, i) => (
              <div key={inv.id} className={cn("flex items-center gap-4 px-5 py-3", i > 0 && "border-t border-border")}>
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatDate(inv.createdAt)} · Expires {formatDate(inv.expiresAt)}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[inv.status] ?? "bg-secondary text-muted-foreground")}>
                  {inv.status.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
