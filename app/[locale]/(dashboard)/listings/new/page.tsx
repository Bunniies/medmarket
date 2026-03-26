import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/layout/Navbar";
import { NewListingForm } from "@/components/listings/NewListingForm";
import { db } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newListing" });
  return { title: t("metaTitle") };
}

export default async function NewListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) redirect("/login");

  const t = await getTranslations("newListing");
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <NewListingForm categories={categories} />
      </main>
    </div>
  );
}
