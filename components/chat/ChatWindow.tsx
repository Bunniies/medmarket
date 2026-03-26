"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

interface MessageData {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null; email: string };
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageData[];
}

export function ChatWindow({ conversationId, currentUserId, initialMessages }: ChatWindowProps) {
  const t = useTranslations("conversations");
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function markRead() {
    fetch(`/api/conversations/${conversationId}/read`, { method: "PATCH" });
  }

  // Mark as read on mount
  useEffect(() => {
    markRead();
  }, [conversationId]);

  // Poll for new messages every 4 seconds
  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data: MessageData[] = await res.json();
        setMessages((prev) => {
          if (data.length !== prev.length) markRead();
          return data;
        });
      }
    }, 4000);
    return () => clearInterval(id);
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const body = input.trim();
    if (!body) return;
    setSending(true);
    setError("");

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

    if (res.ok) {
      const newMsg: MessageData = await res.json();
      setMessages((prev) => [...prev, newMsg]);
      markRead();
      setInput("");
      inputRef.current?.focus();
    } else {
      const data = await res.json();
      setError(data.error ?? t("sendError"));
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function senderLabel(msg: MessageData) {
    return msg.sender.name ?? msg.sender.email;
  }

  function formatTime(iso: string) {
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(new Date(iso));
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-[400px] max-h-[560px]">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">{t("noMessages")}</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender.id === currentUserId;
          return (
            <div key={msg.id} className={cn("flex flex-col gap-0.5 max-w-[75%]", isOwn ? "self-end items-end" : "self-start items-start")}>
              {!isOwn && (
                <span className="text-xs font-medium text-muted-foreground px-1">{senderLabel(msg)}</span>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
                  isOwn
                    ? "bg-brand-600 text-white rounded-br-sm"
                    : "bg-secondary text-gray-900 rounded-bl-sm"
                )}
              >
                {msg.body}
              </div>
              <span className="text-[11px] text-muted-foreground px-1">{formatTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={t("inputPlaceholder")}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{t("inputHint")}</p>
      </div>
    </div>
  );
}
