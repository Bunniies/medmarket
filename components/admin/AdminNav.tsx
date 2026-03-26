"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { LayoutDashboard, Building2, ListChecks, Users, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin",           label: "Overview",  icon: LayoutDashboard },
  { href: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/admin/listings",  label: "Listings",  icon: ListChecks },
  { href: "/admin/users",     label: "Users",     icon: Users },
  { href: "/admin/logs",      label: "Logs",      icon: ScrollText },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-1 rounded-xl border border-border bg-white p-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-amber-50 text-amber-700"
                : "text-muted-foreground hover:bg-secondary hover:text-gray-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
