import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// PATCH /api/admin/hospitals/[id] — approve, reject, or revoke a hospital (PLATFORM_ADMIN only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "PLATFORM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminId = (session.user as any).id as string;
  const { id } = await params;
  const { action } = await req.json(); // "approve" | "reject" | "revoke"

  if (!["approve", "reject", "revoke"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { id } });
  if (!hospital) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ACTION_MAP: Record<string, string> = {
    approve: "HOSPITAL_APPROVED",
    reject:  "HOSPITAL_REJECTED",
    revoke:  "HOSPITAL_REVOKED",
  };

  if (action === "approve") {
    await db.hospital.update({ where: { id }, data: { verified: true } });
  } else if (action === "revoke") {
    await db.hospital.update({ where: { id }, data: { verified: false } });
  } else {
    // Rejection: delete hospital and cascade to users
    await db.hospital.delete({ where: { id } });
  }

  await db.adminLog.create({
    data: {
      action:       ACTION_MAP[action],
      targetType:   "HOSPITAL",
      targetId:     id,
      targetName:   hospital.name,
      performedById: adminId,
    },
  });

  return NextResponse.json({ ok: true });
}
