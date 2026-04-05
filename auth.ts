import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

class AccountDeactivatedError extends CredentialsSignin {
  code = "account_deactivated";
}
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/auth.config";
import { getLoginRatelimiter, getIpFromRequest } from "@/lib/ratelimit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const limiter = getLoginRatelimiter();
        if (limiter) {
          const ip = getIpFromRequest(request);
          const { success } = await limiter.limit(ip);
          if (!success) return null;
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          include: { hospital: true },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.active) throw new AccountDeactivatedError();

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          hospitalId: user.hospitalId,
        };
      },
    }),
  ],
});
