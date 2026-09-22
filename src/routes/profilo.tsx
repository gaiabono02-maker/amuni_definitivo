import { registerCustomer } from "@/lib/customer-registration.functions";
import { customerRegistrationSchema } from "@/lib/customer-registration.schema";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Leaf,
  LogOut,
  Loader2,
  User as UserIcon,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/profilo")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Il tuo profilo — A.M.U.N.Ì." },
      {
        name: "description",
        content:
          "Area personale A.M.U.N.Ì.: gestisci i tuoi dati, controlla il tuo piano da sostenitore e rivedi i tuoi ordini.",
      },
      { property: "og:title", content: "Il tuo profilo — A.M.U.N.Ì." },
      {
        property: "og:description",
        content:
          "Area personale dei sostenitori del network A.M.U.N.Ì.: dati, abbonamento e ordini.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfiloPage,
});

type Profilo = {
  nome: string;
  email: string;
  telefono: string;
  citta: string;
  provincia: string;
  indirizzo: string;
};

type Abbonamento = {
  id: string;
  piano: string;
  stato: string;
  prezzo: number;
  inizio: string | null;
  scadenza: string | null;
  note: string;
};

type Ordine = {
  id: string;
  totale: number;
  articoli: { nome: string; qty: number; prezzo: number }[];
  created_at: string;
};

const vuoto: Profilo = {
  nome: "",
  email: "",
  telefono: "",
  citta: "",
  provincia: "",
  indirizzo: "",
};

export const STATI_ABBONAMENTO: { value: string; label: string }[] = [
  { value: "in_attesa", label: "In attesa" },
  { value: "attivo", label: "Attivo" },
  { value: "scaduto", label: "Scaduto" },
  { value: "annullato", label: "Annullato" },
];

export const PIANI = [
  { value: "nessuno", label: "Nessun piano" },
  { value: "sostenitore", label: "Sostenitore — 45 € / 3 mesi" },
  { value: "ambasciatore", label: "Ambasciatore — 100 € / anno" },
];

const statoBadge = (stato: string) => {
  switch (stato) {
    case "attivo":
      return "bg-olive/15 text-olive";
    case "scaduto":
      return "bg-destructive/10 text-destructive";
    case "annullato":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-primary/10 text-primary";
  }
};

const fmtData = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }) : "—";

