import { useState } from "react";
import { Download, Search, UserRound, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCSV } from "@/lib/admin-csv";

export type ClientRegistration = {
  user_id: string;
  nome: string;
  email: string;
  telefono: string;
  citta: string;
  provincia: string;
  indirizzo: string;
  created_at: string;
  piano: string;
};
const date = (value: string) => new Date(value).toLocaleDateString("it-IT");
const pageSize = 20;

export function ClientRegistrations({ clients }: { clients: ClientRegistration[] }) {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ClientRegistration | null>(null);
  const filtered = clients.filter(c => (!province || c.provincia === province) &&
    [c.nome, c.email, c.telefono, c.citta, c.provincia].join(" ").toLocaleLowerCase("it").includes(search.trim().toLocaleLowerCase("it")));
  const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const provinces = [...new Set(clients.map(c => c.provincia).filter(Boolean))].sort();
  const exportClients = () => downloadCSV("clienti-registrati.csv", [
    ["Data iscrizione", "Nome", "Email", "Telefono", "Città", "Provincia", "Indirizzo", "Piano"],
    ...filtered.map(c => [date(c.created_at), c.nome, c.email, c.telefono, c.citta, c.provincia, c.indirizzo, c.piano === "nessuno" ? "Nessun piano" : c.piano]),
  ]);

  return <section className="space-y-5" aria-labelledby="clienti-title">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 id="clienti-title" className="font-serif text-2xl font-bold">Clienti registrati</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Tutti gli account iscritti al sito, anche senza acquisti o abbonamenti. Apri una scheda per vedere i contatti e i dati del cliente.</p></div>
      <Button variant="outline" onClick={exportClients} disabled={!filtered.length}><Download className="h-4 w-4" /> Esporta elenco CSV</Button>
    </div>
    <div className="flex flex-wrap gap-3">
      <div className="relative min-w-0 flex-1 sm:max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Cerca clienti" placeholder="Cerca nome, email, telefono o città…" className="pl-9" value={search} onChange={e => {setSearch(e.target.value); setPage(0);}} /></div>
      <select aria-label="Filtra clienti per provincia" className="max-w-full rounded-md border border-input bg-card px-3 py-2 text-sm" value={province} onChange={e => {setProvince(e.target.value); setPage(0);}}>
        <option value="">Tutte le province</option>{provinces.map(p => <option key={p}>{p}</option>)}
      </select>
    </div>
    <p className="text-sm text-muted-foreground" role="status">{filtered.length} di {clients.length} iscritti</p>
    <div className="rounded-xl border bg-card">
      <Table><TableHeader><TableRow><TableHead>Iscrizione</TableHead><TableHead>Cliente</TableHead><TableHead>Email</TableHead><TableHead>Provincia</TableHead><TableHead><span className="sr-only">Dettagli</span></TableHead></TableRow></TableHeader>
        <TableBody>{visible.length ? visible.map(c => <TableRow key={c.user_id}>
          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{date(c.created_at)}</TableCell>
          <TableCell className="font-medium">{c.nome || "Nome non indicato"}</TableCell>
          <TableCell><a href={`mailto:${c.email}`} className="text-primary underline">{c.email || "—"}</a></TableCell>
          <TableCell>{c.provincia || "—"}</TableCell>
          <TableCell><Button variant="outline" size="sm" onClick={() => setSelected(c)} aria-label={`Vedi dettagli di ${c.nome || c.email}`}><UserRound className="h-4 w-4" /> Dettagli</Button></TableCell>
        </TableRow>) : <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">{clients.length ? "Nessun cliente corrisponde ai filtri selezionati." : "Non ci sono ancora clienti registrati. Le nuove iscrizioni compariranno qui."}</TableCell></TableRow>}</TableBody>
      </Table>
    </div>
    {lastPage > 0 && <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm">Pagina {currentPage + 1} di {lastPage + 1}</p><div className="flex gap-2"><Button variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="h-4 w-4" /> Precedente</Button><Button variant="outline" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Successiva <ChevronRight className="h-4 w-4" /></Button></div></div>}
    <Dialog open={Boolean(selected)} onOpenChange={open => {if (!open) setSelected(null);}}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{selected?.nome || "Scheda cliente"}</DialogTitle><DialogDescription>Dati forniti dal cliente al momento dell’iscrizione e nel proprio profilo.</DialogDescription></DialogHeader>
        {selected && <dl className="grid gap-4 text-sm">
          {[["Iscritto il", date(selected.created_at)], ["Email", selected.email], ["Telefono", selected.telefono], ["Città", selected.citta], ["Provincia", selected.provincia], ["Indirizzo", selected.indirizzo], ["Piano", selected.piano === "nessuno" ? "Nessun piano" : selected.piano]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value || "Non indicato"}</dd></div>)}
          <Button asChild><a href={`mailto:${selected.email}`}>Scrivi al cliente</a></Button>
        </dl>}
      </DialogContent>
    </Dialog>
  </section>;
}
