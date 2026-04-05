import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no bcryptjs, no Prisma).
// Used by middleware; auth.ts extends this with Node.js-only providers.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.hospitalId = user.hospitalId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.hospitalId = token.hospitalId;
      }
      return session;
    },
  },
};
