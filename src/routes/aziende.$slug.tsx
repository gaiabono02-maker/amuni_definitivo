import { fetchShowcaseCompany, fetchShowcaseCompanyProducts, isDemoCompany, isDemoProduct } from "@/lib/showcase";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  Leaf,
  MapPin,
  ArrowLeft,
  Globe,
  Instagram,
  Facebook,
  Lock,
  HandHeart,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Reveal } from "@/components/Reveal";
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
import { CartProvider } from "@/components/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { formatPrice } from "@/components/CartContext";
import { supabase } from "@/integrations/supabase/client";
import {
  type DbAzienda,
  type DbProduct,
} from "@/lib/catalog";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/aziende/$slug")({
  head: () => ({
    meta: [
      { title: "Azienda – A.M.U.N.Ì." },
      {
        name: "description",
        content:
          "Scopri i prodotti dell'azienda agricola siciliana e richiedi di essere contattato.",
      },
    ],
  }),
  component: AziendaPage,
});

const interesseSchema = z.object({
  nome_cliente: z.string().trim().min(1, "Inserisci il tuo nome").max(100),
  email_cliente: z.string().trim().email("Inserisci un'email valida").max(255),
  telefono_cliente: z.string().trim().max(40).optional(),
  messaggio: z.string().trim().max(1000).optional(),
});

function AziendaPage() {
  const { slug } = Route.useParams();
  const [azienda, setAzienda] = useState<DbAzienda | null>(null);
  const [prodotti, setProdotti] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<DbProduct | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setAzienda(null);
    setProdotti([]);
    setSelected(null);
    (async () => {
      try {
        const a = await fetchShowcaseCompany(slug);
        if (!active) return;
        if (!a) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setAzienda(a);
        const p = await fetchShowcaseCompanyProducts(a);
        if (!active) return;
        setProdotti(p);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <CartDrawer />

        <section className="bg-brown pb-12 pt-28 text-cream">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-cream/70 transition-colors hover:text-cream"
            >
              <ArrowLeft className="h-4 w-4" /> Torna alla home
            </Link>

            {loading ? (
              <div className="mt-10 flex items-center gap-3 text-cream/80">
                <Loader2 className="h-5 w-5 animate-spin" /> Caricamento azienda…
              </div>
            ) : notFound || !azienda ? (
              <div className="mt-10">
                <h1 className="font-serif text-3xl font-bold">Azienda non trovata</h1>
                <p className="mt-2 text-cream/80">
                  L'azienda che cerchi non è disponibile.
                </p>
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream/15">
                    {azienda.logo_url ? (
                      <img
                        src={azienda.logo_url}
                        alt={azienda.nome}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <Leaf className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  {isDemoCompany(azienda) && <p className="mt-4 text-xs uppercase tracking-wider text-cream/80">Anteprima della piattaforma · Impresa e prodotti dimostrativi</p>}
                  <h1 className="mt-4 font-serif text-4xl font-bold">{azienda.nome}</h1>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {azienda.settore && (
                      <span className="rounded-full bg-primary/20 px-3 py-1 font-medium text-cream">
                        {azienda.settore}
                      </span>
                    )}
                    {(azienda.comune || azienda.provincia) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cream/10 px-3 py-1 font-medium text-cream/80">
                        <MapPin className="h-3 w-3" />
                        {[azienda.comune, azienda.provincia].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                  {azienda.descrizione && (
                    <p className="mt-4 max-w-2xl text-cream/85">{azienda.descrizione}</p>
                  )}
                  <div className="mt-4 flex gap-4 text-cream/70">
                    {azienda.sito_web && (
                      <a href={azienda.sito_web} target="_blank" rel="noreferrer" aria-label="Sito web" className="hover:text-cream">
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                    {azienda.instagram && (
                      <a href={azienda.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-cream">
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {azienda.facebook && (
                      <a href={azienda.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-cream">
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
                {!isDemoCompany(azienda) && <Link
                  to="/aziende/$slug/admin"
                  params={{ slug }}
                  className="inline-flex items-center gap-2 self-start rounded-md border border-cream/40 px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-cream hover:text-brown"
                >
                  <Lock className="h-4 w-4" /> Area Azienda
                </Link>}
              </div>
            )}
          </div>
        </section>

        {azienda && !loading && !notFound && (
          <section className="py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
              <h2 className="font-serif text-2xl font-bold sm:text-3xl">I prodotti</h2>
              <div className="mt-2 h-1 w-16 rounded-full bg-primary" />

              {prodotti.length === 0 ? (
                <p className="mt-8 text-muted-foreground">
                  Questa azienda non ha ancora prodotti pubblicati. Contattala per
                  saperne di più.
                </p>
              ) : (
                <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                  {prodotti.map((p, i) => (
                    <Reveal key={p.id} delay={(i % 3) * 100}>
                      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-1">
                        <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-cream to-secondary/15">
                          {p.immagine_url ? (
                            <img
                              src={p.immagine_url}
                              alt={p.nome}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Leaf className="h-12 w-12 text-primary/40" />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-6">
                          <span className="text-xs font-medium uppercase tracking-wide text-primary">
                            {p.categoria}
                          </span>
                          <h3 className="mt-1 font-serif text-xl font-bold">{p.nome}</h3>
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                            {p.descrizione}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            {Number(p.prezzo) > 0 ? (
                              <span className="font-serif text-lg font-bold">
                                {formatPrice(Number(p.prezzo))}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Prezzo su richiesta
                              </span>
                            )}
                            {isDemoProduct(p) ? <Button size="sm" asChild><a href="/#richiesta-prodotto">Invia una richiesta</a></Button> : <Button size="sm" onClick={() => setSelected(p)}>
                              <HandHeart className="h-4 w-4" /> Sono interessato
                            </Button>}
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {azienda && (
          <InteresseDialog
            azienda={azienda}
            prodotto={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </CartProvider>
  );
}

function InteresseDialog({
  azienda,
  prodotto,
  onClose,
}: {
  azienda: DbAzienda;
  prodotto: DbProduct | null;
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
      azienda: azienda.nome,
      azienda_slug: azienda.slug,
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
    toast.success("Richiesta inviata! L'azienda ti contatterà presto.");
    onClose();
  };

  return (
    <Dialog open={!!prodotto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Richiedi informazioni</DialogTitle>
          <DialogDescription>
            {prodotto ? (
              <>
                Lascia i tuoi dati: <strong>{azienda.nome}</strong> ti contatterà per{" "}
                <strong>{prodotto.nome}</strong>. Non è un acquisto diretto.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nome_cliente" className="mb-1.5 block text-sm font-medium">
              Nome
            </label>
            <Input id="nome_cliente" name="nome_cliente" required placeholder="Nome e cognome" />
          </div>
          <div>
            <label htmlFor="email_cliente" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <Input id="email_cliente" name="email_cliente" type="email" required placeholder="latua@email.it" />
          </div>
          <div>
            <label htmlFor="telefono_cliente" className="mb-1.5 block text-sm font-medium">
              Telefono <span className="text-muted-foreground">(opzionale)</span>
            </label>
            <Input id="telefono_cliente" name="telefono_cliente" placeholder="+39 ..." />
          </div>
          <div>
            <label htmlFor="messaggio" className="mb-1.5 block text-sm font-medium">
              Messaggio <span className="text-muted-foreground">(opzionale)</span>
            </label>
            <Textarea id="messaggio" name="messaggio" rows={3} placeholder="Quantità desiderata, domande..." />
          </div>
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