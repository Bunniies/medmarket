import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";

// POST /api/invitations — HOSPITAL_ADMIN creates an invite for a new staff member
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const hospitalId = (session.user as any).hospitalId;

  if (role !== "HOSPITAL_ADMIN" && role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Only hospital admins can send invitations" }, { status: 403 });
  }

  if (!hospitalId) return NextResponse.json({ error: "No hospital associated" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { id: hospitalId } });
  if (!hospital?.verified) {
    return NextResponse.json({ error: "Your hospital must be verified before inviting staff" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Check if this email already has an account
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Upsert: if a pending invite for this email+hospital already exists, refresh it
  const invitation = await db.invitation.upsert({
    where: { id: (await db.invitation.findFirst({ where: { email, hospitalId, status: "PENDING" } }))?.id ?? "none" },
    create: { email, hospitalId, expiresAt },
    update: { expiresAt, status: "PENDING" },
  });

  const inviterName = (session.user as any).name ?? null;
  sendInvitationEmail({ recipientEmail: email, hospitalName: hospital.name, inviterName, token: invitation.token });

  return NextResponse.json({ ok: true }, { status: 201 });
}

// GET /api/invitations — list pending invitations for the current hospital admin
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const hospitalId = (session.user as any).hospitalId;

  if (role !== "HOSPITAL_ADMIN" && role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invitations = await db.invitation.findMany({
    where: { hospitalId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}
