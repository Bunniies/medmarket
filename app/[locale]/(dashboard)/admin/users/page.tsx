import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";

export const metadata = { title: "Users — Admin" };

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if ((session.user as any).role !== "PLATFORM_ADMIN") notFound();

  const users = await db.user.findMany({
    where: { role: { not: "PLATFORM_ADMIN" } },
    include: { hospital: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
    hospitalName: u.hospital?.name ?? null,
  }));

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="mb-1 text-3xl font-bold text-gray-900">Admin</h1>
        <p className="mb-8 text-sm text-muted-foreground">{serialized.length} user{serialized.length !== 1 ? "s" : ""}</p>
        <AdminNav />
        <AdminUsersManager users={serialized} />
      </main>
    </div>
  );
}
