import { useEffect, useState, type FormEvent } from "react";
import { Plus, Pencil, ExternalLink, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { catalogMutation, type CatalogTable } from "@/lib/admin-catalog.schema";
import { saveCatalogItem } from "@/lib/admin-catalog.functions";
import { toast } from "sonner";

type Field = { key: string; label: string; kind?: "text" | "textarea" | "number" | "url" | "checkbox" | "list" | "company" | "product" | "datetime-local"; required?: boolean; max?: number };
type Item = Record<string, unknown> & {id: string};
type Draft = Record<string, string | boolean>;
const configs: Record<CatalogTable, {title:string; singular:string; description:string; visible:string; fields:Field[]}> = {
  aziende: {title:"Aziende del network", singular:"azienda", description:"Crea una scheda, aggiungi la storia dell'impresa e pubblicala sul sito quando è pronta.", visible:"pubblica", fields:[
    {key:"nome",label:"Nome azienda",required:true},{key:"slug",label:"Indirizzo della scheda (es. azienda-rossi)",required:true},
    {key:"settore",label:"Settore"},{key:"provincia",label:"Provincia"},{key:"comune",label:"Comune"},
    {key:"descrizione",label:"Presentazione dell'azienda",kind:"textarea"}, {key:"certificazioni",label:"Certificazioni (una per riga)",kind:"list"},
    {key:"logo_url",label:"URL logo o immagine",kind:"url"},{key:"sito_web",label:"Sito web",kind:"url"},
    {key:"instagram",label:"Link Instagram",kind:"url"},{key:"facebook",label:"Link Facebook",kind:"url"},
    {key:"pubblica",label:"Pubblica la scheda sul sito",kind:"checkbox"},
  ]},
  prodotti: {title:"Catalogo prodotti",singular:"prodotto",description:"Gestisci i prodotti della bottega e collegali alle aziende del network.",visible:"disponibile",fields:[
    {key:"nome",label:"Nome prodotto",required:true},{key:"azienda",label:"Azienda produttrice",kind:"company",required:true},
    {key:"provincia",label:"Provincia"},{key:"categoria",label:"Categoria",required:true},
    {key:"descrizione",label:"Descrizione",kind:"textarea"},{key:"prezzo",label:"Prezzo (€)",kind:"number",required:true},
    {key:"immagine_url",label:"URL immagine",kind:"url"},{key:"ordine",label:"Posizione nel catalogo",kind:"number"},
    {key:"disponibile",label:"Disponibile e visibile nella bottega",kind:"checkbox"},
  ]},
  bundle: {title:"Box e selezioni",singular:"box",description:"Componi le selezioni di prodotti del territorio proposte nella bottega.",visible:"attivo",fields:[
    {key:"nome",label:"Nome della box",required:true},{key:"descrizione",label:"Descrizione",kind:"textarea"},
    {key:"prodotti_inclusi",label:"Prodotti inclusi (uno per riga)",kind:"list",required:true},
    {key:"prezzo",label:"Prezzo box (€)",kind:"number",required:true},{key:"prezzo_singoli",label:"Prezzo dei prodotti acquistati singolarmente (€)",kind:"number"},
    {key:"immagine_url",label:"URL immagine",kind:"url"},{key:"ordine",label:"Posizione nella bottega",kind:"number"},
    {key:"attivo",label:"Mostra la box nella bottega",kind:"checkbox"},
  ]},
  prodotto_del_mese: {title:"Prodotto del mese",singular:"selezione del mese",description:"Metti in evidenza un prodotto e racconta la storia del produttore. Tra le selezioni attive e non scadute appare la più recente.",visible:"attivo",fields:[
    {key:"prodotto_id",label:"Prodotto",kind:"product",required:true},
    {key:"produttore_storia",label:"Storia del produttore",kind:"textarea"},
    {key:"sconto_percentuale",label:"Sconto (%)",kind:"number",max:100},
    {key:"scadenza",label:"Scadenza della promozione",kind:"datetime-local",required:true},
    {key:"attivo",label:"Attiva la selezione",kind:"checkbox"},
  ]},
};
const companyColumns = "id,nome,slug,descrizione,provincia,comune,settore,certificazioni,logo_url,sito_web,instagram,facebook,pubblica";

export function CatalogManager({table, seed, onCount}: {table:CatalogTable; seed?:{nome:string;settore:string;provincia:string}; onCount?:(n:number)=>void}) {
  const config = configs[table];
  const [items,setItems] = useState<Item[]>([]);
  const [companies,setCompanies] = useState<{id:string;nome:string}[]>([]);
  const [products,setProducts] = useState<{id:string;nome:string}[]>([]);
  const [loading,setLoading] = useState(true);
  const [failed,setFailed] = useState(false);
  const [query,setQuery] = useState("");
  const [editing,setEditing] = useState<Item | null>(null);
  const [open,setOpen] = useState(false);
  const [draft,setDraft] = useState<Draft>({});
  const [saving,setSaving] = useState(false);
  const [uploading,setUploading] = useState(false);

  async function reload() {
    setLoading(true); setFailed(false);
    try {
      const [result,companyResult,productResult] = await Promise.all([
        supabase.from(table).select(table === "aziende" ? companyColumns : "*").order("created_at",{ascending:false}),
        supabase.from("aziende").select("id,nome").order("nome"),
        supabase.from("prodotti").select("id,nome").order("nome"),
      ]);
      if(result.error || companyResult.error || productResult.error) throw new Error();
      const rows = result.data as unknown as Item[];
      setItems(rows); setCompanies(companyResult.data ?? []); setProducts(productResult.data ?? []);
      onCount?.(rows.length);
    } catch {setFailed(true); toast.error("Impossibile caricare il catalogo. Riprova.");}
    finally {setLoading(false);}
  }
  useEffect(()=>{void reload();},[table]); // eslint-disable-line react-hooks/exhaustive-deps

  function edit(item:Item | null, initial?: typeof seed) {
    const values:Draft = {};
    for(const f of config.fields) {
      const v = item?.[f.key];
      values[f.key] = f.kind === "checkbox" ? Boolean(v) : Array.isArray(v) ? v.join("\n") : v == null ? (f.kind === "number" ? "0" : "") : String(v);
      if(f.kind === "datetime-local" && v) {
        const date = new Date(String(v));
        values[f.key] = new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
      }
    }
    if(initial && table === "aziende") Object.assign(values,initial,{slug:slugify(initial.nome)});
    setDraft(values); setEditing(item); setOpen(true);
  }
  useEffect(()=>{if(seed) edit(null,seed);},[seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const slugify = (v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

  async function upload(file:File, key:string) {
    if(!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size>5*1024*1024) {toast.error("Scegli un'immagine JPG, PNG o WebP fino a 5 MB.");return;}
    setUploading(true);
    try {
      const ext = {"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
      const path = `admin/${crypto.randomUUID()}.${ext}`;
      const {error} = await supabase.storage.from("catalogo").upload(path,file,{contentType:file.type});
      if(error) throw error;
      const {data} = supabase.storage.from("catalogo").getPublicUrl(path);
      setDraft(d=>({...d,[key]:data.publicUrl}));
      toast.success("Immagine caricata. Salva la scheda per confermare.");
    } catch {toast.error("Caricamento immagine non riuscito.");}
    finally {setUploading(false);}
  }
  async function save(e:FormEvent) {
    e.preventDefault(); if(saving || uploading) return;
    setSaving(true);
    try {
      const values:Record<string,unknown>={...draft};
      for(const f of config.fields) {
        if(f.kind === "list") values[f.key] = String(draft[f.key] || "").split("\n").map(s=>s.trim()).filter(Boolean);
        if(f.kind === "datetime-local") values[f.key] = new Date(String(draft[f.key])).toISOString();
      }
      const parsed = catalogMutation.safeParse({table,values});
      if(!parsed.success) {toast.error(parsed.error.issues[0].message);return;}
      const {data} = await supabase.auth.getSession();
      if(!data.session) throw new Error("Sessione scaduta. Accedi di nuovo.");
      await saveCatalogItem({data:{token:data.session.access_token,id:editing?.id,item:parsed.data}});
      setOpen(false); toast.success("Salvataggio completato"); await reload();
    } catch(error) {toast.error(error instanceof Error ? error.message : "Salvataggio non riuscito.");}
    finally {setSaving(false);}
  }
  const filtered=items.filter(i=>[i.nome,i.azienda,i.provincia,i.settore,products.find(p=>p.id===i.prodotto_id)?.nome].join(" ").toLowerCase().includes(query.toLowerCase()));
  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold text-brown">{config.title}</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{config.description}</p></div><Button onClick={()=>edit(null)}><Plus className="h-4 w-4"/> Aggiungi {config.singular}</Button></div>
    <div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input aria-label={`Cerca in ${config.title}`} placeholder="Cerca per nome, azienda o provincia…" value={query} onChange={e=>setQuery(e.target.value)} className="pl-9"/></div>
    {loading ? <p className="flex items-center gap-2 p-6"><Loader2 className="h-4 w-4 animate-spin"/> Caricamento…</p> : failed ? <Button variant="outline" onClick={()=>void reload()}>Riprova caricamento</Button> : filtered.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">{query ? "Nessun risultato per questa ricerca." : `Nessuna ${config.singular === "azienda" ? "azienda inserita" : "scheda inserita"}. Usa il pulsante Aggiungi per iniziare.`}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item=><article key={item.id} className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item[config.visible] ? "bg-green-100 text-green-800":"bg-muted text-muted-foreground"}`}>{item[config.visible] ? "Pubblicato / attivo" : "Bozza / non attivo"}</span>{item.slug && item.pubblica ? <a href={`/aziende/${item.slug}`} target="_blank" rel="noreferrer" aria-label="Apri scheda pubblica"><ExternalLink className="h-4 w-4"/></a>:null}</div>
      <h3 className="font-serif text-xl font-bold">{String(item.nome || products.find(p=>p.id===item.prodotto_id)?.nome || "Selezione del mese")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{[item.azienda,item.settore,item.provincia].filter(Boolean).join(" · ")}</p>
      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{String(item.descrizione || item.produttore_storia || "Completa la presentazione della scheda.")}</p>
      {item.scadenza ? <p className="mt-2 text-xs">Scadenza: {new Date(String(item.scadenza)).toLocaleDateString("it-IT")}</p>:null}
      <Button variant="outline" className="mt-4" onClick={()=>edit(item)}><Pencil className="h-4 w-4"/> Modifica</Button>
    </article>)}</div>}
    <Dialog open={open} onOpenChange={v=>{if(!saving && !uploading)setOpen(v);}}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editing ? "Modifica" : "Aggiungi"} {config.singular}</DialogTitle><DialogDescription>Compila i dettagli e scegli quando renderli visibili sul sito.</DialogDescription></DialogHeader>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">{config.fields.map(f=><div key={f.key} className={f.kind === "textarea" || f.kind === "list" || f.kind === "checkbox" ? "sm:col-span-2":""}>
        <label htmlFor={`catalog-${f.key}`} className="mb-1.5 block text-sm font-medium">{f.kind !== "checkbox" && f.label}</label>
        {f.kind === "checkbox" ? <label className="flex items-center gap-2 text-sm"><input id={`catalog-${f.key}`} type="checkbox" checked={Boolean(draft[f.key])} onChange={e=>setDraft({...draft,[f.key]:e.target.checked})}/>{f.label}</label>
        : f.kind === "textarea" || f.kind === "list" ? <Textarea id={`catalog-${f.key}`} rows={4} required={f.required} value={String(draft[f.key] || "")} onChange={e=>setDraft({...draft,[f.key]:e.target.value})}/>
        : f.kind === "company" || f.kind === "product" ? <select id={`catalog-${f.key}`} required className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={String(draft[f.key] || "")} onChange={e=>setDraft({...draft,[f.key]:e.target.value})}><option value="">Seleziona…</option>{(f.kind === "company" ? companies : products).map(p=><option key={p.id} value={f.kind === "company" ? p.nome : p.id}>{p.nome}</option>)}</select>
        : <Input id={`catalog-${f.key}`} type={f.kind || "text"} required={f.required} min={f.kind === "number" ? 0:undefined} max={f.max} step={f.kind === "number" ? (f.key.startsWith("prezzo") ? "0.01":"1"):undefined} readOnly={f.key === "slug" && Boolean(editing)} value={String(draft[f.key] ?? "")} onChange={e=>setDraft(d=>({...d,[f.key]:e.target.value,...(table === "aziende" && f.key === "nome" && !editing ? {slug:slugify(e.target.value)}:{})}))}/>}
        {(f.key === "logo_url" || f.key === "immagine_url") && <div className="mt-2"><label className="text-xs text-muted-foreground">Oppure carica un'immagine (max 5 MB)<input aria-label="Carica immagine" className="mt-1 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file,f.key);}}/></label></div>}
      </div>)}<div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2"><Button type="button" variant="outline" disabled={saving || uploading} onClick={()=>setOpen(false)}>Annulla</Button><Button type="submit" disabled={saving || uploading}>{saving ? "Salvataggio…":uploading ? "Caricamento…":"Salva"}</Button></div></form>
    </DialogContent></Dialog>
  </section>;
}
