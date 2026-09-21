import { ClientRegistrations } from "@/components/admin/ClientRegistrations";
import { fetchAllRows } from "@/lib/admin-pagination";
import { downloadCSV } from "@/lib/admin-csv";
import { CatalogManager } from "@/components/admin/CatalogManager";
import { InterestManager } from "@/components/admin/InterestManager";
import { AdminAccount } from "@/components/admin/AdminAccount";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, LogOut, Building2, ShoppingBag, PackageSearch, Loader2, Download, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Le tue iscrizioni — A.M.U.N.Ì." }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminDashboard,
});

type Iscrizione = {
  id: string;
  nome: string;
  azienda: string;
  settore: string | null;
  provincia: string | null;
  email: string;
  messaggio: string | null;
  stato: string;
  created_at: string;
};

type Acquirente = {
  id: string;
  nome: string;
  email: string;
  totale: number;
  articoli: { nome: string; qty: number; prezzo: number }[];
  created_at: string;
};

type RichiestaProdotto = {
  id: string;
  nome_prodotto: string;
  categoria: string;
  email: string;
  note: string;
  stato: string;
  created_at: string;
};

type Sostenitore = {
  user_id: string;
  nome: string;
  email: string;
  telefono: string;
  citta: string;
  provincia: string;
  indirizzo: string;
  created_at: string;
  abbonamento_id: string | null;
  piano: string;
  stato: string;
  prezzo: number;
  scadenza: string | null;
};

const PIANI_ADMIN = [
  { value: "nessuno", label: "Nessun piano" },
  { value: "sostenitore", label: "Sostenitore (45 €/3 mesi)" },
  { value: "ambasciatore", label: "Ambasciatore (100 €/anno)" },
];

const STATI_ABBONAMENTO = [
  { value: "in_attesa", label: "In attesa" },
  { value: "attivo", label: "Attivo" },
  { value: "scaduto", label: "Scaduto" },
  { value: "annullato", label: "Annullato" },
];

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const STATI_ISCRIZIONE: { value: string; label: string }[] = [
  { value: "in_attesa", label: "In attesa" },
  { value: "approvata", label: "Approvata" },
  { value: "rifiutata", label: "Rifiutata" },
];

const STATI_RICHIESTA: { value: string; label: string }[] = [
  { value: "nuova", label: "Nuova" },
  { value: "in_ricerca", label: "In ricerca" },
  { value: "trovato", label: "Trovato" },
  { value: "rifiutata", label: "Rifiutata" },
];

const statoLabelIscrizione = (v: string) =>
  STATI_ISCRIZIONE.find((s) => s.value === v)?.label ?? "In attesa";

const statoLabelRichiesta = (v: string) =>
  STATI_RICHIESTA.find((s) => s.value === v)?.label ?? "Nuova";

function AdminDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "denied" | "ready" | "error">("loading");
  const [tab, setTab] = useState("clienti");
  const [email, setEmail] = useState("");
  const [companyCount, setCompanyCount] = useState(0);
  const [seed, setSeed] = useState<{nome:string;settore:string;provincia:string}>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("tutte");
  const [refresh, setRefresh] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [companyPage, setCompanyPage] = useState(0);
  const [pending, setPending] = useState<string[]>([]);
  const [iscrizioni, setIscrizioni] = useState<Iscrizione[]>([]);
  const [acquirenti, setAcquirenti] = useState<Acquirente[]>([]);
  const [richieste, setRichieste] = useState<RichiestaProdotto[]>([]);
  const [sostenitori, setSostenitori] = useState<Sostenitore[]>([]);

  useEffect(() => {
    let active = true;
    setRefreshing(true);
    (async () => {
      try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/admin/login" });
        return;
      }
      setEmail(userData.user.email || "");
      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin");

      if (roleError) throw roleError;
      if (!active) return;
      if (!roles || roles.length === 0) {
        setStatus("denied");
        return;
      }

      const [isc, acq, rich, prof, abb, companies] = await Promise.all([
        fetchAllRows((from, to) => supabase.from("iscrizioni").select("*").order("created_at", { ascending: false }).order("id").range(from, to)),
        fetchAllRows((from, to) => supabase.from("acquirenti").select("*").order("created_at", { ascending: false }).order("id").range(from, to)),
        fetchAllRows((from, to) => supabase.from("richieste_prodotti").select("*").order("created_at", { ascending: false }).order("id").range(from, to)),
        fetchAllRows((from, to) => supabase.from("profili").select("*").order("created_at", { ascending: false }).order("id").range(from, to)),
        fetchAllRows((from, to) => supabase.from("abbonamenti").select("*").order("created_at", { ascending: false }).order("id").range(from, to)),
        supabase.from("aziende").select("id", {head:true,count:"exact"}),
      ]);
      if (!active) return;
      if ([isc, acq, rich, prof, abb, companies].some(r=>r.error)) throw new Error("Caricamento non riuscito");
      setCompanyCount(companies.count ?? 0);
      setIscrizioni((isc.data as Iscrizione[]) ?? []);
      setAcquirenti((acq.data as Acquirente[]) ?? []);
      setRichieste((rich.data as RichiestaProdotto[]) ?? []);
      const abbonamenti = abb.data ?? [];
      setSostenitori(
        (prof.data ?? []).map((p) => {
          const a = abbonamenti.find((x) => x.user_id === p.user_id);
          return {
            user_id: p.user_id,
            nome: p.nome,
            email: p.email,
            telefono: p.telefono,
            citta: p.citta,
            provincia: p.provincia,
            indirizzo: p.indirizzo,
            created_at: p.created_at,
            abbonamento_id: a?.id ?? null,
            piano: a?.piano ?? "nessuno",
            stato: a?.stato ?? "in_attesa",
            prezzo: Number(a?.prezzo ?? 0),
            scadenza: a?.scadenza ?? null,
          };
        })
      );
      setLoadedAt(new Date());
      setStatus("ready");
      } catch {
        if(active) setStatus("error");
      } finally {
        if(active) setRefreshing(false);
      }
    })();
    const {data: subscription} = supabase.auth.onAuthStateChange((event) => {
      if(event === "SIGNED_OUT") { setStatus("loading"); navigate({to:"/admin/login"}); }
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate, refresh]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  const updateStato = async (r: Iscrizione, nuovoStato: string) => {
    if (pending.includes(r.id)) return;
    setPending(prev => [...prev, r.id]);
    const precedente = r.stato;
    setIscrizioni((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, stato: nuovoStato } : x))
    );
    const { error } = await supabase
      .from("iscrizioni")
      .update({ stato: nuovoStato })
      .eq("id", r.id).select("id").single();
    setPending(prev => prev.filter(id => id !== r.id));
    if (error) {
      setIscrizioni((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, stato: precedente } : x))
      );
      toast.error("Errore nell'aggiornamento dello stato");
      return;
    }
    toast.success(`Stato aggiornato: ${statoLabelIscrizione(nuovoStato)}`);

  };

  const updateStatoRichiesta = async (r: RichiestaProdotto, nuovoStato: string) => {
    const precedente = r.stato;
    setRichieste((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, stato: nuovoStato } : x))
    );
    const { error } = await supabase
      .from("richieste_prodotti")
      .update({ stato: nuovoStato })
      .eq("id", r.id);
    if (error) {
      setRichieste((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, stato: precedente } : x))
      );
      toast.error("Errore nell'aggiornamento dello stato");
      return;
    }
    toast.success(`Stato aggiornato: ${statoLabelRichiesta(nuovoStato)}`);
  };

  const salvaAbbonamento = async (
    s: Sostenitore,
    patch: Partial<Pick<Sostenitore, "piano" | "stato" | "prezzo" | "scadenza">>
  ) => {
    if(pending.includes(s.user_id)) return;
    if(patch.prezzo !== undefined && (!Number.isFinite(patch.prezzo) || patch.prezzo < 0)){toast.error("Inserisci una quota valida.");return;}
    setPending(prev=>[...prev,s.user_id]);
    const aggiornato = { ...s, ...patch };
    setSostenitori((prev) => prev.map((x) => (x.user_id === s.user_id ? aggiornato : x)));
    const payload = {
      piano: aggiornato.piano,
      stato: aggiornato.stato,
      prezzo: aggiornato.prezzo,
      scadenza: aggiornato.scadenza,
    };
    if (aggiornato.abbonamento_id) {
      const { error } = await supabase
        .from("abbonamenti")
        .update(payload)
        .eq("id", aggiornato.abbonamento_id);
      if (error) {
        setPending(prev=>prev.filter(id=>id!==s.user_id));
        setSostenitori(prev=>prev.map(x=>x.user_id === s.user_id ? s:x));
        toast.error("Errore nel salvataggio dell'abbonamento");
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("abbonamenti")
        .insert({ ...payload, user_id: s.user_id, inizio: new Date().toISOString() })
        .select()
        .maybeSingle();
      if (error) {
        setPending(prev=>prev.filter(id=>id!==s.user_id));
        setSostenitori(prev=>prev.map(x=>x.user_id === s.user_id ? s:x));
        toast.error("Errore nella creazione dell'abbonamento");
        return;
      }
      setSostenitori((prev) =>
        prev.map((x) =>
          x.user_id === s.user_id ? { ...aggiornato, abbonamento_id: data?.id ?? null } : x
        )
      );
    }
    setPending(prev=>prev.filter(id=>id!==s.user_id));
    toast.success("Abbonamento aggiornato");
  };

  const exportSostenitori = () =>
    downloadCSV("sostenitori.csv", [
      ["Nome", "Email", "Telefono", "Città", "Provincia", "Piano", "Stato", "Quota", "Scadenza"],
      ...sostenitori.map((s) => [
        s.nome,
        s.email,
        s.telefono,
        s.citta,
        s.provincia,
        PIANI_ADMIN.find((p) => p.value === s.piano)?.label ?? s.piano,
        STATI_ABBONAMENTO.find((x) => x.value === s.stato)?.label ?? s.stato,
        Number(s.prezzo).toFixed(2),
        s.scadenza ? new Date(s.scadenza).toLocaleDateString("it-IT") : "",
      ]),
    ]);

  const filteredCompanies = iscrizioni.filter(r => (filter === "tutte" || r.stato === filter) &&
    [r.nome, r.azienda, r.email, r.provincia, r.settore].join(" ").toLocaleLowerCase("it").includes(search.trim().toLocaleLowerCase("it")));
  const companyLastPage = Math.max(0, Math.ceil(filteredCompanies.length / 20) - 1);
  const currentCompanyPage = Math.min(companyPage, companyLastPage);
  const visibleCompanies = filteredCompanies.slice(currentCompanyPage * 20, (currentCompanyPage + 1) * 20);

  const exportAziende = () =>
    downloadCSV("candidature.csv", [
      ["Data", "Referente", "Azienda", "Settore", "Provincia", "Email", "Messaggio", "Stato"],
      ...filteredCompanies.map((r) => [
        fmtDate(r.created_at),
        r.nome,
        r.azienda,
        r.settore ?? "",
        r.provincia ?? "",
        r.email,
        r.messaggio ?? "",
        statoLabelIscrizione(r.stato),
      ]),
    ]);

  const exportRichieste = () =>
    downloadCSV("richieste_prodotti.csv", [
      ["Data", "Prodotto richiesto", "Categoria", "Email", "Note", "Stato"],
      ...richieste.map((r) => [
        fmtDate(r.created_at),
        r.nome_prodotto,
        r.categoria,
        r.email,
        r.note ?? "",
        statoLabelRichiesta(r.stato),
      ]),
    ]);

  const exportAcquirenti = () =>
    downloadCSV("acquirenti.csv", [
      ["Data", "Nome", "Email", "Articoli", "Totale"],
      ...acquirenti.map((r) => [
        fmtDate(r.created_at),
        r.nome,
        r.email,
        Array.isArray(r.articoli)
          ? r.articoli.map((a) => `${a.nome} x${a.qty}`).join("; ")
          : "",
        Number(r.totale).toFixed(2),
      ]),
    ]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-brown">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (status === "error") return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream"><h1 className="font-serif text-2xl">Impossibile caricare il pannello</h1><p>Controlla la connessione e riprova.</p><Button onClick={()=>{setStatus("loading");setRefresh(n=>n+1);}}>Riprova</Button><Button variant="outline" onClick={logout}>Esci</Button></div>;

  if (status === "denied") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
        <h1 className="font-serif text-2xl font-bold text-brown">Accesso negato</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Il tuo account non ha i permessi di amministratore. Contatta il responsabile
          del progetto per ottenere l'accesso.
        </p>
        <Button variant="outline" onClick={logout}>
          <LogOut className="h-4 w-4" /> Esci
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stroke/30 bg-navy text-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 bg-depth text-gold">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-serif text-lg font-bold text-cream">
              La tua area amministrativa
            </span>
          </div>
          <Button variant="outline" size="sm" className="text-navy" onClick={logout}>
            <LogOut className="h-4 w-4" /> Esci
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Candidature da valutare</span>
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-brown">
              {iscrizioni.filter(r=>r.stato === "in_attesa").length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm">Aziende del network</span>
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-brown">
              {companyCount}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <PackageSearch className="h-4 w-4" />
              <span className="text-sm">Clienti registrati</span>
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-brown">
              {sostenitori.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Iscrizioni aziende</span>
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-brown">
              {iscrizioni.length}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-serif text-3xl font-bold text-brown">La tua rete, in un unico posto</h1><p className="mt-2 text-sm text-muted-foreground">Consulta tutti i clienti registrati e le iscrizioni delle aziende, cerca i contatti ed esporta gli elenchi.</p></div><div className="flex gap-2"><Button variant="outline" disabled={refreshing} onClick={()=>setRefresh(n=>n+1)}>{refreshing ? "Aggiornamento…" : "Aggiorna dati"}</Button><Button variant="outline" asChild><a href="/" target="_blank" rel="noreferrer">Apri il sito</a></Button></div></div>
        <p className="mb-4 text-xs text-muted-foreground" role="status">{loadedAt ? `Ultimo aggiornamento: ${loadedAt.toLocaleTimeString("it-IT")}. Premi Aggiorna dati per vedere le nuove iscrizioni.` : ""}</p>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="clienti">Clienti registrati ({sostenitori.length})</TabsTrigger>
            <TabsTrigger value="candidature">Iscrizioni aziende ({iscrizioni.length})</TabsTrigger>
            <TabsTrigger value="network">Schede aziende ({companyCount})</TabsTrigger>
            <TabsTrigger value="prodotti">Prodotti</TabsTrigger>
            <TabsTrigger value="box">Box</TabsTrigger>
            <TabsTrigger value="mese">Prodotto del mese</TabsTrigger>
            <TabsTrigger value="interesse">Contatti commerciali</TabsTrigger>
            <TabsTrigger value="acquirenti">Ordini ({acquirenti.length})</TabsTrigger>
            <TabsTrigger value="richieste">Richieste ({richieste.length})</TabsTrigger>
            <TabsTrigger value="sostenitori">Piani clienti</TabsTrigger>
            <TabsTrigger value="account">Il mio account</TabsTrigger>
          </TabsList>
          <TabsContent value="clienti"><ClientRegistrations clients={sostenitori} /></TabsContent>
          <TabsContent value="network"><CatalogManager key={`aziende-${refresh}`} table="aziende" seed={seed} onCount={setCompanyCount}/></TabsContent>
          <TabsContent value="prodotti"><CatalogManager key={`prodotti-${refresh}`} table="prodotti"/></TabsContent>
          <TabsContent value="box"><CatalogManager key={`box-${refresh}`} table="bundle"/></TabsContent>
          <TabsContent value="mese"><CatalogManager key={`mese-${refresh}`} table="prodotto_del_mese"/></TabsContent>
          <TabsContent value="interesse"><InterestManager key={refresh}/></TabsContent>
          <TabsContent value="account"><AdminAccount email={email}/></TabsContent>
          <TabsContent value="candidature">
            <h2 className="font-serif text-2xl font-bold text-brown">Iscrizioni delle aziende</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">Valuta le richieste e crea la scheda delle aziende approvate. Il cambio di stato viene registrato nel pannello.</p>
            <div className="mb-4 flex flex-wrap gap-3"><Input className="max-w-md" aria-label="Cerca candidature" placeholder="Cerca referente, azienda o email…" value={search} onChange={e=>{setSearch(e.target.value);setCompanyPage(0);}}/><select aria-label="Filtra candidature per stato" className="rounded-md border bg-background px-3 py-2 text-sm" value={filter} onChange={e=>{setFilter(e.target.value);setCompanyPage(0);}}><option value="tutte">Tutti gli stati</option>{STATI_ISCRIZIONE.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></div>
            <div className="mb-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={exportAziende} disabled={filteredCompanies.length === 0}>
                <Download className="h-4 w-4" /> Esporta CSV
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Referente</TableHead>
                    <TableHead>Azienda</TableHead>
                    <TableHead>Settore</TableHead>
                    <TableHead>Provincia</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Messaggio</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        {iscrizioni.length ? "Nessuna azienda corrisponde ai filtri selezionati." : "Nessuna iscrizione ricevuta. Le candidature inviate dal modulo aziende compariranno qui."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleCompanies.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {fmtDate(r.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">{r.nome}</TableCell>
                        <TableCell>{r.azienda}</TableCell>
                        <TableCell>{r.settore ?? "—"}</TableCell>
                        <TableCell>{r.provincia ?? "—"}</TableCell>
                        <TableCell><a className="text-primary underline" href={`mailto:${r.email}`}>{r.email}</a></TableCell>
                        <TableCell className="min-w-48 max-w-xs whitespace-pre-wrap break-words text-sm text-muted-foreground">
                          {r.messaggio ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Select disabled={pending.includes(r.id)} value={r.stato} onValueChange={(v) => updateStato(r, v)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATI_ISCRIZIONE.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {r.stato === "approvata" && <Button className="mt-2" variant="outline" size="sm" onClick={()=>{setSeed({nome:r.azienda,settore:r.settore || "",provincia:r.provincia || ""});setTab("network");}}>Crea scheda azienda</Button>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{filteredCompanies.length} iscrizioni · Pagina {currentCompanyPage + 1} di {companyLastPage + 1}</p>{companyLastPage > 0 && <div className="flex gap-2"><Button variant="outline" disabled={currentCompanyPage === 0} onClick={() => setCompanyPage(currentCompanyPage - 1)}>Precedente</Button><Button variant="outline" disabled={currentCompanyPage === companyLastPage} onClick={() => setCompanyPage(currentCompanyPage + 1)}>Successiva</Button></div>}</div>
          </TabsContent>

          <TabsContent value="acquirenti">
            <div className="mb-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={exportAcquirenti} disabled={acquirenti.length === 0}>
                <Download className="h-4 w-4" /> Esporta CSV
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Articoli</TableHead>
                    <TableHead>Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acquirenti.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nessun acquirente registrato.
                      </TableCell>
                    </TableRow>
                  ) : (
                    acquirenti.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {fmtDate(r.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">{r.nome}</TableCell>
                        <TableCell><a className="text-primary underline" href={`mailto:${r.email}`}>{r.email}</a></TableCell>
                        <TableCell className="max-w-sm text-sm text-muted-foreground">
                          {Array.isArray(r.articoli) && r.articoli.length > 0
                            ? r.articoli
                                .map((a) => `${a.nome} ×${a.qty}`)
                                .join(", ")
                            : "—"}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          €{Number(r.totale).toFixed(2).replace(".", ",")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="richieste">
            <div className="mb-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={exportRichieste} disabled={richieste.length === 0}>
                <Download className="h-4 w-4" /> Esporta CSV
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Prodotto richiesto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {richieste.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Nessuna richiesta ricevuta.
                      </TableCell>
                    </TableRow>
                  ) : (
                    richieste.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {fmtDate(r.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">{r.nome_prodotto}</TableCell>
                        <TableCell>{r.categoria}</TableCell>
                        <TableCell><a className="text-primary underline" href={`mailto:${r.email}`}>{r.email}</a></TableCell>
                        <TableCell className="min-w-48 max-w-xs whitespace-pre-wrap break-words text-sm text-muted-foreground">
                          {r.note || "—"}
                        </TableCell>
                        <TableCell>
                          <Select value={r.stato} onValueChange={(v) => updateStatoRichiesta(r, v)}>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATI_RICHIESTA.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="sostenitori">
            <div className="mb-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={exportSostenitori}
                disabled={sostenitori.length === 0}
              >
                <Download className="h-4 w-4" /> Esporta CSV
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contatti</TableHead>
                    <TableHead>Piano</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Quota €</TableHead>
                    <TableHead>Scadenza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sostenitori.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Nessun utente registrato.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sostenitori.map((s) => (
                      <TableRow key={s.user_id}>
                        <TableCell className="font-medium">{s.nome || "—"}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {[s.telefono, s.citta, s.provincia].filter(Boolean).join(" · ") || "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            disabled={pending.includes(s.user_id)}
                            value={s.piano}
                            onValueChange={(v) => salvaAbbonamento(s, { piano: v })}
                          >
                            <SelectTrigger className="w-[190px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PIANI_ADMIN.map((p) => (
                                <SelectItem key={p.value} value={p.value}>
                                  {p.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            disabled={pending.includes(s.user_id)}
                            value={s.stato}
                            onValueChange={(v) => salvaAbbonamento(s, { stato: v })}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATI_ABBONAMENTO.map((x) => (
                                <SelectItem key={x.value} value={x.value}>
                                  {x.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            disabled={pending.includes(s.user_id)}
                            min={0}
                            key={`${s.user_id}-${s.prezzo}`}
                            type="number"
                            step="0.01"
                            className="w-24"
                            defaultValue={s.prezzo}
                            onBlur={(e) =>
                              salvaAbbonamento(s, { prezzo: Number(e.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            disabled={pending.includes(s.user_id)}
                            key={`${s.user_id}-${s.scadenza}`}
                            type="date"
                            className="w-40"
                            defaultValue={s.scadenza ? s.scadenza.slice(0, 10) : ""}
                            onChange={(e) =>
                              salvaAbbonamento(s, {
                                scadenza: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}