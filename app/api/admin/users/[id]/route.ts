import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// PATCH /api/admin/users/[id] — toggle active status (PLATFORM_ADMIN only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "PLATFORM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminId = (session.user as any).id as string;
  const { id } = await params;
  const { active } = await req.json();

  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role === "PLATFORM_ADMIN") return NextResponse.json({ error: "Cannot deactivate platform admins" }, { status: 400 });

  await db.user.update({ where: { id }, data: { active } });

  await db.adminLog.create({
    data: {
      action:        active ? "USER_REACTIVATED" : "USER_DEACTIVATED",
      targetType:    "USER",
      targetId:      id,
      targetName:    user.name ?? user.email,
      performedById: adminId,
    },
  });

  return NextResponse.json({ ok: true });
}
