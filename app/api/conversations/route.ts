import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/conversations — list all conversations for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const conversations = await db.conversation.findMany({
    where: {
      OR: [
        { initiatorId: userId },
        { listing: { sellerId: userId } },
      ],
    },
    include: {
      listing: { select: { id: true, title: true, medicineName: true, sellerId: true } },
      initiator: { select: { id: true, name: true, email: true, hospitalId: true, hospital: { select: { name: true } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}

// POST /api/conversations — create or retrieve a conversation for a listing
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { listingId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId === userId) {
    return NextResponse.json({ error: "Cannot start a conversation on your own listing" }, { status: 400 });
  }

  const conversation = await db.conversation.upsert({
    where: { listingId_initiatorId: { listingId, initiatorId: userId } },
    create: { listingId, initiatorId: userId },
    update: {},
  });

  return NextResponse.json(conversation, { status: 201 });
}
