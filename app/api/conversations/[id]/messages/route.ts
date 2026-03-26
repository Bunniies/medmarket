import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendMessageNotification } from "@/lib/email";

// POST /api/conversations/[id]/messages — send a message
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Message body required" }, { status: 400 });

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          sellerId: true,
          title: true,
          seller: { select: { id: true, name: true, email: true, emailNotifyMessages: true } },
        },
      },
      initiator: { select: { id: true, name: true, email: true, emailNotifyMessages: true } },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSeller = conversation.listing.sellerId === userId;
  const isInitiator = conversation.initiatorId === userId;
  if (!isSeller && !isInitiator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [message] = await db.$transaction([
    db.message.create({
      data: { conversationId: id, senderId: userId, body: body.trim() },
      include: { sender: { select: { id: true, name: true, email: true } } },
    }),
    db.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    }),
  ]);

  // Notify the other party if they have message notifications enabled — fire and forget
  const recipient = isSeller ? conversation.initiator : conversation.listing.seller;
  const sender = isSeller ? conversation.listing.seller : conversation.initiator;

  if (recipient.emailNotifyMessages) {
    const senderHospital = await db.user.findUnique({
      where: { id: userId },
      select: { hospital: { select: { name: true } } },
    });
    sendMessageNotification({
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      senderName: sender.name,
      senderHospital: senderHospital?.hospital?.name ?? null,
      listingTitle: conversation.listing.title,
      messagePreview: body.trim(),
      conversationId: id,
    });
  }

  return NextResponse.json(message, { status: 201 });
}

// GET /api/conversations/[id]/messages — poll for messages (returns all, client dedupes)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: { listing: { select: { sellerId: true } } },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSeller = conversation.listing.sellerId === userId;
  const isInitiator = conversation.initiatorId === userId;
  if (!isSeller && !isInitiator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await db.message.findMany({
    where: { conversationId: id },
    include: { sender: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}
