import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ArrowLeft, Package } from "lucide-react";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  const userId = (session.user as any).id;

  const t = await getTranslations("conversations");

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          medicineName: true,
          sellerId: true,
          unit: true,
          seller: { select: { name: true, email: true, hospital: { select: { name: true, city: true } } } },
        },
      },
      initiator: {
        select: { id: true, name: true, email: true, hospital: { select: { name: true, city: true } } },
      },
      messages: {
        include: { sender: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) notFound();

  const isSeller = conversation.listing.sellerId === userId;
  const isInitiator = conversation.initiatorId === userId;
  if (!isSeller && !isInitiator) notFound();

  const otherParty = isSeller ? conversation.initiator : conversation.listing.seller;
  const otherPartyHospital = isSeller
    ? conversation.initiator.hospital
    : conversation.listing.seller.hospital;

  const serializedMessages = conversation.messages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    sender: { id: m.sender.id, name: m.sender.name, email: m.sender.email },
  }));

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/conversations"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToConversations")}
        </Link>

        {/* Context card */}
        <div className="mb-6 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
              <Package className="h-4 w-4 text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/listings/${conversation.listing.id}`}
                className="font-semibold text-gray-900 hover:text-brand-700 hover:underline"
              >
                {conversation.listing.title}
              </Link>
              <p className="text-xs text-muted-foreground">{conversation.listing.medicineName}</p>
            </div>
          </div>
          <div className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
            {t("talkingWith")}{" "}
            <span className="font-medium text-gray-900">
              {otherParty?.name ?? otherParty?.email}
            </span>
            {otherPartyHospital && (
              <> · {otherPartyHospital.name}, {otherPartyHospital.city}</>
            )}
          </div>
        </div>

        <ChatWindow
          conversationId={id}
          currentUserId={userId}
          initialMessages={serializedMessages}
        />
      </main>
    </div>
  );
}
