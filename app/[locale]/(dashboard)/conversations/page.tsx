import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ConversationList } from "@/components/chat/ConversationList";
import type { ConvRow } from "@/components/chat/ConversationList";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "conversations" });
  return { title: t("metaTitle") };
}

export default async function ConversationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  const userId = (session.user as any).id;

  const t = await getTranslations("conversations");

  const conversations = await db.conversation.findMany({
    where: {
      OR: [
        { initiatorId: userId },
        { listing: { sellerId: userId } },
      ],
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          medicineName: true,
          sellerId: true,
          seller: { select: { id: true, name: true, email: true, hospital: { select: { name: true, city: true } } } },
        },
      },
      initiator: {
        select: { id: true, name: true, email: true, hospital: { select: { name: true, city: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Compute hasUnread per conversation
  const unreadFlags = await Promise.all(
    conversations.map(async (c) => {
      const isInitiator = c.initiatorId === userId;
      const myLastReadAt = isInitiator ? c.initiatorLastReadAt : c.sellerLastReadAt;
      const hasUnread = !!(await db.message.findFirst({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          ...(myLastReadAt ? { createdAt: { gt: myLastReadAt } } : {}),
        },
      }));
      return hasUnread;
    })
  );

  const serialized: ConvRow[] = conversations.map((c, i) => ({
    id: c.id,
    updatedAt: c.updatedAt.toISOString(),
    hasUnread: unreadFlags[i],
    listing: {
      id: c.listing.id,
      title: c.listing.title,
      medicineName: c.listing.medicineName,
      sellerId: c.listing.sellerId,
      seller: {
        id: c.listing.seller.id,
        name: c.listing.seller.name,
        email: c.listing.seller.email,
        hospital: c.listing.seller.hospital
          ? { name: c.listing.seller.hospital.name, city: c.listing.seller.hospital.city }
          : null,
      },
    },
    initiator: {
      id: c.initiator.id,
      name: c.initiator.name,
      email: c.initiator.email,
      hospital: c.initiator.hospital
        ? { name: c.initiator.hospital.name, city: c.initiator.hospital.city }
        : null,
    },
    lastMessage: c.messages[0]
      ? { body: c.messages[0].body, createdAt: c.messages[0].createdAt.toISOString() }
      : null,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
  <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
  <ConversationList conversations={serialized} currentUserId={userId} />
</main>
  );
}
