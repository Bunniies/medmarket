import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ListingCard } from "@/components/listings/ListingCard";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { haversineKm } from "@/lib/utils";
import type { ListingWithRelations } from "@/types";

interface SearchParams {
  q?: string;
  category?: string;
  page?: string;
  expiry?: string;   // "7" | "30" | "90"
  distance?: string; // "50" | "100" | "200" | "500"
}

interface ListingsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

async function getListings(
  searchParams: SearchParams,
  userHospital: { latitude: number | null; longitude: number | null } | null
) {
  const { q, category, page = "1", expiry, distance } = searchParams;
  const pageSize = 12;
  const skip = (Number(page) - 1) * pageSize;

  // Expiry date filter
  const expiryWhere =
    expiry
      ? {
          gte: new Date(),
          lte: new Date(Date.now() + Number(expiry) * 24 * 60 * 60 * 1000),
        }
      : undefined;

  // Distance filter: resolve to a set of hospital IDs within range
  let hospitalIdFilter: { in: string[] } | undefined;
  if (distance && userHospital?.latitude != null && userHospital?.longitude != null) {
    const maxKm = Number(distance);
    const hospitals = await db.hospital.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: { id: true, latitude: true, longitude: true },
    });
    const nearbyIds = hospitals
      .filter(
        (h) =>
          haversineKm(
            userHospital.latitude!,
            userHospital.longitude!,
            h.latitude!,
            h.longitude!
          ) <= maxKm
      )
      .map((h) => h.id);
    hospitalIdFilter = { in: nearbyIds };
  }

  const where = {
    status: "ACTIVE" as const,
    ...(expiryWhere && { expiryDate: expiryWhere }),
    ...(hospitalIdFilter && { hospitalId: hospitalIdFilter }),
    ...(q && {
      OR: [
        { medicineName: { contains: q, mode: "insensitive" as const } },
        { genericName: { contains: q, mode: "insensitive" as const } },
        { title: { contains: q, mode: "insensitive" as const } },
        { manufacturer: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(category && { category: { slug: category } }),
  };

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      include: {
        hospital: true,
        seller: { select: { id: true, name: true, email: true, image: true } },
        category: true,
      },
      orderBy: { expiryDate: "asc" },
      skip,
      take: pageSize,
    }),
    db.listing.count({ where }),
  ]);

  const serialized: ListingWithRelations[] = listings.map((l) => ({
    ...l,
    pricePerUnit: Number(l.pricePerUnit),
  }));
  return { listings: serialized, total, pageSize };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings" });
  return { title: t("metaTitle") };
}

export default async function ListingsPage({ params, searchParams }: ListingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolvedSearchParams = await searchParams;

  const session = await auth();
  if (!session?.user) redirect("/login");

  // Get user's hospital location (needed for distance filter)
  const hospitalId = (session?.user as any)?.hospitalId as string | undefined;
  const userHospital = hospitalId
    ? await db.hospital.findUnique({
        where: { id: hospitalId },
        select: { latitude: true, longitude: true },
      })
    : null;

  const hasCoords = userHospital?.latitude != null && userHospital?.longitude != null;

  const [{ listings, total, pageSize }, categories, t] = await Promise.all([
    getListings(resolvedSearchParams, userHospital),
    db.category.findMany({ orderBy: { name: "asc" } }),
    getTranslations("listings"),
  ]);

  const currentPage = Number(resolvedSearchParams.page ?? 1);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
          <p className="mt-1 text-muted-foreground">{t("available", { count: total })}</p>
        </div>

        {/* Filters */}
        <form method="GET" className="mb-8 flex flex-col gap-3">
          {/* Row 1: search + category + submit */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              name="q"
              defaultValue={resolvedSearchParams.q}
              placeholder={t("searchPlaceholder")}
              className="flex-1 rounded-lg border border-input bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              name="category"
              defaultValue={resolvedSearchParams.category}
              className="rounded-lg border border-input bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t("allCategories")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              {t("search")}
            </button>
          </div>

          {/* Row 2: expiry + distance */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {t("expiryFilter")}
              </label>
              <select
                name="expiry"
                defaultValue={resolvedSearchParams.expiry ?? ""}
                className="rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t("expiryAny")}</option>
                <option value="7">{t("expiry7d")}</option>
                <option value="30">{t("expiry30d")}</option>
                <option value="90">{t("expiry90d")}</option>
              </select>
            </div>

            {hasCoords && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {t("distanceFilter")}
                </label>
                <select
                  name="distance"
                  defaultValue={resolvedSearchParams.distance ?? ""}
                  className="rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t("distanceAny")}</option>
                  <option value="50">{t("distance50")}</option>
                  <option value="100">{t("distance100")}</option>
                  <option value="200">{t("distance200")}</option>
                  <option value="500">{t("distance500")}</option>
                </select>
              </div>
            )}
          </div>
        </form>

        {/* Listings grid */}
        {listings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
            <p className="text-lg font-medium">{t("noResults")}</p>
            <p className="text-sm">{t("noResultsHint")}</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`?${new URLSearchParams({ ...resolvedSearchParams, page: String(p) })}`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  p === currentPage
                    ? "bg-brand-600 text-white"
                    : "border border-border bg-white text-gray-700 hover:bg-secondary"
                }`}
              >
                {p}
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
