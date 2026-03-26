import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminListingsManager } from "@/components/admin/AdminListingsManager";

export const metadata = { title: "Listings — Admin" };

export default async function AdminListingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if ((session.user as any).role !== "PLATFORM_ADMIN") notFound();

  const listings = await db.listing.findMany({
    include: {
      hospital: { select: { name: true } },
      seller: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = listings.map((l) => ({
    id: l.id,
    title: l.title,
    medicineName: l.medicineName,
    status: l.status,
    expiryDate: l.expiryDate.toISOString(),
    createdAt: l.createdAt.toISOString(),
    hospitalName: l.hospital.name,
    sellerName: l.seller.name,
    sellerEmail: l.seller.email,
  }));

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="mb-1 text-3xl font-bold text-gray-900">Admin</h1>
        <p className="mb-8 text-sm text-muted-foreground">{serialized.length} listing{serialized.length !== 1 ? "s" : ""} total</p>
        <AdminNav />
        <AdminListingsManager listings={serialized} />
      </main>
    </div>
  );
}
