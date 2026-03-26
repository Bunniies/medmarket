import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: `${t("privacy")} | MedMarket` };
}

const CONTENT = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: March 2026",
    sections: [
      {
        heading: "1. Who we are",
        body: "MedMarket is a B2B platform connecting verified hospital pharmacies for the exchange of surplus and near-expiry medicines. References to 'we', 'us', or 'MedMarket' in this policy refer to the MedMarket platform and its operators.",
      },
      {
        heading: "2. Data we collect",
        body: "We collect the information you provide when registering: your name, work email address, and your hospital's name, city, and country. We also collect data generated through your use of the platform: listings you create, orders you place, and messages you send.",
      },
      {
        heading: "3. How we use your data",
        body: "Your data is used exclusively to operate the platform — to match buyers and sellers, facilitate orders, and enable communication between hospital pharmacies. We do not sell your data to third parties or use it for advertising purposes.",
      },
      {
        heading: "4. Data sharing",
        body: "Your hospital name, city, and country are visible to other verified users when you post a listing. Your individual name and email are shared only within your own hospital team and in direct conversations you initiate.",
      },
      {
        heading: "5. Email communications",
        body: "We send transactional emails related to your activity on the platform (order confirmations, message notifications). You can opt out of message notification emails in your profile settings. Transactional order emails cannot be disabled as they are essential to the service.",
      },
      {
        heading: "6. Data retention",
        body: "We retain your account data for as long as your account is active. If you wish to delete your account and associated data, contact us at privacy@medmarket.app.",
      },
      {
        heading: "7. Security",
        body: "All data is transmitted over HTTPS. Passwords are hashed using bcrypt and are never stored in plain text. We apply standard security practices to protect your information.",
      },
      {
        heading: "8. Your rights",
        body: "Under GDPR, you have the right to access, correct, or delete your personal data, and to object to or restrict its processing. To exercise these rights, contact us at privacy@medmarket.app.",
      },
      {
        heading: "9. Contact",
        body: "For any privacy-related questions, email us at privacy@medmarket.app.",
      },
    ],
  },
  it: {
    title: "Informativa sulla Privacy",
    updated: "Ultimo aggiornamento: marzo 2026",
    sections: [
      {
        heading: "1. Chi siamo",
        body: "MedMarket è una piattaforma B2B che collega farmacie ospedaliere verificate per lo scambio di farmaci in eccesso e prossimi alla scadenza. I riferimenti a 'noi' o 'MedMarket' in questa informativa riguardano la piattaforma MedMarket e i suoi gestori.",
      },
      {
        heading: "2. Dati che raccogliamo",
        body: "Raccogliamo le informazioni fornite durante la registrazione: nome, indirizzo email lavorativo e nome, città e paese del tuo ospedale. Raccogliamo anche i dati generati dall'utilizzo della piattaforma: annunci creati, ordini effettuati e messaggi inviati.",
      },
      {
        heading: "3. Come utilizziamo i tuoi dati",
        body: "I tuoi dati vengono utilizzati esclusivamente per gestire la piattaforma: mettere in contatto acquirenti e venditori, facilitare gli ordini e consentire la comunicazione tra farmacie ospedaliere. Non vendiamo i tuoi dati a terzi né li utilizziamo per scopi pubblicitari.",
      },
      {
        heading: "4. Condivisione dei dati",
        body: "Il nome, la città e il paese del tuo ospedale sono visibili agli altri utenti verificati quando pubblichi un annuncio. Il tuo nome e la tua email sono condivisi solo all'interno del tuo team ospedaliero e nelle conversazioni dirette che avvii.",
      },
      {
        heading: "5. Comunicazioni via email",
        body: "Inviamo email transazionali relative alla tua attività sulla piattaforma (conferme di ordini, notifiche di messaggi). Puoi disattivare le notifiche email per i messaggi nelle impostazioni del profilo. Le email transazionali sugli ordini non possono essere disattivate in quanto essenziali al servizio.",
      },
      {
        heading: "6. Conservazione dei dati",
        body: "Conserviamo i tuoi dati per tutto il tempo in cui il tuo account è attivo. Per richiedere la cancellazione del tuo account e dei dati associati, contattaci all'indirizzo privacy@medmarket.app.",
      },
      {
        heading: "7. Sicurezza",
        body: "Tutti i dati vengono trasmessi tramite HTTPS. Le password sono crittografate con bcrypt e non vengono mai memorizzate in chiaro. Applichiamo pratiche di sicurezza standard per proteggere le tue informazioni.",
      },
      {
        heading: "8. I tuoi diritti",
        body: "In base al GDPR, hai il diritto di accedere, correggere o cancellare i tuoi dati personali, e di opporti o limitarne il trattamento. Per esercitare questi diritti, contattaci all'indirizzo privacy@medmarket.app.",
      },
      {
        heading: "9. Contatti",
        body: "Per qualsiasi domanda sulla privacy, scrivici a privacy@medmarket.app.",
      },
    ],
  },
};

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const content = CONTENT[locale as "en" | "it"] ?? CONTENT.en;

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="mb-1 text-sm text-muted-foreground">{content.updated}</p>
        <h1 className="mb-10 text-3xl font-bold text-gray-900">{content.title}</h1>
        <div className="flex flex-col gap-8">
          {content.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">{s.heading}</h2>
              <p className="text-sm leading-relaxed text-gray-600">{s.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <Link href="/" className="text-brand-600 hover:underline">← Back to MedMarket</Link>
        </div>
      </main>
    </div>
  );
}
