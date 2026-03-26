"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Menu, X, ShoppingBag, PlusCircle, LayoutDashboard, LogOut, User, ShoppingCart, ListChecks, MessageSquare, Building2, ShieldCheck } from "lucide-react";
import { UnreadBadge } from "@/components/chat/UnreadBadge";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("navbar");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-brand-800">MedMarket</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/listings"
            className="text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
          >
            {t("browseListings")}
          </Link>
          <Link
            href="/guide"
            className="text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
          >
            {t("guide")}
          </Link>
          {session ? (
            <>
              <Link
                href="/listings/new"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                {t("newListing")}
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t("dashboard")}
              </Link>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{session.user?.name ?? session.user?.email}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-white py-1 shadow-lg z-50">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-secondary"
                    >
                      <User className="h-4 w-4" />
                      {t("profile")}
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-secondary"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {t("myOrders")}
                    </Link>
                    <Link
                      href="/my-listings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-secondary"
                    >
                      <ListChecks className="h-4 w-4" />
                      {t("myListings")}
                    </Link>
                    <Link
                      href="/conversations"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-secondary"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t("messages")}
                      <UnreadBadge />
                    </Link>
                    {role === "HOSPITAL_ADMIN" && (
                      <Link
                        href="/my-hospital"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-secondary"
                      >
                        <Building2 className="h-4 w-4" />
                        My Hospital
                      </Link>
                    )}
                    {role === "PLATFORM_ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Admin
                      </Link>
                    )}
                    <hr className="my-1 border-border" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-secondary"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("signOut")}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                {t("getStarted")}
              </Link>
            </>
          )}
          <LocaleSwitcher />
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={t("toggleMenu")}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/listings" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
              {t("browseListings")}
            </Link>
            <Link href="/guide" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
              {t("guide")}
            </Link>
            {session ? (
              <>
                <Link href="/listings/new" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                  {t("newListing")}
                </Link>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                  {t("dashboard")}
                </Link>
                <Link href="/profile" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                  {t("profile")}
                </Link>
                <Link href="/orders" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                  {t("myOrders")}
                </Link>
                <Link href="/my-listings" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                  {t("myListings")}
                </Link>
                <Link href="/conversations" className="flex items-center text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                  {t("messages")}
                  <UnreadBadge />
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-left text-sm font-medium text-red-600"
                >
                  {t("signOut")}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                  {t("signIn")}
                </Link>
                <Link href="/register" className="text-sm font-medium text-brand-700" onClick={() => setMobileOpen(false)}>
                  {t("getStarted")}
                </Link>
              </>
            )}
            <LocaleSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
