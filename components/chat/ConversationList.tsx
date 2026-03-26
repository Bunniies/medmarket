"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MessageSquare, ChevronDown, ChevronUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export interface ConvRow {
  id: string;
  updatedAt: string;
  hasUnread: boolean;
  listing: {
    id: string;
    title: string;
    medicineName: string;
    sellerId: string;
    seller: {
      id: string;
      name: string | null;
      email: string;
      hospital: { name: string; city: string } | null;
    };
  };
  initiator: {
    id: string;
    name: string | null;
    email: string;
    hospital: { name: string; city: string } | null;
  };
  lastMessage: { body: string; createdAt: string } | null;
}

interface ContactGroup {
  contactId: string;
  contactName: string;
  contactHospital: string | null;
  conversations: ConvRow[];
  latestUpdatedAt: string;
  hasUnread: boolean;
}

function getOtherParty(conv: ConvRow, currentUserId: string) {
  if (conv.initiator.id === currentUserId) {
    return {
      id: conv.listing.seller.id,
      name: conv.listing.seller.name,
      email: conv.listing.seller.email,
      hospital: conv.listing.seller.hospital,
    };
  }
  return {
    id: conv.initiator.id,
    name: conv.initiator.name,
    email: conv.initiator.email,
    hospital: conv.initiator.hospital,
  };
}

export function ConversationList({
  conversations,
  currentUserId,
}: {
  conversations: ConvRow[];
  currentUserId: string;
}) {
  const t = useTranslations("conversations");
  const [view, setView] = useState<"listing" | "contact">("listing");
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());

  function toggleContact(id: string) {
    setExpandedContacts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
        <MessageSquare className="h-10 w-10 opacity-30" />
        <p className="text-lg font-medium">{t("noConversations")}</p>
        <p className="text-sm">{t("noConversationsHint")}</p>
      </div>
    );
  }

  // Group by contact for the "by contact" view
  const contactGroups: ContactGroup[] = [];
  const seen = new Map<string, ContactGroup>();
  for (const conv of conversations) {
    const other = getOtherParty(conv, currentUserId);
    if (!seen.has(other.id)) {
      const group: ContactGroup = {
        contactId: other.id,
        contactName: other.name ?? other.email,
        contactHospital: other.hospital ? `${other.hospital.name}, ${other.hospital.city}` : null,
        conversations: [conv],
        latestUpdatedAt: conv.updatedAt,
        hasUnread: conv.hasUnread,
      };
      seen.set(other.id, group);
      contactGroups.push(group);
    } else {
      const group = seen.get(other.id)!;
      group.conversations.push(conv);
      if (conv.updatedAt > group.latestUpdatedAt) group.latestUpdatedAt = conv.updatedAt;
      if (conv.hasUnread) group.hasUnread = true;
    }
  }
  contactGroups.sort((a, b) => (a.latestUpdatedAt < b.latestUpdatedAt ? 1 : -1));

  return (
    <div className="flex flex-col gap-4">
      {/* Tab toggle */}
      <div className="flex rounded-lg border border-border bg-white p-1 shadow-sm w-fit">
        <button
          onClick={() => setView("listing")}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            view === "listing"
              ? "bg-brand-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          {t("viewByListing")}
        </button>
        <button
          onClick={() => setView("contact")}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            view === "contact"
              ? "bg-brand-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          {t("viewByContact")}
        </button>
      </div>

      {/* By listing */}
      {view === "listing" && (
        <div className="flex flex-col gap-2">
          {conversations.map((conv) => {
            const other = getOtherParty(conv, currentUserId);
            return (
              <ConvCard
                key={conv.id}
                convId={conv.id}
                title={conv.listing.title}
                subtitle={other.name ?? other.email}
                subtitleExtra={other.hospital ? `${other.hospital.name}, ${other.hospital.city}` : undefined}
                lastMessage={conv.lastMessage}
                hasUnread={conv.hasUnread}
              />
            );
          })}
        </div>
      )}

      {/* By contact */}
      {view === "contact" && (
        <div className="flex flex-col gap-2">
          {contactGroups.map((group) => {
            const isExpanded = expandedContacts.has(group.contactId);
            const multipleConvs = group.conversations.length > 1;

            if (!multipleConvs) {
              // Single conversation — link directly
              const conv = group.conversations[0];
              return (
                <ConvCard
                  key={group.contactId}
                  convId={conv.id}
                  title={group.contactName}
                  subtitle={group.contactHospital ?? undefined}
                  subtitleExtra={conv.listing.title}
                  lastMessage={conv.lastMessage}
                  hasUnread={conv.hasUnread}
                  icon="user"
                />
              );
            }

            // Multiple conversations with this contact — expandable group
            return (
              <div key={group.contactId} className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleContact(group.contactId)}
                  className="flex w-full items-start gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors text-left"
                >
                  <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <User className="h-4 w-4" />
                    {group.hasUnread && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{group.contactName}</p>
                    {group.contactHospital && (
                      <p className="text-xs text-muted-foreground">{group.contactHospital}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("conversationCount", { count: group.conversations.length })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    <span className="text-xs">{formatDate(group.latestUpdatedAt)}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {group.conversations.map((conv) => (
                      <Link
                        key={conv.id}
                        href={`/conversations/${conv.id}`}
                        className="flex items-start gap-3 px-5 py-3 hover:bg-secondary/10 transition-colors"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{conv.listing.title}</p>
                          {conv.lastMessage && (
                            <p className="truncate text-xs text-muted-foreground">{conv.lastMessage.body}</p>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDate(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConvCard({
  convId,
  title,
  subtitle,
  subtitleExtra,
  lastMessage,
  hasUnread = false,
  icon = "message",
}: {
  convId: string;
  title: string;
  subtitle?: string;
  subtitleExtra?: string;
  lastMessage: { body: string; createdAt: string } | null;
  hasUnread?: boolean;
  icon?: "message" | "user";
}) {
  return (
    <Link
      href={`/conversations/${convId}`}
      className={cn(
        "flex items-start gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm hover:bg-secondary/20 transition-colors",
        hasUnread ? "border-brand-300" : "border-border"
      )}
    >
      <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        {icon === "user" ? <User className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate", hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-900")}>
          {title}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {subtitleExtra && <p className="text-xs text-muted-foreground italic">{subtitleExtra}</p>}
        {lastMessage && (
          <p className={cn("mt-1 truncate text-sm", hasUnread ? "font-medium text-gray-700" : "text-muted-foreground")}>
            {lastMessage.body}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {lastMessage && (
          <span className="text-xs text-muted-foreground">{formatDate(lastMessage.createdAt)}</span>
        )}
        {hasUnread && (
          <span className="h-2 w-2 rounded-full bg-red-500" />
        )}
      </div>
    </Link>
  );
}
