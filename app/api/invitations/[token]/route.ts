import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/invitations/[token] — validate an invitation token (used by register page)
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { hospital: { select: { id: true, name: true, city: true, country: true } } },
  });

  if (!invitation) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  if (invitation.status !== "PENDING") return NextResponse.json({ error: "Invitation already used" }, { status: 410 });
  if (invitation.expiresAt < new Date()) return NextResponse.json({ error: "Invitation expired" }, { status: 410 });

  return NextResponse.json({
    email: invitation.email,
    hospital: invitation.hospital,
  });
}
