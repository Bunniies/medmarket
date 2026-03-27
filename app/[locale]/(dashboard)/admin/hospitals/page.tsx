import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminHospitalsManager } from "@/components/admin/AdminHospitalsManager";

export const metadata = { title: "Hospitals — Admin" };

export default async function AdminHospitalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if ((session.user as any).role !== "PLATFORM_ADMIN") notFound();

  const hospitals = await db.hospital.findMany({
    include: {
      users: { select: { name: true, email: true, role: true }, where: { role: "HOSPITAL_ADMIN" }, take: 1 },
      _count: { select: { listings: true, users: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const serialized = hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    city: h.city,
    country: h.country,
    verified: h.verified,
    createdAt: h.createdAt.toISOString(),
    adminUser: h.users[0] ?? null,
    memberCount: h._count.users,
    listingCount: h._count.listings,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
  <h1 className="mb-1 text-3xl font-bold text-gray-900">Admin</h1>
  <p className="mb-8 text-sm text-muted-foreground">Manage hospitals</p>
  <AdminNav />
  <AdminHospitalsManager hospitals={serialized} />
</main>
  );
}
