import { auth } from "@/auth";
import { db } from "@/lib/db";
import { VerificationBanner } from "@/components/layout/VerificationBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let showBanner = false;

  if (session?.user) {
    const hospitalId = (session.user as any).hospitalId;
    if (hospitalId) {
      const hospital = await db.hospital.findUnique({ where: { id: hospitalId }, select: { verified: true } });
      showBanner = hospital?.verified === false;
    }
  }

  return (
    <>
      {showBanner && <VerificationBanner />}
      {children}
    </>
  );
}
