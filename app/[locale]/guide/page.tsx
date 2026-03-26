import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "@/i18n/navigation";
import {
  ShoppingBag, Search, PlusCircle, ShoppingCart, MessageSquare,
  Building2, CheckCircle, Users, Bell, Filter, Clock, ArrowRight,
} from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: `${t("guide")} | MedMarket` };
}

const CONTENT = {
  en: {
    title: "User Guide",
    subtitle: "Everything you need to know to get the most out of MedMarket.",
    roles: [
      { icon: "buyer",  heading: "Buyers",          body: "Browse verified listings, filter by expiry or distance, and place orders directly with the selling hospital." },
      { icon: "seller", heading: "Sellers",          body: "List surplus or near-expiry medicines in minutes. Manage your inventory and fulfil incoming orders." },
      { icon: "admin",  heading: "Hospital Admins",  body: "Invite your pharmacy team, manage your hospital profile, and oversee all listings and orders for your hospital." },
      { icon: "verify", heading: "Getting verified", body: "All hospitals are manually verified before they can list or buy. Verification typically takes 1–2 business days." },
    ],
    sections: [
      {
        id: "getting-started",
        heading: "1. Getting started",
        icon: "start",
        steps: [
          { title: "Register your hospital", body: "Go to Register and fill in your name, work email, and your hospital details (name, address, city). One account per hospital is created as Hospital Admin — staff join later via invitation." },
          { title: "Wait for verification", body: "A MedMarket platform admin will review your hospital details and verify your account, usually within 1–2 business days. You will be able to log in immediately but cannot list or order until verified." },
          { title: "Explore while you wait", body: "You can browse the marketplace and read listings straight away. Use this time to explore what other hospitals have available in your area." },
        ],
      },
      {
        id: "buying",
        heading: "2. Browsing & buying",
        icon: "buy",
        steps: [
          { title: "Search and filter", body: "Use the search bar to find medicines by name, generic name, or ATC code. Narrow results by expiry window (next 7 / 30 / 90 days) and by distance from your hospital (50 – 500 km)." },
          { title: "Review a listing", body: "Click any listing to see full details: ATC code, batch number, condition (sealed or opened), exact expiry date, price per unit, and the selling hospital name, city, and country." },
          { title: "Contact the seller first (optional)", body: "If you want to negotiate, ask a question, or arrange an exchange instead of a purchase, use the 'Contact seller' button to open a direct chat thread tied to that listing." },
          { title: "Place an order", body: "Enter the quantity you need and submit the order form. The seller receives an email notification and must confirm the order. You can track status in My Orders." },
          { title: "Track your order", body: "Orders move through: Pending → Confirmed → Shipped → Delivered. You can view all your orders and their current status in the My Orders page." },
        ],
      },
      {
        id: "selling",
        heading: "3. Listing & selling",
        icon: "sell",
        steps: [
          { title: "Create a listing", body: "Click New Listing in the top navigation. Fill in the medicine name, ATC code, batch number, expiry date, quantity, unit price, and condition. Your listing goes live immediately for all verified hospitals to see." },
          { title: "Manage your listings", body: "Go to My Listings to see all your active and past listings. Active listings can be archived or edited at any time. Listings past their expiry date are automatically marked as Expired." },
          { title: "Receive and handle orders", body: "When a buyer places an order you receive an email. In My Listings, open the listing to see incoming orders. You can Confirm, Reject, mark as Shipped, or mark as Delivered from there." },
          { title: "Pricing", body: "You set the price per unit in EUR. Prices are publicly visible to all verified users. Negotiation and exchange arrangements happen via the in-platform chat before an order is placed." },
        ],
      },
      {
        id: "messaging",
        heading: "4. Messaging",
        icon: "chat",
        steps: [
          { title: "Contact a seller", body: "On any listing detail page, click 'Contact seller'. This opens a private chat thread linked to that specific listing. The seller sees your message and hospital name." },
          { title: "Your inbox", body: "Go to Messages (in your account menu) to see all your conversations. Switch between 'By Listing' to see one thread per medicine, or 'By Contact' to see all threads grouped by hospital." },
          { title: "Unread indicator", body: "A red badge on the Messages link shows how many conversations have unread messages. The dot indicator on each conversation also highlights which threads have new activity." },
          { title: "Email notifications", body: "By default you receive an email when you get a new message. You can turn this off in Profile → Notification settings without affecting other platform notifications." },
        ],
      },
      {
        id: "team",
        heading: "5. Managing your hospital team",
        icon: "team",
        note: "This section is for Hospital Admins only.",
        steps: [
          { title: "Invite staff", body: "Go to My Hospital (in your account menu). Enter a colleague's work email and send an invitation. They receive a link to complete registration — they join your hospital automatically without creating a duplicate account." },
          { title: "Staff accounts", body: "Invited staff are created as Hospital Staff. They can browse, list, and order on behalf of your hospital. Only Hospital Admins can invite new members." },
          { title: "View your team", body: "My Hospital shows all current team members with their name, email, and role. Invitation history (pending, accepted, expired) is also shown." },
        ],
      },
    ],
    tips: {
      heading: "Tips for best results",
      items: [
        "List medicines as soon as you know they will be surplus — more lead time means better chances of finding a buyer.",
        "Use ATC codes when searching: they are more precise than brand names and return consistent results across countries.",
        "Set a fair price. Listings priced near cost recover value quickly and build trust with repeat buyers.",
        "Use the distance filter when urgency is high — nearby hospitals can arrange collection faster.",
        "Turn on email notifications for messages so you can respond quickly and close deals before others.",
      ],
    },
    backLink: "← Back to MedMarket",
  },
  it: {
    title: "Guida all'uso",
    subtitle: "Tutto quello che devi sapere per usare al meglio MedMarket.",
    roles: [
      { icon: "buyer",  heading: "Acquirenti",          body: "Sfoglia gli annunci verificati, filtra per scadenza o distanza, e inserisci ordini direttamente con l'ospedale venditore." },
      { icon: "seller", heading: "Venditori",            body: "Pubblica farmaci in eccesso o prossimi alla scadenza in pochi minuti. Gestisci il tuo inventario e gestisci gli ordini in arrivo." },
      { icon: "admin",  heading: "Amministratori",       body: "Invita il tuo team di farmacia, gestisci il profilo ospedaliero e supervisiona tutti gli annunci e gli ordini del tuo ospedale." },
      { icon: "verify", heading: "Verifica dell'account",body: "Tutti gli ospedali vengono verificati manualmente prima di poter pubblicare o acquistare. La verifica richiede solitamente 1–2 giorni lavorativi." },
    ],
    sections: [
      {
        id: "getting-started",
        heading: "1. Per iniziare",
        icon: "start",
        steps: [
          { title: "Registra il tuo ospedale", body: "Vai su Registrati e inserisci nome, email lavorativa e i dati del tuo ospedale (nome, indirizzo, città). Un account per ospedale viene creato come Amministratore — il personale si unisce successivamente tramite invito." },
          { title: "Attendi la verifica", body: "Un amministratore della piattaforma MedMarket esaminerà i tuoi dati e verificherà il tuo account, di solito entro 1–2 giorni lavorativi. Puoi accedere immediatamente ma non puoi pubblicare o ordinare finché non sei verificato." },
          { title: "Esplora nel frattempo", body: "Puoi sfogliare il marketplace e leggere gli annunci subito. Usa questo tempo per scoprire cosa hanno disponibile gli altri ospedali nella tua area." },
        ],
      },
      {
        id: "buying",
        heading: "2. Navigare e acquistare",
        icon: "buy",
        steps: [
          { title: "Cerca e filtra", body: "Usa la barra di ricerca per trovare farmaci per nome, nome generico o codice ATC. Restringi i risultati per finestra di scadenza (prossimi 7 / 30 / 90 giorni) e per distanza dal tuo ospedale (50 – 500 km)." },
          { title: "Esamina un annuncio", body: "Clicca su qualsiasi annuncio per vedere tutti i dettagli: codice ATC, numero di lotto, condizione (sigillato o aperto), data di scadenza esatta, prezzo per unità e nome, città e paese dell'ospedale venditore." },
          { title: "Contatta prima il venditore (opzionale)", body: "Se vuoi negoziare, fare una domanda, o organizzare uno scambio invece di un acquisto, usa il pulsante 'Contatta il venditore' per aprire una chat privata legata a quell'annuncio." },
          { title: "Inserisci un ordine", body: "Inserisci la quantità necessaria e invia il modulo d'ordine. Il venditore riceve una notifica email e deve confermare l'ordine. Puoi seguire lo stato in I miei ordini." },
          { title: "Monitora il tuo ordine", body: "Gli ordini passano attraverso: In attesa → Confermato → Spedito → Consegnato. Puoi vedere tutti i tuoi ordini e il loro stato attuale nella pagina I miei ordini." },
        ],
      },
      {
        id: "selling",
        heading: "3. Pubblicare e vendere",
        icon: "sell",
        steps: [
          { title: "Crea un annuncio", body: "Clicca su Nuovo Annuncio nella navigazione in alto. Inserisci nome del farmaco, codice ATC, numero di lotto, data di scadenza, quantità, prezzo per unità e condizione. Il tuo annuncio è immediatamente visibile a tutti gli ospedali verificati." },
          { title: "Gestisci i tuoi annunci", body: "Vai a I miei annunci per vedere tutti i tuoi annunci attivi e passati. Gli annunci attivi possono essere archiviati o modificati in qualsiasi momento. Gli annunci oltre la data di scadenza vengono automaticamente contrassegnati come Scaduti." },
          { title: "Ricevi e gestisci gli ordini", body: "Quando un acquirente inserisce un ordine ricevi un'email. In I miei annunci, apri l'annuncio per vedere gli ordini in arrivo. Da lì puoi Confermare, Rifiutare, contrassegnare come Spedito o come Consegnato." },
          { title: "Prezzi", body: "Imposti il prezzo per unità in EUR. I prezzi sono visibili pubblicamente a tutti gli utenti verificati. La negoziazione e gli accordi di scambio avvengono tramite la chat in piattaforma prima che venga inserito un ordine." },
        ],
      },
      {
        id: "messaging",
        heading: "4. Messaggistica",
        icon: "chat",
        steps: [
          { title: "Contatta un venditore", body: "Su qualsiasi pagina di dettaglio di un annuncio, clicca 'Contatta il venditore'. Si apre un thread di chat privata legato a quello specifico farmaco. Il venditore vede il tuo messaggio e il nome del tuo ospedale." },
          { title: "La tua casella messaggi", body: "Vai a Messaggi (nel menu del tuo account) per vedere tutte le tue conversazioni. Passa tra 'Per Annuncio' per vedere un thread per farmaco, o 'Per Contatto' per vedere tutti i thread raggruppati per ospedale." },
          { title: "Indicatore messaggi non letti", body: "Un badge rosso sul link Messaggi mostra quante conversazioni hanno messaggi non letti. L'indicatore su ogni conversazione evidenzia anche quali thread hanno nuova attività." },
          { title: "Notifiche email", body: "Per impostazione predefinita ricevi un'email quando ricevi un nuovo messaggio. Puoi disattivarlo in Profilo → Impostazioni notifiche senza influire su altre notifiche della piattaforma." },
        ],
      },
      {
        id: "team",
        heading: "5. Gestire il team ospedaliero",
        icon: "team",
        note: "Questa sezione è solo per gli Amministratori Ospedalieri.",
        steps: [
          { title: "Invita il personale", body: "Vai a Il mio ospedale (nel menu del tuo account). Inserisci l'email lavorativa di un collega e invia un invito. Ricevono un link per completare la registrazione — si uniscono automaticamente al tuo ospedale senza creare un account duplicato." },
          { title: "Account del personale", body: "Il personale invitato viene creato come Staff Ospedaliero. Può sfogliare, pubblicare e ordinare per conto del tuo ospedale. Solo gli Amministratori Ospedalieri possono invitare nuovi membri." },
          { title: "Visualizza il tuo team", body: "Il mio ospedale mostra tutti i membri attuali del team con nome, email e ruolo. Viene mostrata anche la cronologia degli inviti (in attesa, accettati, scaduti)." },
        ],
      },
    ],
    tips: {
      heading: "Consigli per i migliori risultati",
      items: [
        "Pubblica i farmaci non appena sai che saranno in eccesso — più tempo a disposizione significa maggiori possibilità di trovare un acquirente.",
        "Usa i codici ATC quando cerchi: sono più precisi dei nomi commerciali e restituiscono risultati coerenti tra paesi.",
        "Imposta un prezzo equo. Gli annunci a prezzo vicino al costo recuperano valore rapidamente e creano fiducia con gli acquirenti abituali.",
        "Usa il filtro distanza quando l'urgenza è alta — gli ospedali vicini possono organizzare il ritiro più velocemente.",
        "Attiva le notifiche email per i messaggi così puoi rispondere rapidamente e concludere gli accordi prima degli altri.",
      ],
    },
    backLink: "← Torna a MedMarket",
  },
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  buyer:  <ShoppingCart className="h-5 w-5 text-brand-600" />,
  seller: <PlusCircle className="h-5 w-5 text-brand-600" />,
  admin:  <Building2 className="h-5 w-5 text-brand-600" />,
  verify: <CheckCircle className="h-5 w-5 text-brand-600" />,
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  start: <ShoppingBag className="h-5 w-5 text-white" />,
  buy:   <Search className="h-5 w-5 text-white" />,
  sell:  <PlusCircle className="h-5 w-5 text-white" />,
  chat:  <MessageSquare className="h-5 w-5 text-white" />,
  team:  <Users className="h-5 w-5 text-white" />,
};

