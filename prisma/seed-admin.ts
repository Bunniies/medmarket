/**
 * Creates a PLATFORM_ADMIN user.
 * Safe to run against the production DB — uses upsert, won't duplicate.
 *
 * Usage:
 *   DATABASE_URL="<prod-url>" npx tsx prisma/seed-admin.ts
 *
 * Change the email and password below before running.
 */

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL    = "alessandroconigli@gmail.com";  // ← change before running
const ADMIN_NAME     = "Platform Admin";        // ← change if desired
const ADMIN_PASSWORD = "MedMarkAleFranci1994!"; // ← MUST change before running

async function main() {
  if (ADMIN_PASSWORD === "change-me-before-running") {
    console.error("❌  Set a real password in seed-admin.ts before running.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where:  { email: ADMIN_EMAIL },
    update: { passwordHash, name: ADMIN_NAME, role: UserRole.PLATFORM_ADMIN },
    create: {
      email:        ADMIN_EMAIL,
      name:         ADMIN_NAME,
      passwordHash,
      role:         UserRole.PLATFORM_ADMIN,
    },
  });

  console.log(`✅  PLATFORM_ADMIN ready: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
