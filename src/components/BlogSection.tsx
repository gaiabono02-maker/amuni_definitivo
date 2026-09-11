import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Leaf, MapPin } from "lucide-react";
import { fetchAziende, type DbAzienda, type DbProduct } from "@/lib/catalog";
import { fetchShowcaseProducts, isDemoProduct } from "@/lib/showcase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function BlogSection() {
  const [prodotti, setProdotti] = useState<DbProduct[]>([]);
  const [aziende, setAziende] = useState<DbAzienda[]>([]);
  const [selected, setSelected] = useState<DbProduct | null>(null);
  const [categoria, setCategoria] = useState("Tutti");
  const [errore, setErrore] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all([fetchShowcaseProducts(), fetchAziende()])
      .then(([p, a]) => { if (active) { setProdotti(p); setAziende(a); } })
      .catch(() => { if (active) setErrore(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const categorie = ["Tutti", ...new Set(prodotti.map(p => p.categoria).filter(Boolean))];
  const impresa = selected && aziende.find(a => a.nome === selected.azienda);
  return <section id="blog" className="scroll-mt-16 bg-muted/40 py-20 lg:py-28">
    <div className="mx-auto max-w-7xl px-5 lg:px-8">
      <header className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Il Blog</p>
        <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Dalla terra alla tavola</h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Ogni prodotto ha una storia. Scopri le produzioni e le imprese che le raccontano.</p>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Anteprima della piattaforma · Contenuti dimostrativi</p>
      </header>
      <div className="mb-10 flex flex-wrap justify-center gap-3">
        {categorie.map(c => <button key={c} aria-pressed={categoria === c} onClick={() => setCategoria(c)} className={`rounded-full border px-5 py-2 text-sm transition-colors ${categoria === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>{c}</button>)}
      </div>
      {loading && <p role="status" className="text-center">Caricamento delle storie…</p>}
      {errore && <p role="alert" className="text-center">Non è stato possibile caricare le storie. Riprova più tardi.</p>}
      <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {prodotti.filter(p => categoria === "Tutti" || p.categoria === categoria).map(p => {
          const azienda = aziende.find(a => a.nome === p.azienda);
          return <article key={p.id} className="group">
            <button onClick={() => setSelected(p)} className="block w-full overflow-hidden rounded-2xl bg-cream" aria-label={`Leggi la storia di ${p.nome}`}>
              {p.immagine_url ? <img src={p.immagine_url} alt={p.nome} loading="lazy" className="aspect-[4/3] w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.025]" /> : <div className="flex aspect-[4/3] items-center justify-center"><Leaf className="text-primary" /></div>}
            </button>
            <p className="mt-5 text-xs uppercase tracking-widest text-primary">{p.categoria}</p>
            <h3 className="mt-2 font-serif text-2xl"><button className="text-left hover:text-primary" onClick={() => setSelected(p)}>{p.nome}</button></h3>
            {azienda ? <Link to="/aziende/$slug" params={{slug:azienda.slug}} className="mt-2 block font-medium text-secondary hover:underline">di {p.azienda}</Link> : <p className="mt-2 font-medium text-secondary">di {p.azienda}</p>}
            {p.provincia && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{p.provincia}</p>}
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{p.descrizione || `Conosci ${p.azienda} e scopri ${p.nome}. Contatta l’impresa per approfondire questa produzione.`}</p>
            <button onClick={() => setSelected(p)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Leggi la storia <ArrowRight className="h-4 w-4" /></button>
          </article>;
        })}
      </div>
    </div>
    <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        {selected && <>
          <DialogHeader>
            <p className="text-xs uppercase tracking-widest text-primary">{selected.categoria} · Contenuti dimostrativi</p>
            <DialogTitle className="font-serif text-3xl">{selected.nome}</DialogTitle>
            <DialogDescription>di {selected.azienda}{selected.provincia ? ` · ${selected.provincia}` : ""}</DialogDescription>
          </DialogHeader>
          {selected.immagine_url && <img src={selected.immagine_url} alt={selected.nome} className="aspect-[16/10] w-full rounded-xl object-cover" />}
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{selected.descrizione || "Il racconto di questo prodotto è in preparazione. Puoi conoscere l’impresa e richiedere maggiori informazioni."}</p>
          {isDemoProduct(selected) && <p className="text-xs text-muted-foreground">Impresa e prodotto dimostrativi. Fotografia illustrativa, non riferita all’impresa.</p>}
          {impresa && <Link to="/aziende/$slug" params={{slug:impresa.slug}} className="font-medium text-secondary hover:underline">Conosci {impresa.nome} →</Link>}
          <a href="#bottega" onClick={() => setSelected(null)} className="font-medium text-primary">Esplora la Bottega →</a>
        </>}
      </DialogContent>
    </Dialog>
  </section>;
}
