import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: `${t("terms")} | MedMarket` };
}

const CONTENT = {
  en: {
    title: "Terms of Use",
    updated: "Last updated: March 2026",
    sections: [
      {
        heading: "1. Acceptance",
        body: "By accessing or using MedMarket, you agree to these Terms of Use. If you do not agree, do not use the platform. These terms apply to all registered users, including hospital administrators and staff.",
      },
      {
        heading: "2. Eligibility",
        body: "MedMarket is exclusively for verified hospital pharmacy professionals. You must be employed by a licensed hospital pharmacy and register with a valid work email address. Personal or commercial pharmacy accounts are not permitted.",
      },
      {
        heading: "3. Account responsibilities",
        body: "You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at support@medmarket.app if you suspect unauthorised access.",
      },
      {
        heading: "4. Listings and accuracy",
        body: "You are solely responsible for the accuracy of listings you create, including medicine name, ATC code, batch number, expiry date, quantity, and condition. Listings must only describe medicines that are legally available for transfer between hospital pharmacies under applicable regulations.",
      },
      {
        heading: "5. Orders and transactions",
        body: "MedMarket facilitates connections between hospitals. We are not a party to any transaction. The fulfilling hospital is responsible for the physical transfer of medicines and compliance with applicable pharmaceutical regulations. MedMarket does not guarantee the availability, quality, or legality of any listed medicine.",
      },
      {
        heading: "6. Prohibited conduct",
        body: "You may not use MedMarket to list controlled substances, counterfeit medicines, or products whose transfer is prohibited by law. You may not use the platform to harass, defraud, or mislead other users. Violation of these rules may result in immediate account termination.",
      },
      {
        heading: "7. Platform availability",
        body: "MedMarket is provided on an 'as is' basis. We do not guarantee uninterrupted availability. We may modify, suspend, or discontinue any part of the platform at any time without notice.",
      },
      {
        heading: "8. Intellectual property",
        body: "All platform content, design, and software are the property of MedMarket or its licensors. You may not copy, reproduce, or distribute any part of the platform without prior written permission.",
      },
      {
        heading: "9. Limitation of liability",
        body: "To the fullest extent permitted by law, MedMarket is not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including losses resulting from transactions arranged through the platform.",
      },
      {
        heading: "10. Governing law",
        body: "These terms are governed by the laws of Italy. Any disputes shall be subject to the exclusive jurisdiction of the courts of Milan, Italy.",
      },
      {
        heading: "11. Changes to these terms",
        body: "We may update these terms from time to time. Continued use of MedMarket after changes are posted constitutes acceptance of the revised terms. The date at the top of this page indicates when the terms were last updated.",
      },
      {
        heading: "12. Contact",
        body: "For questions about these terms, contact us at legal@medmarket.app.",
      },
    ],
  },
  it: {
    title: "Termini di Utilizzo",
    updated: "Ultimo aggiornamento: marzo 2026",
    sections: [
      {
        heading: "1. Accettazione",
        body: "Accedendo o utilizzando MedMarket, accetti i presenti Termini di Utilizzo. Se non sei d'accordo, non utilizzare la piattaforma. Questi termini si applicano a tutti gli utenti registrati, inclusi gli amministratori e il personale ospedaliero.",
      },
      {
        heading: "2. Requisiti di accesso",
        body: "MedMarket è riservato esclusivamente a professionisti verificati delle farmacie ospedaliere. È necessario essere dipendenti di una farmacia ospedaliera autorizzata e registrarsi con un indirizzo email lavorativo valido. Non sono ammessi account di farmacie personali o commerciali.",
      },
      {
        heading: "3. Responsabilità dell'account",
        body: "Sei responsabile della riservatezza delle tue credenziali di accesso e di tutte le attività che avvengono sul tuo account. Avvisaci immediatamente all'indirizzo support@medmarket.app se sospetti un accesso non autorizzato.",
      },
      {
        heading: "4. Annunci e accuratezza",
        body: "Sei il solo responsabile dell'accuratezza degli annunci che crei, inclusi nome del farmaco, codice ATC, numero di lotto, data di scadenza, quantità e condizione. Gli annunci devono descrivere solo farmaci legalmente disponibili per il trasferimento tra farmacie ospedaliere secondo la normativa vigente.",
      },
      {
        heading: "5. Ordini e transazioni",
        body: "MedMarket facilita le connessioni tra ospedali. Non siamo parte di alcuna transazione. L'ospedale fornitore è responsabile del trasferimento fisico dei farmaci e del rispetto delle normative farmaceutiche applicabili. MedMarket non garantisce la disponibilità, la qualità o la legalità dei farmaci pubblicati.",
      },
      {
        heading: "6. Condotta vietata",
        body: "Non puoi utilizzare MedMarket per pubblicare sostanze controllate, farmaci contraffatti o prodotti il cui trasferimento è vietato dalla legge. Non puoi usare la piattaforma per molestare, frodare o ingannare altri utenti. La violazione di queste regole può comportare la chiusura immediata dell'account.",
      },
      {
        heading: "7. Disponibilità della piattaforma",
        body: "MedMarket è fornito 'così com'è'. Non garantiamo la disponibilità ininterrotta. Possiamo modificare, sospendere o interrompere qualsiasi parte della piattaforma in qualsiasi momento senza preavviso.",
      },
      {
        heading: "8. Proprietà intellettuale",
        body: "Tutti i contenuti, il design e il software della piattaforma sono di proprietà di MedMarket o dei suoi licenzianti. Non puoi copiare, riprodurre o distribuire alcuna parte della piattaforma senza previa autorizzazione scritta.",
      },
      {
        heading: "9. Limitazione di responsabilità",
        body: "Nella misura massima consentita dalla legge, MedMarket non è responsabile per danni indiretti, incidentali o consequenziali derivanti dall'utilizzo della piattaforma, incluse le perdite risultanti da transazioni organizzate attraverso la piattaforma.",
      },
      {
        heading: "10. Legge applicabile",
        body: "I presenti termini sono disciplinati dalla legge italiana. Eventuali controversie saranno soggette alla giurisdizione esclusiva dei tribunali di Milano, Italia.",
      },
      {
        heading: "11. Modifiche ai termini",
        body: "Potremmo aggiornare questi termini di tanto in tanto. L'uso continuato di MedMarket dopo la pubblicazione delle modifiche costituisce accettazione dei termini aggiornati. La data in cima a questa pagina indica quando i termini sono stati aggiornati l'ultima volta.",
      },
      {
        heading: "12. Contatti",
        body: "Per domande su questi termini, contattaci all'indirizzo legal@medmarket.app.",
      },
    ],
  },
};

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
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
