import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Leaf, MapPin, Search, HandHeart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Reveal } from "@/components/Reveal";

import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchProdottoDelMese,
  type DbProduct,
  type DbAzienda,
  type DbProdottoMese,
} from "@/lib/catalog";

import { fetchShowcaseProducts, fetchShowcaseCompanies, isDemoProduct } from "@/lib/showcase";

/* ---------------- RICHIESTA INTERESSE ---------------- */
const interesseSchema = z.object({
  nome_cliente: z.string().trim().min(1, "Inserisci il tuo nome").max(100),
  email_cliente: z.string().trim().email("Inserisci un'email valida").max(255),
  telefono_cliente: z.string().trim().max(40).optional(),
  messaggio: z.string().trim().max(1000).optional(),
});

function InteresseDialog({
  prodotto,
  slug,
  azienda,
  onClose,
}: {
  prodotto: DbProduct | null;
  slug: string;
  azienda?: DbAzienda;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prodotto) return;
    const fd = new FormData(e.currentTarget);
    const parsed = interesseSchema.safeParse({
      nome_cliente: fd.get("nome_cliente"),
      email_cliente: fd.get("email_cliente"),
      telefono_cliente: fd.get("telefono_cliente") || undefined,
      messaggio: fd.get("messaggio") || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("richieste_interesse").insert({
      azienda: prodotto.azienda,
      azienda_slug: slug,
      prodotto_id: prodotto.id,
      prodotto_nome: prodotto.nome,
      nome_cliente: parsed.data.nome_cliente,
      email_cliente: parsed.data.email_cliente,
      telefono_cliente: parsed.data.telefono_cliente ?? null,
      messaggio: parsed.data.messaggio ?? "",
    });
    setLoading(false);
    if (error) {
      toast.error("Si è verificato un errore. Riprova più tardi.");
      return;
    }
    toast.success("Richiesta inviata! L'impresa ti contatterà presto.");
    onClose();
  };

  return (
    <Dialog open={!!prodotto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contatta l'impresa</DialogTitle>
          <DialogDescription>
            {prodotto ? (
              <>
                Lascia i tuoi dati: <strong>{prodotto.azienda}</strong> ti
                contatterà per <strong>{prodotto.nome}</strong> e ti indicherà
                prezzo e disponibilità.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {azienda && (
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              to="/aziende/$slug"
              params={{ slug: azienda.slug }}
              className="rounded-full border border-border px-3 py-1 text-primary"
            >
              Pagina impresa
            </Link>
            {azienda.sito_web && (
              <a
                href={azienda.sito_web}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-3 py-1 text-primary"
              >
                Sito web
              </a>
            )}
            {azienda.instagram && (
              <a
                href={azienda.instagram}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-3 py-1 text-primary"
              >
                Instagram
              </a>
            )}
            {azienda.facebook && (
              <a
                href={azienda.facebook}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-3 py-1 text-primary"
              >
                Facebook
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="nome_cliente" required placeholder="Nome e cognome" />
          <Input
            name="email_cliente"
            type="email"
            required
            placeholder="latua@email.it"
          />
          <Input name="telefono_cliente" placeholder="Telefono (opzionale)" />
          <Textarea
            name="messaggio"
            rows={3}
            placeholder="Quantità desiderata, domande..."
          />
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Invio in corso..." : "Invia richiesta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- PEZZI RIUSABILI ---------------- */
function Foto({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden bg-gradient-to-br from-primary/15 via-cream to-secondary/15 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Leaf className="h-12 w-12 text-primary/40" />
        </div>
      )}
    </div>
  );
}

function ImpresaLink({
  nome,
  slug,
  className = "",
}: {
  nome: string;
  slug?: string;
  className?: string;
}) {
  if (!slug)
    return <span className={`font-medium ${className}`}>di {nome}</span>;
  return (
    <Link
      to="/aziende/$slug"
      params={{ slug }}
      className={`font-medium underline-offset-4 transition-colors hover:underline ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      di {nome}
    </Link>
  );
}

function Territorio({ p }: { p: DbProduct }) {
  if (!p.provincia) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <MapPin className="h-3 w-3" /> {p.provincia}
    </span>
  );
}

function Prezzo({ p }: { p: DbProduct }) {
  if (p.prezzo == null || !Number.isFinite(Number(p.prezzo)) || Number(p.prezzo) <= 0) return null;
  return <p className="mt-4 text-sm text-muted-foreground">{new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(p.prezzo))}</p>;
}

function ProdottoCard({ p, slug, onInteresse, grande = false }: {
  p: DbProduct;
  slug?: string;
  onInteresse: (p: DbProduct) => void;
  grande?: boolean;
}) {
  return (
    <article className="group flex h-full flex-col">
      <button type="button" onClick={() => onInteresse(p)} aria-label={`Scopri ${p.nome}`} className="block w-full overflow-hidden rounded-2xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4">
        <Foto src={p.immagine_url} alt={p.nome} className={grande ? "aspect-[16/10]" : "aspect-[4/3]"} />
      </button>
      <div className="flex flex-1 flex-col py-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{p.categoria}</span>
        <h3 className="mt-2 font-serif text-2xl leading-tight"><button type="button" onClick={() => onInteresse(p)} className="text-left hover:text-primary">{p.nome}</button></h3>
        <ImpresaLink nome={p.azienda} slug={slug} className="mt-2 text-base text-secondary" />
        <div className="mt-2"><Territorio p={p} /></div>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{p.descrizione}</p>
        <Prezzo p={p} />
        <button type="button" onClick={() => onInteresse(p)} className="mt-5 inline-flex w-fit items-center gap-2 border-b border-primary/30 pb-1 text-sm font-medium text-primary transition-colors hover:border-primary">
          Scopri <ArrowRight className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

function DettaglioProdotto({ prodotto, azienda, onClose, onInteresse }: {
  prodotto: DbProduct | null;
  azienda?: DbAzienda;
  onClose: () => void;
  onInteresse: (p: DbProduct) => void;
}) {
  return (
    <Dialog open={!!prodotto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        {prodotto && <>
          <DialogHeader>
            <p className="text-xs uppercase tracking-widest brand-label">{prodotto.categoria} · Contenuti dimostrativi</p>
            <DialogTitle className="font-serif text-3xl">{prodotto.nome}</DialogTitle>
            <DialogDescription>Scopri il prodotto e conosci l’impresa che lo realizza.</DialogDescription>
          </DialogHeader>
          <Foto src={prodotto.immagine_url} alt={prodotto.nome} className="aspect-[16/10] rounded-xl" />
          <ImpresaLink nome={prodotto.azienda} slug={azienda?.slug} className="text-lg text-secondary" />
          <Territorio p={prodotto} />
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{prodotto.descrizione}</p>
          <Prezzo p={prodotto} />
          {isDemoProduct(prodotto) ? <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Prodotto e impresa dimostrativi · fotografia illustrativa. Puoi inviare una richiesta alla piattaforma tramite il modulo qui sotto.</p>
            <Button asChild><a href="#richiesta-prodotto" onClick={onClose}>Invia una richiesta</a></Button>
          </div> : <Button onClick={() => onInteresse(prodotto)} className="gap-2"><HandHeart className="h-4 w-4" /> Sono interessato</Button>}
        </>}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- RICHIESTA PRODOTTO ---------------- */
const richiestaSchema = z.object({
  nome_prodotto: z.string().trim().min(1, "Indica il prodotto").max(150),
  categoria: z.string().trim().max(80).optional(),
  email: z.string().trim().email("Inserisci un'email valida").max(255),
  note: z.string().trim().max(800).optional(),
});

function RichiestaProdotto() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = richiestaSchema.safeParse({
      nome_prodotto: fd.get("nome_prodotto"),
      categoria: fd.get("categoria") || undefined,
      email: fd.get("email"),
      note: fd.get("note") || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("richieste_prodotti").insert({
      nome_prodotto: parsed.data.nome_prodotto,
      categoria: parsed.data.categoria || "Altro",
      email: parsed.data.email,
      note: parsed.data.note || "",
    });
    setLoading(false);
    if (error) {
      toast.error("Si è verificato un errore. Riprova più tardi.");
      return;
    }
    form.reset();
    toast.success("Richiesta inviata! Ti metteremo in contatto con la rete.");
  };

  return (
    <div id="richiesta-prodotto" className="scroll-mt-24 mt-20 rounded-2xl border border-border bg-muted/40 p-8 lg:p-10">
      <div className="mx-auto max-w-2xl text-center">
        <h3 className="font-serif text-2xl font-bold">
          Cerchi qualcosa di particolare?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Raccontaci cosa stai cercando. A.M.U.N.Ì. ti aiuta a entrare in
          contatto con le imprese della rete.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-2xl space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="nome_prodotto" required placeholder="Prodotto cercato" />
          <Input name="categoria" placeholder="Categoria (es. Conserve)" />
        </div>
        <Input name="email" type="email" required placeholder="La tua email" />
        <Textarea name="note" rows={3} placeholder="Note (facoltative)" />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Invio in corso..." : "Invia una richiesta"}
        </Button>
      </form>
    </div>
  );
}

/* ---------------- SEZIONE BOTTEGA ---------------- */
export function BottegaFeatures() {
  const [prodotti, setProdotti] = useState<DbProduct[]>([]);
  const [aziende, setAziende] = useState<DbAzienda[]>([]);
  const [pdm, setPdm] = useState<DbProdottoMese | null>(null);
  const [loading, setLoading] = useState(true);
  const [dettaglio, setDettaglio] = useState<DbProduct | null>(null);
  const [selected, setSelected] = useState<DbProduct | null>(null);

  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Tutti");
  const [impresa, setImpresa] = useState("Tutte");
  const [territorio, setTerritorio] = useState("Tutti");

  useEffect(() => {
    let active = true;
    Promise.all([fetchShowcaseProducts(), fetchShowcaseCompanies(), fetchProdottoDelMese()])
      .then(([p, a, m]) => {
        if (!active) return;
        setProdotti(p);
        setAziende(a);
        setPdm(m);
      })
      .catch(() => toast.error("Errore nel caricamento della Bottega."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const slugOf = useMemo(() => {
    const map = new Map<string, string>();
    aziende.forEach((a) => map.set(a.nome, a.slug));
    return (nome: string) => map.get(nome);
  }, [aziende]);

  const aziendaOf = useMemo(() => {
    const map = new Map<string, DbAzienda>();
    aziende.forEach((a) => map.set(a.nome, a));
    return (nome: string) => map.get(nome);
  }, [aziende]);

  const categorie = useMemo(
    () => ["Tutti", ...Array.from(new Set(prodotti.map((p) => p.categoria).filter(Boolean)))],
    [prodotti],
  );
  const imprese = useMemo(
    () => ["Tutte", ...Array.from(new Set(prodotti.map((p) => p.azienda).filter(Boolean)))],
    [prodotti],
  );
  const territori = useMemo(
    () => ["Tutti", ...Array.from(new Set(prodotti.map((p) => p.provincia).filter(Boolean)))],
    [prodotti],
  );

  const inEvidenza = prodotti.find((p) => p.id === pdm?.prodotto_id) ?? prodotti[0] ?? null;
  const vetrina = prodotti.filter((p) => p.id !== inEvidenza?.id).slice(0, 2);

  const visibili = prodotti.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      p.nome.toLowerCase().includes(q) ||
      p.azienda.toLowerCase().includes(q) ||
      (p.descrizione ?? "").toLowerCase().includes(q);
    return (
      matchQ &&
      (categoria === "Tutti" || p.categoria === categoria) &&
      (impresa === "Tutte" || p.azienda === impresa) &&
      (territorio === "Tutti" || p.provincia === territorio)
    );
  });

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
    }`;

  return (
    <section id="bottega" className="scroll-mt-16 bg-cream/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest brand-label">
            La Bottega
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
            Le eccellenze della rete
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Scopri prodotti, sapori e storie delle imprese A.M.U.N.Ì.
          </p>
          <p className="mx-auto mt-4 inline-block rounded-full border border-border bg-muted/50 px-4 py-1 text-xs uppercase tracking-wider text-muted-foreground">
            Anteprima della piattaforma · contenuti dimostrativi
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Caricamento…</p>
        ) : (
          <>
            {/* Vetrina editoriale */}
            {inEvidenza && (
              <div className={`grid items-start gap-10 lg:gap-16 ${vetrina.length ? "lg:grid-cols-2" : "mx-auto max-w-3xl"}`}>
                <Reveal className="lg:sticky lg:top-24">
                  <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-500 hover:shadow-xl">
                    <button type="button" onClick={() => setDettaglio(inEvidenza)} aria-label={`Scopri ${inEvidenza.nome}`} className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                      <Foto src={inEvidenza.immagine_url} alt={inEvidenza.nome} className="aspect-[4/5] sm:aspect-square lg:aspect-[4/5]" />
                    </button>
                    <div className="flex flex-1 flex-col p-6 sm:p-8 lg:p-10">
                      <span className="inline-flex w-fit rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
                        In evidenza · {inEvidenza.categoria}
                      </span>
                      <h3 className="mt-4 font-serif text-3xl font-bold leading-tight sm:text-4xl">
                        <button type="button" onClick={() => setDettaglio(inEvidenza)} className="text-left hover:text-primary">{inEvidenza.nome}</button>
                      </h3>
                      <ImpresaLink
                        nome={inEvidenza.azienda}
                        slug={slugOf(inEvidenza.azienda)}
                        className="mt-2 text-secondary"
                      />
                      <div className="mt-2">
                        <Territorio p={inEvidenza} />
                      </div>
                      <p className="mt-4 flex-1 leading-relaxed text-muted-foreground">
                        {(pdm?.prodotto_id === inEvidenza.id && pdm.produttore_storia) || inEvidenza.descrizione}
                      </p>
                      <Prezzo p={inEvidenza} />
                      <Button
                        size="lg"
                        className="mt-3 w-full gap-1.5 sm:w-fit"
                        onClick={() => setDettaglio(inEvidenza)}
                      >
                        Scopri <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>

                  </article>
                </Reveal>

                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-1">
                  {vetrina.map((p, i) => (
                    <Reveal key={p.id} delay={(i % 2) * 120}>
                      <ProdottoCard
                        p={p}
                        grande
                        slug={slugOf(p.azienda)}
                        onInteresse={setDettaglio}
                      />
                    </Reveal>
                  ))}
                </div>
              </div>
            )}

            {/* Esplora */}
            <div className="mt-24">
              <div className="mb-8 text-center">
                <h3 className="font-serif text-2xl font-bold sm:text-3xl">
                  Esplora i prodotti
                </h3>
              </div>

              <div className="sticky top-16 z-20 -mx-5 mb-8 border-y border-border bg-background/95 px-5 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                <div className="mx-auto max-w-xl">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Cerca un prodotto…"
                      className="h-12 pl-9 text-base"
                      aria-label="Cerca un prodotto"
                    />
                  </div>
                </div>

                <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:mt-6 lg:flex-wrap lg:justify-center lg:gap-3 lg:overflow-visible lg:px-0">
                  {categorie.map((c) => (
                    <button
                      key={c}
                      aria-pressed={categoria === c}
                      onClick={() => setCategoria(c)}
                      className={`${pill(categoria === c)} shrink-0 whitespace-nowrap`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {(imprese.length > 2 || territori.length > 2) && (
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:mt-6 lg:flex lg:justify-center lg:gap-4">
                    {imprese.length > 2 && (
                      <label className="flex min-w-0 items-center gap-2 text-muted-foreground">
                        <span className="shrink-0">Impresa</span>
                        <select
                          value={impresa}
                          onChange={(e) => setImpresa(e.target.value)}
                          className="h-10 w-full min-w-0 rounded-md border border-border bg-card px-3 text-foreground lg:w-auto"
                        >
                          {imprese.map((i) => (
                            <option key={i}>{i}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    {territori.length > 2 && (
                      <label className="flex min-w-0 items-center gap-2 text-muted-foreground">
                        <span className="shrink-0">Territorio</span>
                        <select
                          value={territorio}
                          onChange={(e) => setTerritorio(e.target.value)}
                          className="h-10 w-full min-w-0 rounded-md border border-border bg-card px-3 text-foreground lg:w-auto"
                        >
                          {territori.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
              </div>


              {visibili.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  {prodotti.length ? "Nessun prodotto corrisponde alla ricerca. Prova a cambiare i filtri." : "La vetrina si sta preparando: presto potrai esplorare qui le produzioni del territorio."}
                </p>
              ) : (
                <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                  {visibili.map((p, i) => (
                    <Reveal key={p.id} delay={(i % 3) * 100}>
                      <ProdottoCard
                        p={p}
                        slug={slugOf(p.azienda)}
                        onInteresse={setDettaglio}
                      />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <RichiestaProdotto />
      </div>

      <DettaglioProdotto
        prodotto={dettaglio}
        azienda={dettaglio ? aziendaOf(dettaglio.azienda) : undefined}
        onClose={() => setDettaglio(null)}
        onInteresse={(p) => { setDettaglio(null); setSelected(p); }}
      />
      <InteresseDialog
        prodotto={selected}
        slug={selected ? (slugOf(selected.azienda) ?? "") : ""}
        azienda={selected ? aziendaOf(selected.azienda) : undefined}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
