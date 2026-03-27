import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { InviteManager } from "@/components/admin/InviteManager";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Hospital" };

export default async function MyHospitalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const role = (session.user as any).role;
  if (role !== "HOSPITAL_ADMIN" && role !== "PLATFORM_ADMIN") notFound();

  const hospitalId = (session.user as any).hospitalId;
  if (!hospitalId) notFound();

  const [hospital, members, invitations] = await Promise.all([
    db.hospital.findUnique({ where: { id: hospitalId } }),
    db.user.findMany({ where: { hospitalId }, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    db.invitation.findMany({ where: { hospitalId }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!hospital) notFound();

  const serializedInvitations = invitations.map((i) => ({
    id: i.id,
    email: i.email,
    status: i.status,
    expiresAt: i.expiresAt.toISOString(),
    createdAt: i.createdAt.toISOString(),
  }));

  const serializedMembers = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
  <h1 className="mb-1 text-3xl font-bold text-gray-900">{hospital.name}</h1>
  <p className="mb-8 text-sm text-muted-foreground">{hospital.city}, {hospital.country}</p>

  <InviteManager
    members={serializedMembers}
    invitations={serializedInvitations}
    isVerified={hospital.verified}
  />
</main>
  );
}
