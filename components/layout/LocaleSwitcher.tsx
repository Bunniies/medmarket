"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border px-1.5 py-1 text-xs font-medium">
      {["en", "it"].map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          disabled={isPending}
          className={`rounded px-1.5 py-0.5 uppercase transition-colors ${
            l === locale
              ? "bg-brand-600 text-white"
              : "text-gray-500 hover:text-brand-700"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
