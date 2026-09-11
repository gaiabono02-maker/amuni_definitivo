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
  head: () => ({
    meta: [{ title: "Pannello Admin — A.M.U.N.Ì." }],
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

const downloadCSV = (filename: string, rows: (string | number)[][]) => {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "denied" | "ready">("loading");
  const [iscrizioni, setIscrizioni] = useState<Iscrizione[]>([]);
  const [acquirenti, setAcquirenti] = useState<Acquirente[]>([]);
  const [richieste, setRichieste] = useState<RichiestaProdotto[]>([]);
  const [sostenitori, setSostenitori] = useState<Sostenitore[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin");

      if (!active) return;
      if (!roles || roles.length === 0) {
        setStatus("denied");
        return;
      }

      const [isc, acq, rich, prof, abb] = await Promise.all([
        supabase.from("iscrizioni").select("*").order("created_at", { ascending: false }),
        supabase.from("acquirenti").select("*").order("created_at", { ascending: false }),
        supabase.from("richieste_prodotti").select("*").order("created_at", { ascending: false }),
        supabase.from("profili").select("*").order("created_at", { ascending: false }),
        supabase.from("abbonamenti").select("*").order("created_at", { ascending: false }),
      ]);
      if (!active) return;
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
            abbonamento_id: a?.id ?? null,
            piano: a?.piano ?? "nessuno",
            stato: a?.stato ?? "in_attesa",
            prezzo: Number(a?.prezzo ?? 0),
            scadenza: a?.scadenza ?? null,
          };
        })
      );
      setStatus("ready");
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  const updateStato = async (r: Iscrizione, nuovoStato: string) => {
    const precedente = r.stato;
    setIscrizioni((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, stato: nuovoStato } : x))
    );
    const { error } = await supabase
      .from("iscrizioni")
      .update({ stato: nuovoStato })
      .eq("id", r.id);
    if (error) {
      setIscrizioni((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, stato: precedente } : x))
      );
      toast.error("Errore nell'aggiornamento dello stato");
      return;
    }
    toast.success(`Stato aggiornato: ${statoLabelIscrizione(nuovoStato)}`);
    try {
      await fetch("/api/notify-stato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: r.id,
          email: r.email,
          nome: r.nome,
          azienda: r.azienda,
          stato: nuovoStato,
        }),
      });
    } catch {
      // notifica email best-effort
    }
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
        toast.error("Errore nella creazione dell'abbonamento");
        return;
      }
      setSostenitori((prev) =>
        prev.map((x) =>
          x.user_id === s.user_id ? { ...aggiornato, abbonamento_id: data?.id ?? null } : x
        )
      );
    }
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

  const exportAziende = () =>
    downloadCSV("aziende.csv", [
      ["Data", "Referente", "Azienda", "Settore", "Provincia", "Email", "Messaggio", "Stato"],
      ...iscrizioni.map((r) => [
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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-serif text-lg font-bold text-brown">
              Pannello Amministratore
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" /> Esci
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Aziende iscritte al network</span>
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-brown">
              {iscrizioni.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm">Acquirenti registrati</span>
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-brown">
              {acquirenti.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <PackageSearch className="h-4 w-4" />
              <span className="text-sm">Richieste prodotti</span>
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-brown">
              {richieste.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Sostenitori attivi</span>
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-brown">
              {sostenitori.filter((s) => s.stato === "attivo").length}
            </p>
          </div>
        </div>

        <Tabs defaultValue="aziende">
          <TabsList>
            <TabsTrigger value="aziende">Aziende ({iscrizioni.length})</TabsTrigger>
            <TabsTrigger value="acquirenti">Acquirenti ({acquirenti.length})</TabsTrigger>
            <TabsTrigger value="richieste">Richieste ({richieste.length})</TabsTrigger>
            <TabsTrigger value="sostenitori">Sostenitori ({sostenitori.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="aziende">
            <div className="mb-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={exportAziende} disabled={iscrizioni.length === 0}>
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
                  {iscrizioni.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Nessuna iscrizione ricevuta.
                      </TableCell>
                    </TableRow>
                  ) : (
                    iscrizioni.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {fmtDate(r.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">{r.nome}</TableCell>
                        <TableCell>{r.azienda}</TableCell>
                        <TableCell>{r.settore ?? "—"}</TableCell>
                        <TableCell>{r.provincia ?? "—"}</TableCell>
                        <TableCell>{r.email}</TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">
                          {r.messaggio ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Select value={r.stato} onValueChange={(v) => updateStato(r, v)}>
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
                        <TableCell>{r.email}</TableCell>
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
                        <TableCell>{r.email}</TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">
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