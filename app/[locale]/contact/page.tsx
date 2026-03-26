import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "@/i18n/navigation";
import { Mail, MessageSquare, ShieldCheck } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: `${t("contact")} | MedMarket` };
}

const CONTENT = {
  en: {
    title: "Contact Us",
    subtitle: "We're happy to help. Reach out through any of the channels below.",
    channels: [
      {
        icon: "general",
        heading: "General enquiries",
        body: "Questions about the platform, partnerships, or anything else.",
        email: "hello@medmarket.app",
      },
      {
        icon: "support",
        heading: "Technical support",
        body: "Issues with your account, listings, orders, or the platform itself.",
        email: "support@medmarket.app",
      },
      {
        icon: "privacy",
        heading: "Privacy & legal",
        body: "Data access requests, GDPR queries, or legal notices.",
        email: "privacy@medmarket.app",
      },
    ],
    responseNote: "We typically respond within one business day.",
    alreadyRegistered: "Already registered?",
    useChat: "Use the in-platform messaging to contact other hospital pharmacies directly.",
    backLink: "← Back to MedMarket",
  },
  it: {
    title: "Contattaci",
    subtitle: "Siamo felici di aiutarti. Contattaci tramite uno dei canali seguenti.",
    channels: [
      {
        icon: "general",
        heading: "Informazioni generali",
        body: "Domande sulla piattaforma, partnership o qualsiasi altra cosa.",
        email: "hello@medmarket.app",
      },
      {
        icon: "support",
        heading: "Supporto tecnico",
        body: "Problemi con il tuo account, annunci, ordini o la piattaforma stessa.",
        email: "support@medmarket.app",
      },
      {
        icon: "privacy",
        heading: "Privacy e questioni legali",
        body: "Richieste di accesso ai dati, domande sul GDPR o comunicazioni legali.",
        email: "privacy@medmarket.app",
      },
    ],
    responseNote: "Di solito rispondiamo entro un giorno lavorativo.",
    alreadyRegistered: "Già registrato?",
    useChat: "Usa la messaggistica in piattaforma per contattare direttamente le altre farmacie ospedaliere.",
    backLink: "← Torna a MedMarket",
  },
};

const ICON_MAP: Record<string, React.ReactNode> = {
  general: <Mail className="h-5 w-5 text-brand-600" />,
  support: <MessageSquare className="h-5 w-5 text-brand-600" />,
  privacy: <ShieldCheck className="h-5 w-5 text-brand-600" />,
};

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const content = CONTENT[locale as "en" | "it"] ?? CONTENT.en;

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{content.title}</h1>
        <p className="mb-10 text-sm text-muted-foreground">{content.subtitle}</p>

        <div className="flex flex-col gap-4">
          {content.channels.map((ch) => (
            <div key={ch.email} className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  {ICON_MAP[ch.icon]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{ch.heading}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{ch.body}</p>
                  <a
                    href={`mailto:${ch.email}`}
                    className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
                  >
                    {ch.email}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">{content.responseNote}</p>

        <div className="mt-8 rounded-xl border border-border bg-white p-5">
          <p className="text-sm font-semibold text-gray-900">{content.alreadyRegistered}</p>
          <p className="mt-1 text-sm text-muted-foreground">{content.useChat}</p>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <Link href="/" className="text-brand-600 hover:underline">{content.backLink}</Link>
        </div>
      </main>
    </div>
  );
}
