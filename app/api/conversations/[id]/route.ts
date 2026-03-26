import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/conversations/[id] — fetch conversation + all messages
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, medicineName: true, sellerId: true, unit: true } },
      initiator: { select: { id: true, name: true, email: true, hospital: { select: { name: true, city: true } } } },
      messages: {
        include: { sender: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSeller = conversation.listing.sellerId === userId;
  const isInitiator = conversation.initiatorId === userId;
  if (!isSeller && !isInitiator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(conversation);
}