const SECTION_COLORS: Record<string, string> = {
  start: "bg-brand-600",
  buy:   "bg-blue-600",
  sell:  "bg-accent-600",
  chat:  "bg-purple-600",
  team:  "bg-amber-600",
};

export default async function GuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const content = CONTENT[locale as "en" | "it"] ?? CONTENT.en;

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">

        {/* Header */}
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{content.title}</h1>
        <p className="mb-10 text-sm text-muted-foreground">{content.subtitle}</p>

        {/* Role overview cards */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {content.roles.map((r) => (
            <div key={r.icon} className="rounded-xl border border-border bg-white p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                {ROLE_ICONS[r.icon]}
              </div>
              <p className="mb-1 font-semibold text-gray-900">{r.heading}</p>
              <p className="text-sm leading-relaxed text-gray-600">{r.body}</p>
            </div>
          ))}
        </div>

        {/* Table of contents */}
        <nav className="mb-12 rounded-xl border border-border bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contents</p>
          <ul className="flex flex-col gap-2">
            {content.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm text-brand-600 hover:underline"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  {s.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Step-by-step sections */}
        <div className="flex flex-col gap-12">
          {content.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <div className="mb-6 flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${SECTION_COLORS[section.icon]}`}>
                  {SECTION_ICONS[section.icon]}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{section.heading}</h2>
              </div>
              {"note" in section && section.note && (
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                  <Bell className="h-4 w-4 shrink-0" />
                  {section.note}
                </div>
              )}
              <div className="flex flex-col gap-4">
                {section.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-12 rounded-xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-gray-900">{content.tips.heading}</h2>
          </div>
          <ul className="flex flex-col gap-3">
            {content.tips.items.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <p className="text-sm leading-relaxed text-gray-600">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Questions CTA */}
        <div className="mt-8 rounded-xl border border-border bg-white p-6 text-center">
          <p className="text-sm text-gray-600">
            {"Still have questions? "}
            <Link href="/contact" className="font-medium text-brand-600 hover:underline">Contact us</Link>
            {" — we're happy to help."}
          </p>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          <Link href="/" className="text-brand-600 hover:underline">{content.backLink}</Link>
        </div>
      </main>
    </div>
  );
}
