import { ShieldCheck, Building2, ArrowRight, Search, TrendingUp, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";

// Thresholds above which a "+" is appended
const THRESHOLD_HOSPITALS = 500;
const THRESHOLD_LISTINGS  = 500;
const THRESHOLD_SAVED_EUR = 10_000_000;

function formatCount(n: number, threshold: number): string {
  return n >= threshold ? `${n}+` : `${n}`;
}

function formatEur(n: number, threshold: number): string {
  let display: string;
  if (n >= 1_000_000) display = `€${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  else if (n >= 1_000)  display = `€${Math.round(n / 1_000)}K`;
  else                  display = `€${n}`;
  return n >= threshold ? `${display}+` : display;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [hospitalCount, activeListingCount, orderAgg] = await Promise.all([
    db.hospital.count({ where: { verified: true } }),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { totalPrice: true },
    }),
  ]);

  const totalSavedEur = Number(orderAgg._sum.totalPrice ?? 0);

  const stats = {
    hospitals: formatCount(hospitalCount, THRESHOLD_HOSPITALS),
    listings:  formatCount(activeListingCount, THRESHOLD_LISTINGS),
    saved:     formatEur(totalSavedEur, THRESHOLD_SAVED_EUR),
  };

  return <HomePageContent stats={stats} />;
}

function HomePageContent({ stats }: { stats: { hospitals: string; listings: string; saved: string } }) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");

  const features = [
    { icon: ShieldCheck, title: t("feature1Title"), description: t("feature1Desc") },
    { icon: Building2, title: t("feature2Title"), description: t("feature2Desc") },
    { icon: TrendingUp, title: t("feature3Title"), description: t("feature3Desc") },
    { icon: Clock, title: t("feature4Title"), description: t("feature4Desc") },
    { icon: Search, title: t("feature5Title"), description: t("feature5Desc") },
    { icon: ArrowRight, title: t("feature6Title"), description: t("feature6Desc") },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 to-brand-900 px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100">
            {t("badge")}
          </span>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {t("heroTitle")}<br />
            <span className="text-blue-200">{t("heroSubtitle")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            {t("heroDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/listings">
              <Button size="lg" className="bg-white text-brand-700 hover:bg-blue-50 gap-2">
                <Search className="h-5 w-5" />
                {tCommon("browseListings")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white/10 gap-2">
                {tCommon("registerHospital")}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 px-4 sm:px-6 lg:px-8">
          {[
            { value: stats.hospitals, label: t("statsHospitals") },
            { value: stats.saved,     label: t("statsSaved") },
            { value: stats.listings,  label: t("statsListings") },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center py-6">
              <span className="text-3xl font-bold text-brand-700">{stat.value}</span>
              <span className="mt-1 text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {t("featuresHeading")}
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <feature.icon className="h-5 w-5 text-brand-700" />
              </div>
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-brand-900">
            {t("ctaHeading")}
          </h2>
          <p className="mt-4 text-brand-700">
            {t("ctaDescription")}
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg">{tCommon("registerHospital")}</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <span>{t("footerCopyright")}</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-brand-700 transition-colors">{tCommon("privacy")}</Link>
            <Link href="/terms" className="hover:text-brand-700 transition-colors">{tCommon("terms")}</Link>
            <Link href="/contact" className="hover:text-brand-700 transition-colors">{tCommon("contact")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
