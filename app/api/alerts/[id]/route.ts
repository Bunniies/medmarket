import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// DELETE /api/alerts/[id] — delete (soft: set active=false) own alert
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await params;

  const alert = await db.medicineAlert.findUnique({ where: { id } });
  if (!alert || alert.userId !== userId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await db.medicineAlert.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
