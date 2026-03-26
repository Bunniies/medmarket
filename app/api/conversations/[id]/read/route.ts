import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// PATCH /api/conversations/[id]/read — mark conversation as read for current user
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: { listing: { select: { sellerId: true } } },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isInitiator = conversation.initiatorId === userId;
  const isSeller = conversation.listing.sellerId === userId;
  if (!isInitiator && !isSeller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.conversation.update({
    where: { id },
    data: isInitiator
      ? { initiatorLastReadAt: new Date() }
      : { sellerLastReadAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
