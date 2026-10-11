import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addAdministrator, listAdministrators } from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Administrator = { id: string; email: string; created_at: string };

async function getToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return data.session.access_token;
}

export function AdministratorManager() {
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try { setAdministrators(await listAdministrators({ data: { token: await getToken() } })); }
    catch { setError("Impossibile caricare gli amministratori. Riprova."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setResult("");
    try {
      const saved = await addAdministrator({ data: { token: await getToken(), email: email.trim() } });
      setResult(saved.invited ? (saved.invitationSent ? `${saved.email} è stato abilitato. Email di invito inviata: potrà impostare la propria password dal link ricevuto.` : `${saved.email} è stato abilitato, ma l’email di invito non è stata inviata. Può richiedere un link da “Password dimenticata?” nella pagina di accesso.`) : `${saved.email} è abilitato come amministratore e può accedere con la propria password.`);
      setEmail("");
      await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Impossibile aggiungere l’amministratore."); }
    finally { setSaving(false); }
  }

  return <section className="max-w-2xl space-y-5" aria-labelledby="administrators-title">
    <div><h2 id="administrators-title" className="font-serif text-2xl font-bold text-brown">Amministratori</h2><p className="mt-2 text-sm text-muted-foreground">Gli amministratori possono consultare ordini e iscrizioni, gestire il catalogo e aggiungere altri amministratori.</p></div>
    <form onSubmit={add} className="space-y-4 rounded-xl border bg-card p-6">
      <h3 className="font-medium">Aggiungi un amministratore</h3>
      <Label htmlFor="admin-email">Email del nuovo amministratore</Label>
      <Input id="admin-email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={event => setEmail(event.target.value)} placeholder="nome@esempio.it" disabled={saving} />
      <p className="text-sm text-muted-foreground">Se la persona è già iscritta, abilitiamo il suo account. Se è nuova, creiamo l’account e inviamo un’email per impostare la password.</p>
      <Button type="submit" disabled={saving}>{saving ? "Aggiunta in corso…" : "Abilita amministratore"}</Button>
    </form>
    {result && <p role="status" className="rounded-xl border bg-card p-4 text-sm">{result}</p>}
    <div className="rounded-xl border bg-card p-6"><h3 className="mb-4 font-medium">Amministratori abilitati</h3>
      {loading ? <p role="status">Caricamento…</p> : error ? <div><p role="alert">{error}</p><Button className="mt-3" variant="outline" onClick={load}>Riprova</Button></div> : <ul className="space-y-3">{administrators.map(admin => <li key={admin.id} className="break-words border-b pb-3 last:border-0 last:pb-0">{admin.email}</li>)}</ul>}
    </div>
  </section>;
}
