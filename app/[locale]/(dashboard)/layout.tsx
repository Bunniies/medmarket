import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
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
      <Navbar />
      <div className="flex min-h-screen bg-secondary/20">
        <DashboardSidebar />
        <div className="flex-1 min-w-0">
          {showBanner && <VerificationBanner />}
          {children}
        </div>
      </div>
    </>
  );
}
