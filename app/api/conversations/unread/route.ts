import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/conversations/unread — total number of conversations with unread messages
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ count: 0 });
  const userId = (session.user as any).id;

  const conversations = await db.conversation.findMany({
    where: {
      OR: [
        { initiatorId: userId },
        { listing: { sellerId: userId } },
      ],
    },
    include: {
      listing: { select: { sellerId: true } },
    },
  });

  let count = 0;
  for (const conv of conversations) {
    const isInitiator = conv.initiatorId === userId;
    const myLastReadAt = isInitiator ? conv.initiatorLastReadAt : conv.sellerLastReadAt;
    // Unread if the conversation was updated after the user last read it
    if (!myLastReadAt || conv.updatedAt > myLastReadAt) {
      // Only count if there's at least one message from the other person
      const hasOtherMessage = await db.message.findFirst({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          ...(myLastReadAt ? { createdAt: { gt: myLastReadAt } } : {}),
        },
      });
      if (hasOtherMessage) count++;
    }
  }

  return NextResponse.json({ count });
}
