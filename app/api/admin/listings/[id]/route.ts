import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// PATCH /api/admin/listings/[id] — archive a listing (PLATFORM_ADMIN only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "PLATFORM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminId = (session.user as any).id as string;
  const { id } = await params;

  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.listing.update({ where: { id }, data: { status: "ARCHIVED" } });

  await db.adminLog.create({
    data: {
      action:        "LISTING_REMOVED",
      targetType:    "LISTING",
      targetId:      id,
      targetName:    listing.medicineName,
      performedById: adminId,
    },
  });

  return NextResponse.json({ ok: true });
}
