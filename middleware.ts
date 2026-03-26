import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";
import { NextResponse, type NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = ["/dashboard", "/listings/new", "/orders"];
const authRoutes = ["/login", "/register"];

export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Strip locale prefix to get the actual pathname for route matching
  const locale = nextUrl.pathname.split("/")[1] ?? "en";
  const pathnameWithoutLocale =
    nextUrl.pathname.replace(/^\/(en|it)/, "") || "/";

  const isProtectedRoute = protectedRoutes.some((r) =>
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

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, nextUrl));
  }

  return intlMiddleware(req as NextRequest);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
