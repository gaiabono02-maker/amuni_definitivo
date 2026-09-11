import { Link, createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import {
  Leaf,
  Mail,
  Phone,
  MapPin,
  Wine,
  Droplets,
  Citrus,
  Wheat,
  Nut,
  ArrowRight,
  Heart,
  Check,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CartProvider,
} from "@/components/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { BlogSection } from "@/components/BlogSection";
import { BottegaFeatures } from "@/components/BottegaFeatures";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { SicilyMap } from "@/components/SicilyMap";
import { SeasonalCalendar } from "@/components/SeasonalCalendar";
import { Testimonials } from "@/components/Testimonials";
import { imprese } from "@/data/network";
import { fetchAziende, type DbAzienda } from "@/lib/catalog";
import heroImg from "@/assets/hero-sicily.jpg";
import territorioImg from "@/assets/territorio.jpg";
import teamImg from "@/assets/team.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A.M.U.N.Ì. – Agricoltura Made in Sicily: Unione Network Imprese" },
      {
        name: "description",
        content:
          "A.M.U.N.Ì. è la rete delle imprese agricole siciliane promossa da Associazione Forma Mentis OdV. Connettere le imprese agricole siciliane per crescere insieme.",
      },
      { property: "og:title", content: "A.M.U.N.Ì. – Agricoltura Made in Sicily" },
      {
        property: "og:description",
        content: "Connettere le imprese agricole siciliane per crescere insieme.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: heroImg },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const progettoCards = [
  { emoji: "🤝", title: "Networking tra imprese", text: "Mettiamo in connessione le PMI agricole del territorio per costruire una rete solida e collaborativa." },
  { emoji: "🌾", title: "Valorizzazione del Made in Sicily", text: "Promuoviamo le eccellenze agroalimentari siciliane e la loro identità unica nel mondo." },
  { emoji: "📈", title: "Crescita e innovazione", text: "Sosteniamo lo sviluppo, la competitività e l'innovazione delle aziende aderenti." },
];

const prodotti = [
  { icon: Wine, label: "Vino" },
  { icon: Droplets, label: "Olio" },
  { icon: Citrus, label: "Agrumi" },
  { icon: Wheat, label: "Cereali" },
  { icon: Nut, label: "Mandorle" },
];

const steps = [
  { n: "1", title: "Compila il modulo", text: "Inserisci i dati della tua azienda agricola attraverso il form qui accanto." },
  { n: "2", title: "Vieni contattato", text: "Il nostro team ti ricontatta per conoscere la tua realtà e le tue esigenze." },
  { n: "3", title: "Entra nel network", text: "Diventi parte attiva della rete A.M.U.N.Ì. e accedi a nuove opportunità." },
];

type PianoSostenitore = {
  nome: string;
  descrizione: string;
  benefici: React.ReactNode[];
  evidenza?: boolean;
};

const pianiSostenitore: PianoSostenitore[] = [
  {
    nome: "Sostenitore",
    descrizione: "Il piano più scelto da chi crede nel progetto.",
    benefici: [
      "Newsletter esclusiva del network",
      "Inviti agli eventi della rete",
      "Nome nella pagina dei sostenitori",
      <span key="box">1 <strong>box degustazione di benvenuto</strong></span>,
      "Sconto 10% sulla Bottega",
      "Accesso anticipato ai nuovi prodotti",
    ],
    evidenza: true,
  },
  {
    nome: "Ambasciatore",
    descrizione: "Per partner e aziende che vogliono fare la differenza.",
    benefici: [
      "Tutti i vantaggi del piano Sostenitore",
      "Logo come partner ufficiale del network",
      "Visita guidata in azienda agricola",
      <span key="box-stag"><strong className="underline decoration-2 underline-offset-2">4 box stagionali</strong> di prodotti del territorio</span>,
    ],
  },
];

const iscrizioneSchema = z.object({
  nome: z.string().trim().min(1, "Inserisci il tuo nome").max(100),
  azienda: z.string().trim().min(1, "Inserisci il nome dell'azienda").max(150),
  settore: z.string().trim().max(100).optional(),
  provincia: z.string().trim().max(50).optional(),
  email: z.string().trim().email("Inserisci un'email valida").max(255),
  messaggio: z.string().trim().max(1000).optional(),
});

