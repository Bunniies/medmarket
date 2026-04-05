import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";
import { NextResponse, type NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware(routing);

// Routes that require any authenticated user
const protectedRoutes = ["/dashboard", "/listings/new", "/orders", "/admin"];
// Routes only PLATFORM_ADMIN may access
const adminRoutes = ["/admin"];
// Routes PLATFORM_ADMIN should NOT access (redirect them to /admin instead)
const platformAdminForbidden = ["/profile", "/orders", "/my-listings"];
const authRoutes = ["/login", "/register"];

export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role as string | undefined;

  // Strip locale prefix to get the actual pathname for route matching
  const potentialLocale = nextUrl.pathname.split("/")[1] ?? "";
  const locale = (routing.locales as readonly string[]).includes(potentialLocale)
    ? potentialLocale
    : routing.defaultLocale;
  const localePrefix = new RegExp(`^\\/(${routing.locales.join("|")})`);
  const pathnameWithoutLocale =
    nextUrl.pathname.replace(localePrefix, "") || "/";

  const isProtectedRoute = protectedRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );
  const isAdminRoute = adminRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );
  const isAuthRoute = authRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?callbackUrl=${nextUrl.pathname}`, nextUrl)
    );
  }

  if (isLoggedIn) {
    // Non-admin users cannot access admin routes
    if (isAdminRoute && role !== "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, nextUrl));
    }

    // PLATFORM_ADMIN should not land on hospital-user pages
    if (
      role === "PLATFORM_ADMIN" &&
      platformAdminForbidden.some((r) => pathnameWithoutLocale.startsWith(r))
    ) {
      return NextResponse.redirect(new URL(`/${locale}/admin`, nextUrl));
    }

    if (isAuthRoute) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, nextUrl));
    }
  }

  return intlMiddleware(req as NextRequest);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
