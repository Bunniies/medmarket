import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { NewListingForm } from "@/components/listings/NewListingForm";
import type { ListingForEdit } from "@/components/listings/NewListingForm";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "myListings" });
  return { title: t("editPageTitle") };
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const userId = (session.user as any).id;

  const [listing, categories] = await Promise.all([
    db.listing.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!listing) notFound();
  if (listing.sellerId !== userId) notFound();

  const t = await getTranslations("myListings");

  const listingForEdit: ListingForEdit = {
    id: listing.id,
    title: listing.title,
    medicineName: listing.medicineName,
    genericName: listing.genericName,
    atcCode: listing.atcCode,
    manufacturer: listing.manufacturer,
    batchNumber: listing.batchNumber,
    expiryDate: listing.expiryDate.toISOString().slice(0, 10),
    quantity: listing.quantity,
    unit: listing.unit,
    pricePerUnit: Number(listing.pricePerUnit),
    condition: listing.condition,
    categoryId: listing.categoryId,
    description: listing.description,
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/my-listings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("pageTitle")}
        </Link>
        <h1 className="mb-6 mt-4 text-3xl font-bold text-gray-900">{t("editPageTitle")}</h1>
        <NewListingForm categories={categories} listing={listingForEdit} />
      </main>
    </div>
  );
}