function Index() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aziende, setAziende] = useState<DbAzienda[]>([]);

  useEffect(() => {
    fetchAziende().then(setAziende).catch(() => setAziende([]));
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = iscrizioneSchema.safeParse({
      nome: fd.get("nome"),
      azienda: fd.get("azienda"),
      settore: fd.get("settore") || undefined,
      provincia: fd.get("provincia") || undefined,
      email: fd.get("email"),
      messaggio: fd.get("messaggio") || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("iscrizioni").insert(parsed.data);
    setLoading(false);

    if (error) {
      toast.error("Si è verificato un errore. Riprova più tardi.");
      return;
    }

    setSent(true);
    form.reset();
    toast.success("Candidatura inviata con successo!");
    setTimeout(() => setSent(false), 6000);
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <CartDrawer />

      {/* HERO */}
      <section id="hero" className="relative flex min-h-screen items-center">
        <img
          src={heroImg}
          alt="Campagna siciliana al tramonto con uliveti e campi di grano"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brown/85 via-brown/55 to-brown/25" />
        <div className="relative mx-auto w-full max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl py-32 text-cream">
            <p className="mb-5 inline-block rounded-full border border-cream/40 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
              Agricoltura Made in Sicily
            </p>
            <h1 className="text-5xl font-bold leading-none sm:text-7xl">A.M.U.N.Ì.</h1>
            <p className="mt-4 font-serif text-xl italic text-cream/90 sm:text-2xl">
              Agricoltura Made in Sicily: Unione Network Imprese
            </p>
            <p className="mt-6 max-w-xl text-lg text-cream/85">
              Connettere le imprese agricole siciliane per crescere insieme.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="#progetto">
                <Button size="lg" className="px-8 text-base">
                  Scopri il Progetto
                </Button>
              </a>
              <a href="#aderire">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cream/60 bg-transparent px-8 text-base text-cream hover:bg-cream hover:text-brown"
                >
                  Aderire al Network
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / CONTATORI */}
      <section className="bg-brown py-6 text-cream">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-4 px-5 text-center lg:px-8">
          {[
            { n: 12, suffix: "", label: "imprese aderenti" },
            { n: 80, suffix: "+", label: "prodotti disponibili" },
            { n: 6, suffix: "", label: "province coperte" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-serif text-3xl font-bold text-primary sm:text-4xl">
                <AnimatedCounter end={s.n} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-cream/70 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IL PROGETTO */}
      <section id="progetto" className="scroll-mt-16 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Il Progetto</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Una rete per l'agricoltura siciliana</h2>
              <div className="mt-4 h-1 w-16 rounded-full bg-primary" />
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                A.M.U.N.Ì. è un'iniziativa di networking dedicata alle piccole e medie imprese
                agricole siciliane, attiva da <strong className="text-foreground">marzo a giugno 2026</strong>{" "}
                nelle province di <strong className="text-foreground">Palermo e Agrigento</strong>.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Il progetto è finanziato dall'Avviso <em>"Sicilia che piace – Associazioni"</em> della
                Regione Siciliana, e nasce per fare squadra, valorizzare i prodotti del territorio e
                aprire nuove opportunità di collaborazione.
              </p>
            </Reveal>
            <Reveal delay={150}>
              <div className="grid grid-cols-2 gap-4">
                {prodotti.slice(0, 4).map((p) => (
                  <div key={p.label} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 shadow-sm">
                    <p.icon className="h-9 w-9 text-secondary" />
                    <span className="font-serif text-lg font-semibold">{p.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {progettoCards.map((c, i) => (
              <Reveal key={c.title} delay={i * 120}>
                <div className="h-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-transform hover:-translate-y-1">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
                    <span aria-hidden>{c.emoji}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{c.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* IL TERRITORIO */}
      <section id="territorio" className="relative scroll-mt-16 overflow-hidden py-28 lg:py-36">
        <img
          src={territorioImg}
          alt="Vigneti e agrumeti siciliani al tramonto vicino al mare"
          width={1920}
          height={1080}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-brown/80" />
        <div className="relative mx-auto max-w-5xl px-5 text-center text-cream lg:px-8">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-cream/70">Il Territorio</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Palermo e Agrigento, cuore agricolo della Sicilia</h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-cream/85">
              Tra colline assolate e terre baciate dal mare, le province di Palermo e Agrigento
              custodiscono un patrimonio agricolo straordinario: vino, olio, agrumi, cereali e
              mandorle che raccontano secoli di tradizione, sapienza contadina e identità.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {prodotti.map((p) => (
                <span key={p.label} className="inline-flex items-center gap-2 rounded-full border border-cream/30 bg-cream/10 px-4 py-2 text-sm font-medium backdrop-blur">
                  <p.icon className="h-4 w-4" /> {p.label}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="mx-auto mt-12 flex max-w-md justify-center gap-4">
              {["Palermo", "Agrigento"].map((prov) => (
                <div key={prov} className="flex-1 rounded-2xl border border-cream/25 bg-cream/10 p-6 backdrop-blur">
                  <MapPin className="mx-auto h-7 w-7 text-primary" />
                  <p className="mt-3 font-serif text-lg font-semibold">{prov}</p>
                  <p className="text-xs uppercase tracking-wider text-cream/60">Provincia</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={280}>
            <blockquote className="mx-auto mt-16 max-w-3xl font-serif text-3xl italic leading-snug sm:text-4xl">
              "La Sicilia non è solo un'isola. È un'identità."
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* MAPPA INTERATTIVA */}
      <section className="scroll-mt-16 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">La Rete sul Territorio</p>
            <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Esplora la mappa del network</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary" />
          </div>
          <Reveal>
            <SicilyMap />
          </Reveal>
        </div>
      </section>

      {/* LE IMPRESE */}
      <section id="imprese" className="scroll-mt-16 bg-muted/40 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Le Imprese del Network</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Le aziende che fanno rete</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(aziende.length > 0
              ? aziende.map((a) => ({
                  slug: a.slug,
                  nome: a.nome,
                  settore: a.settore,
                  provincia: a.provincia,
                  desc: a.descrizione,
                }))
              : imprese.map((a) => ({
                  slug: undefined as string | undefined,
                  nome: a.nome,
                  settore: a.settore,
                  provincia: a.provincia,
                  desc: a.desc,
                }))
            ).map((a, i) => (
              <Reveal key={a.slug ?? i} delay={(i % 3) * 120}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15">
                    <Leaf className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="mt-4 font-serif text-xl font-bold">{a.nome}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {a.settore && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{a.settore}</span>
                    )}
                    {a.provincia && (
                      <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">{a.provincia}</span>
                    )}
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
                  {a.slug ? (
                    <Link
                      to="/aziende/$slug"
                      params={{ slug: a.slug }}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5"
                    >
                      Scopri i prodotti <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <a href="#contatti" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5">
                      Contatta <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BottegaFeatures />
      <BlogSection />
      <SeasonalCalendar />
      <Testimonials />
      <SostenitoriSection />

      {/* COME ADERIRE */}
      <section id="aderire" className="scroll-mt-16 bg-primary py-20 text-primary-foreground lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/80">Aderire</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Come entrare nel network</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary-foreground/60" />
          </div>
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 120}>
                  <div className="flex items-start gap-5 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-6 backdrop-blur">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground font-serif text-xl font-bold text-primary">
                      {s.n}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-primary-foreground/85">{s.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={150}>
              <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-cream p-7 text-foreground shadow-lg">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome" id="nome"><Input id="nome" name="nome" required placeholder="Nome e cognome" /></Field>
                  <Field label="Azienda" id="azienda"><Input id="azienda" name="azienda" required placeholder="Nome azienda" /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Settore agricolo" id="settore"><Input id="settore" name="settore" placeholder="Es. viticoltura" /></Field>
                  <Field label="Provincia" id="provincia">
                    <select id="provincia" name="provincia" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" defaultValue="">
                      <option value="" disabled>Seleziona</option>
                      <option>Palermo</option>
                      <option>Agrigento</option>
                      <option>Altra</option>
                    </select>
                  </Field>
                </div>
                <Field label="Email" id="email"><Input id="email" name="email" type="email" required placeholder="latua@email.it" /></Field>
                <Field label="Messaggio" id="messaggio"><Textarea id="messaggio" name="messaggio" rows={4} placeholder="Raccontaci della tua azienda..." /></Field>
                <Button type="submit" size="lg" variant="secondary" className="w-full" disabled={loading}>
                  {loading ? "Invio in corso..." : "Invia la candidatura"}
                </Button>
                {sent && <p className="text-sm font-medium text-secondary">Grazie! La tua candidatura è stata inviata. Ti contatteremo presto.</p>}
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CHI SIAMO */}
      <section id="chi-siamo" className="scroll-mt-16 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-5 lg:px-8 text-center">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Chi Siamo</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Associazione Forma Mentis OdV</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary" />
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Con sede a <strong className="text-foreground">Favara (AG)</strong>, Associazione
              Forma Mentis OdV è iscritta al <strong className="text-foreground">R.U.N.T.S.</strong>{" "}
              nella sezione Organizzazioni di Volontariato.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Siamo la promotrice del progetto A.M.U.N.Ì., realizzato nell'ambito del bando
              regionale. Crediamo nel valore delle persone, delle comunità e del territorio:
              lavoriamo ogni giorno perché l'agricoltura siciliana possa crescere unita, forte
              della propria identità.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CONTATTI */}
      <section id="contatti" className="scroll-mt-16 bg-muted/40 py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Contatti</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Scrivici o vieni a trovarci</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary" />
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <a href="mailto:formamentisonlus@gmail.com" className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-transform hover:-translate-y-1">
              <Mail className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium break-all">formamentisonlus@gmail.com</span>
            </a>
            <a href="tel:+393932881785" className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-transform hover:-translate-y-1">
              <Phone className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium">+39 393 288 1785</span>
            </a>
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
              <MapPin className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium">Via Soldato Tragna snc, Favara (AG)</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-brown text-cream/80">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Leaf className="h-5 w-5" />
                </span>
                <span className="font-serif text-xl font-bold text-cream">A.M.U.N.Ì.</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed">
                Agricoltura Made in Sicily: Unione Network Imprese. Un progetto di Associazione
                Forma Mentis OdV.
              </p>
              <p className="mt-4 text-sm">C.F. 93075520846</p>
            </div>
            <nav className="flex flex-col gap-2.5 text-sm">
              <a href="#progetto" className="hover:text-primary">Il Progetto</a>
              <a href="#territorio" className="hover:text-primary">Il Territorio</a>
              <a href="#imprese" className="hover:text-primary">Le Imprese</a>
              <a href="#bottega" className="hover:text-primary">Bottega</a>
              <a href="#blog" className="hover:text-primary">Blog</a>
              <a href="#sostenitori" className="hover:text-primary">Sostieni</a>
              <a href="#aderire" className="hover:text-primary">Aderire</a>
              <a href="#chi-siamo" className="hover:text-primary">Chi Siamo</a>
              <a href="#contatti" className="hover:text-primary">Contatti</a>
            </nav>
          </div>
          <div className="mt-12 border-t border-cream/15 pt-6 text-xs leading-relaxed text-cream/60">
            <p>
              Progetto finanziato nell'ambito dell'Avviso "Sicilia che piace – Associazioni" – Es.
              fin. 2026, Assessorato Regionale Attività Produttive.
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} Associazione Forma Mentis OdV. Tutti i diritti riservati.
              {" · "}
              <a href="/admin/login" className="hover:text-primary">Area Riservata</a>
            </p>
          </div>
        </div>
      </footer>
      </div>
    </CartProvider>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function SostenitoriSection() {
  return (
    <section id="sostenitori" className="scroll-mt-16 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
            <Heart className="h-4 w-4" /> Diventa Sostenitore
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
            Sostieni l'agricoltura siciliana
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary" />
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Scegli il piano che fa per te e contribuisci alla crescita della rete di imprese
            agricole del territorio. Ogni contributo aiuta i nostri produttori.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl items-stretch gap-6 lg:grid-cols-2">
          {pianiSostenitore.map((p, i) => (
            <Reveal key={p.nome} delay={i * 120}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-8 shadow-sm transition-transform hover:-translate-y-1 ${
                  p.evidenza
                    ? "border-primary bg-primary text-primary-foreground shadow-lg"
                    : "border-border bg-card"
                }`}
              >
                {p.evidenza && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                    <Sparkles className="h-3.5 w-3.5" /> Più scelto
                  </span>
                )}
                <h3 className="font-serif text-2xl font-bold">{p.nome}</h3>
                <p className={`mt-3 text-sm leading-relaxed ${p.evidenza ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
                  {p.descrizione}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.benefici.map((b, bi) => (
                    <li key={bi} className="flex items-start gap-2.5 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.evidenza ? "text-primary-foreground" : "text-primary"}`} />
                      <span className={p.evidenza ? "text-primary-foreground/90" : "text-foreground"}>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  variant={p.evidenza ? "secondary" : "default"}
                  className="mt-8 w-full"
                  onClick={() =>
                    toast.info("I pagamenti saranno presto disponibili. Grazie per il tuo interesse!")
                  }
                >
                  Scegli {p.nome}
                </Button>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          I pagamenti online saranno attivati a breve. Per sostenerci subito,{" "}
          <a href="#contatti" className="font-semibold text-primary hover:underline">contattaci</a>.
        </p>
      </div>
    </section>
  );
}
