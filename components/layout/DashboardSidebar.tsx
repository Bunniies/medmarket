"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  ListChecks,
  ShoppingCart,
  MessageSquare,
  Bell,
  Building2,
  User,
  ShieldCheck,
  Users,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UnreadBadge } from "@/components/chat/UnreadBadge";

const USER_NAV = [
  { href: "/dashboard",    icon: LayoutDashboard, key: "dashboard" },
  { href: "/listings",     icon: Search,          key: "browseListings" },
  { href: "/listings/new", icon: PlusCircle,       key: "newListing" },
  { href: "/my-listings",  icon: ListChecks,       key: "myListings" },
  { href: "/orders",       icon: ShoppingCart,     key: "myOrders" },
  { href: "/conversations",icon: MessageSquare,    key: "messages", badge: true },
  { href: "/alerts",       icon: Bell,             key: "alerts" },
  { href: "/profile",      icon: User,             key: "profile" },
] as const;

const HOSPITAL_ADMIN_EXTRA = [
  { href: "/my-hospital", icon: Building2, key: "myHospital" },
] as const;

const ADMIN_NAV = [
  { href: "/admin",             icon: ShieldCheck,   key: "adminDashboard" },
  { href: "/admin/hospitals",   icon: Building2,     key: "adminHospitals" },
  { href: "/admin/listings",    icon: ListChecks,    key: "adminListings" },
  { href: "/admin/users",       icon: Users,         key: "adminUsers" },
  { href: "/admin/logs",        icon: ClipboardList, key: "adminLogs" },
] as const;

export function DashboardSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const t = useTranslations("sidebar");

  const role = (session?.user as any)?.role;

  const items =
    role === "PLATFORM_ADMIN"
      ? ADMIN_NAV
      : role === "HOSPITAL_ADMIN"
      ? [...USER_NAV, ...HOSPITAL_ADMIN_EXTRA]
      : USER_NAV;

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-white">
      <nav className="sticky top-[57px] flex flex-col gap-0.5 p-3">
        {items.map(({ href, icon: Icon, key, ...rest }) => {
          const badge = "badge" in rest ? rest.badge : false;
          // Active if pathname equals href, or starts with href for nested routes (except root-like ones)
          const isActive =
            pathname === href ||
            (href !== "/dashboard" &&
              href !== "/listings" &&
              href !== "/listings/new" &&
              href !== "/profile" &&
              href !== "/alerts" &&
              pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-secondary hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(key)}</span>
              {badge && <UnreadBadge />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