function ProfiloPage() {
  const [stato, setStato] = useState<"loading" | "anon" | "ready">("loading");
  const [profilo, setProfilo] = useState<Profilo>(vuoto);
  const [abbonamento, setAbbonamento] = useState<Abbonamento | null>(null);
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [saving, setSaving] = useState(false);

  // form accesso
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);

  const carica = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setStato("anon");
      return;
    }
    const [p, a] = await Promise.all([
      supabase.from("profili").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("abbonamenti")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    let riga = p.data;
    if (!riga) {
      const { data: creato } = await supabase
        .from("profili")
        .insert({ user_id: user.id, email: user.email ?? "" })
        .select()
        .maybeSingle();
      riga = creato;
    }

    setProfilo({
      nome: riga?.nome ?? "",
      email: riga?.email || user.email || "",
      telefono: riga?.telefono ?? "",
      citta: riga?.citta ?? "",
      provincia: riga?.provincia ?? "",
      indirizzo: riga?.indirizzo ?? "",
    });
    setAbbonamento((a.data as Abbonamento) ?? null);

    if (user.email) {
      const { data: ord } = await supabase
        .from("acquirenti")
        .select("id,totale,articoli,created_at")
        .eq("email", user.email)
        .order("created_at", { ascending: false });
      setOrdini((ord as Ordine[]) ?? []);
    }
    setStato("ready");
  }, []);

  useEffect(() => {
    carica();
  }, [carica]);

  const accedi = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStato("loading");
        await carica();
      } else {
        const parsed = customerRegistrationSchema.safeParse({email, password, nome});
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const result = await registerCustomer({data: parsed.data});
        setPassword("");
        setMode("login");
        if (result.session) {
          const {error: sessionError} = await supabase.auth.setSession(result.session);
          if (sessionError) {
            toast.success("Iscrizione ricevuta. Ora puoi accedere con la tua email e password.");
          } else {
            toast.success("Grazie per esserti iscritto ad A.M.U.N.Ì.!");
            await carica();
          }
        } else {
          toast.success("Richiesta ricevuta. Controlla la tua email per confermare l’account; se sei già iscritto, puoi accedere.");
        }
        if (result.emailSent === false) {
          toast.info("La tua iscrizione è stata salvata, ma non siamo riusciti a inviare la mail di benvenuto. Non occorre ripetere l’iscrizione.");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore. Riprova.");
    } finally {
      setBusy(false);
    }
  };

  const esci = async () => {
    await supabase.auth.signOut();
    setStato("anon");
    setProfilo(vuoto);
    setAbbonamento(null);
    setOrdini([]);
  };

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;
    const { error } = await supabase
      .from("profili")
      .update({
        nome: profilo.nome,
        telefono: profilo.telefono,
        citta: profilo.citta,
        provincia: profilo.provincia,
        indirizzo: profilo.indirizzo,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Impossibile salvare i dati.");
      return;
    }
    toast.success("Profilo aggiornato.");
  };

  if (stato === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-brown">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (stato === "anon") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-6 w-6" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-brown">Area Sostenitori</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Accedi per vedere il tuo piano e i tuoi dati."
                : "Registrati per seguire il tuo abbonamento."}
            </p>
          </div>
          <form onSubmit={accedi} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="p-nome">Nome e cognome</Label>
                <Input id="p-nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="p-email">Email</Label>
              <Input
                id="p-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.it"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-pass">Password</Label>
              <Input
                id="p-pass"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Attendere..." : mode === "login" ? "Accedi" : "Crea account"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
            className="mt-5 w-full text-center text-sm text-primary hover:underline"
          >
            {mode === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
          </button>
        </div>
      </div>
    );
  }

  const pianoLabel =
    PIANI.find((p) => p.value === (abbonamento?.piano ?? "nessuno"))?.label ?? abbonamento?.piano;

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="/#hero" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-serif text-lg font-bold text-brown">Il tuo profilo</span>
          </a>
          <Button variant="outline" size="sm" onClick={esci}>
            <LogOut className="h-4 w-4" /> Esci
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8 lg:px-8">
        {/* Abbonamento */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Abbonamento</h2>
          </div>
          {abbonamento ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Piano</p>
                <p className="font-serif text-xl font-bold text-brown">{pianoLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stato</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statoBadge(abbonamento.stato)}`}
                >
                  {STATI_ABBONAMENTO.find((s) => s.value === abbonamento.stato)?.label ??
                    abbonamento.stato}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attivo dal</p>
                <p className="text-brown">{fmtData(abbonamento.inizio)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rinnovo / scadenza</p>
                <p className="text-brown">{fmtData(abbonamento.scadenza)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Quota</p>
                <p className="font-semibold text-primary">
                  €{Number(abbonamento.prezzo).toFixed(2).replace(".", ",")}
                </p>
              </div>
              {abbonamento.note && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Note</p>
                  <p className="text-sm text-brown">{abbonamento.note}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                Non hai ancora un piano da sostenitore attivo.
              </p>
              <Button asChild>
                <a href="/#sostenitori">Scopri i piani</a>
              </Button>
            </div>
          )}
        </section>

        {/* Dati personali */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <UserIcon className="h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">I tuoi dati</h2>
          </div>
          <form onSubmit={salva} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="f-nome">Nome e cognome</Label>
              <Input
                id="f-nome"
                value={profilo.nome}
                onChange={(e) => setProfilo({ ...profilo, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-email">Email</Label>
              <Input id="f-email" value={profilo.email} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-tel">Telefono</Label>
              <Input
                id="f-tel"
                value={profilo.telefono}
                onChange={(e) => setProfilo({ ...profilo, telefono: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-citta">Città</Label>
              <Input
                id="f-citta"
                value={profilo.citta}
                onChange={(e) => setProfilo({ ...profilo, citta: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-prov">Provincia</Label>
              <Input
                id="f-prov"
                value={profilo.provincia}
                onChange={(e) => setProfilo({ ...profilo, provincia: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="f-ind">Indirizzo di spedizione</Label>
              <Textarea
                id="f-ind"
                rows={2}
                value={profilo.indirizzo}
                onChange={(e) => setProfilo({ ...profilo, indirizzo: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvataggio..." : "Salva modifiche"}
              </Button>
            </div>
          </form>
        </section>

        {/* Ordini */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <ShoppingBag className="h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">I tuoi ordini</h2>
          </div>
          {ordini.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun ordine registrato con questa email.</p>
          ) : (
            <ul className="space-y-3">
              {ordini.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-brown">
                      {Array.isArray(o.articoli) && o.articoli.length > 0
                        ? o.articoli.map((a) => `${a.nome} ×${a.qty}`).join(", ")
                        : "Ordine"}
                    </p>
                    <p className="text-xs text-muted-foreground">{fmtData(o.created_at)}</p>
                  </div>
                  <span className="font-semibold text-primary">
                    €{Number(o.totale).toFixed(2).replace(".", ",")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
