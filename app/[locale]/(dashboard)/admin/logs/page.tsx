import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminLogsManager } from "@/components/admin/AdminLogsManager";

export const metadata = { title: "Activity Log — Admin" };

export default async function AdminLogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if ((session.user as any).role !== "PLATFORM_ADMIN") notFound();

  const logs = await db.adminLog.findMany({
    include: { performedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serialized = logs.map((l) => ({
    id: l.id,
    action: l.action,
    targetType: l.targetType,
    targetName: l.targetName,
    performedByName: l.performedBy.name,
    performedByEmail: l.performedBy.email,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="mb-1 text-3xl font-bold text-gray-900">Admin</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {serialized.length === 0 ? "No actions recorded yet." : `${serialized.length} action${serialized.length !== 1 ? "s" : ""} recorded`}
        </p>
        <AdminNav />
        <AdminLogsManager logs={serialized} />
      </main>
    </div>
  );
}
