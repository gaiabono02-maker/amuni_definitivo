import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Interest = Database["public"]["Tables"]["richieste_interesse"]["Row"];
export function InterestManager() {
  const [rows,setRows]=useState<Interest[]>([]);
  const [loading,setLoading]=useState(true);
  const [failed,setFailed]=useState(false);
  const [query,setQuery]=useState("");
  async function load() {
    setLoading(true); setFailed(false);
    try {const {data,error}=await supabase.from("richieste_interesse").select("*").order("created_at",{ascending:false});if(error)throw error;setRows(data ?? []);}
    catch {setFailed(true);toast.error("Impossibile caricare i contatti commerciali.");}
    finally {setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  return <section className="space-y-4"><div><h2 className="font-serif text-2xl font-bold text-brown">Contatti commerciali</h2><p className="mt-1 text-sm text-muted-foreground">Segui le richieste inviate ai produttori, aggiorna le trattative e conserva le note interne.</p></div>
    <Input aria-label="Cerca contatti commerciali" placeholder="Cerca cliente, azienda o prodotto…" value={query} onChange={e=>setQuery(e.target.value)} className="max-w-md"/>
    {loading ? <p>Caricamento…</p> : failed ? <Button onClick={()=>void load()}>Riprova</Button> : rows.filter(r=>[r.azienda,r.nome_cliente,r.prodotto_nome,r.email_cliente].join(" ").toLowerCase().includes(query.toLowerCase())).map(r=><InterestCard key={r.id} row={r} onSave={next=>setRows(prev=>prev.map(x=>x.id===next.id?next:x))}/>)}
    {!loading && !failed && rows.length===0 && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Nessuna richiesta commerciale ricevuta.</p>}
  </section>;
}
function InterestCard({row,onSave}:{row:Interest;onSave:(row:Interest)=>void}) {
  const [notes,setNotes]=useState(row.note_interne);
  const [state,setState]=useState(row.stato);
  const [contacted,setContacted]=useState(Boolean(row.contattato_il));
  const [saving,setSaving]=useState(false);
  async function save() {
    setSaving(true);
    try {
      const {data,error}=await supabase.from("richieste_interesse").update({stato:state,note_interne:notes,contattato_il:contacted ? row.contattato_il || new Date().toISOString():null}).eq("id",row.id).select().single();
      if(error)throw error;onSave(data);toast.success("Richiesta aggiornata");
    } catch {toast.error("Salvataggio non riuscito.");}finally{setSaving(false);}
  }
  return <article className="grid gap-5 rounded-xl border bg-card p-5 md:grid-cols-2"><div><p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("it-IT")}</p><h3 className="mt-1 font-serif text-xl font-bold">{row.prodotto_nome}</h3><p className="text-sm">{row.azienda}</p><p className="mt-3 font-medium">{row.nome_cliente}</p><a className="block text-sm text-primary underline" href={`mailto:${row.email_cliente}`}>{row.email_cliente}</a>{row.telefono_cliente && <a className="block text-sm" href={`tel:${row.telefono_cliente}`}>{row.telefono_cliente}</a>}<p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{row.messaggio}</p></div>
    <div className="space-y-3"><label className="block text-sm">Stato<select aria-label={`Stato richiesta di ${row.nome_cliente}`} className="mt-1 block h-10 w-full rounded-md border bg-background px-3" value={state} onChange={e=>setState(e.target.value)}><option value="da_contattare">Da contattare</option><option value="in_trattativa">In trattativa</option><option value="confermato">Confermato</option></select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={contacted} onChange={e=>setContacted(e.target.checked)}/>Cliente già contattato</label><label className="block text-sm">Note interne<Textarea className="mt-1" value={notes} maxLength={2000} onChange={e=>setNotes(e.target.value)}/></label><Button disabled={saving} onClick={()=>void save()}>{saving ? "Salvataggio…":"Salva aggiornamento"}</Button></div>
  </article>;
}
