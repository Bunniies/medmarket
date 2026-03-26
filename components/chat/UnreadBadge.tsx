"use client";

import { useEffect, useState } from "react";

export function UnreadBadge() {
  const [count, setCount] = useState(0);

  async function fetchCount() {
    try {
      const res = await fetch("/api/conversations/unread");
      if (res.ok) {
        const data = await res.json();
        setCount(data.count ?? 0);
      }
    } catch {
      // silently ignore network errors
    }
  }

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
}
