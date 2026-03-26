import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no bcryptjs, no Prisma).
// Used by middleware; auth.ts extends this with Node.js-only providers.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/en/login",
    error: "/en/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.hospitalId = (user as any).hospitalId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).hospitalId = token.hospitalId;
      }
      return session;
    },
  },
};
