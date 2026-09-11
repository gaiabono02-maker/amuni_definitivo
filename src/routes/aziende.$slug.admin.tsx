import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Lock,
  Loader2,
  Mail,
  Phone,
  PhoneCall,
  Check,
  LogOut,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  companyLogin,
  fetchCompanyOrders,
  updateCompanyOrder,
  type OrdineAzienda,
} from "@/lib/azienda.functions";

export const Route = createFileRoute("/aziende/$slug/admin")({
  head: () => ({
    meta: [{ title: "Area Azienda – A.M.U.N.Ì." }],
  }),
  component: AdminAzienda,
});

type Stato = "da_contattare" | "in_trattativa" | "confermato";

const STATI: { value: Stato; label: string }[] = [
  { value: "da_contattare", label: "Da contattare" },
  { value: "in_trattativa", label: "In trattativa" },
  { value: "confermato", label: "Confermato" },
];

const statoStyle: Record<string, string> = {
  da_contattare: "bg-amber-100 text-amber-800",
  in_trattativa: "bg-blue-100 text-blue-800",
  confermato: "bg-emerald-100 text-emerald-800",
};

function storageKey(slug: string) {
  return `azienda-code:${slug}`;
}

function AdminAzienda() {
  const { slug } = Route.useParams();
  const loginFn = useServerFn(companyLogin);
  const fetchFn = useServerFn(fetchCompanyOrders);

  const [codice, setCodice] = useState("");
  const [authed, setAuthed] = useState(false);
  const [nome, setNome] = useState("");
  const [orders, setOrders] = useState<OrdineAzienda[]>([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  const loadOrders = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetchFn({ data: { slug, codice: code } });
      setNome(res.nome);
      setOrders(res.orders);
      setAuthed(true);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(storageKey(slug)) : null;
    if (saved) {
      setCodice(saved);
      loadOrders(saved).then((ok) => {
        if (!ok) sessionStorage.removeItem(storageKey(slug));
        setBooting(false);
      });
    } else {
      setBooting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!codice.trim()) return;
    setLoading(true);
    try {
      const res = await loginFn({ data: { slug, codice: codice.trim() } });
      if (!res.ok) {
        toast.error("Codice di accesso non valido");
        setLoading(false);
        return;
      }
      sessionStorage.setItem(storageKey(slug), codice.trim());
      await loadOrders(codice.trim());
    } catch {
      toast.error("Errore di accesso");
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(storageKey(slug));
    setAuthed(false);
    setOrders([]);
    setCodice("");
  };

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-5">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-5 text-center font-serif text-2xl font-bold">Area Azienda</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Inserisci il codice di accesso della tua azienda per gestire le richieste.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Input
              value={codice}
              onChange={(e) => setCodice(e.target.value)}
              placeholder="AMUNI-XXXXXX"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifica..." : "Accedi"}
            </Button>
          </form>
          <Link
            to="/aziende/$slug"
            params={{ slug }}
            className="mt-5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Torna alla pagina azienda
          </Link>
        </div>
      </div>
    );
  }

  const counts = {
    da_contattare: orders.filter((o) => o.stato === "da_contattare").length,
    in_trattativa: orders.filter((o) => o.stato === "in_trattativa").length,
    confermato: orders.filter((o) => o.stato === "confermato").length,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Area Azienda</p>
            <h1 className="font-serif text-xl font-bold">{nome}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/aziende/$slug"
              params={{ slug }}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Pagina pubblica
            </Link>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" /> Esci
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="grid grid-cols-3 gap-4">
          {STATI.map((s) => (
            <div key={s.value} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-serif text-3xl font-bold">{counts[s.value]}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-lg font-bold">Richieste dei clienti</h2>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Caricamento…
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            <Package className="mx-auto h-8 w-8 opacity-40" />
            <p className="mt-3">Nessuna richiesta al momento.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                slug={slug}
                codice={codice}
                onUpdated={(u) =>
                  setOrders((prev) => prev.map((x) => (x.id === u.id ? u : x)))
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function OrderCard({
  order,
  slug,
  codice,
  onUpdated,
}: {
  order: OrdineAzienda;
  slug: string;
  codice: string;
  onUpdated: (o: OrdineAzienda) => void;
}) {
  const updateFn = useServerFn(updateCompanyOrder);
  const [note, setNote] = useState(order.note_interne);
  const [savingNote, setSavingNote] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (
    payload: { stato?: Stato; note_interne?: string; contattato?: boolean },
    after?: () => void,
  ) => {
    try {
      const res = await updateFn({ data: { slug, codice, id: order.id, ...payload } });
      if (res.order) {
        onUpdated(res.order);
        setNote(res.order.note_interne);
      }
      after?.();
      return true;
    } catch {
      toast.error("Errore nell'aggiornamento");
      return false;
    }
  };

  const created = new Date(order.created_at).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {order.prodotto_nome}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statoStyle[order.stato] ?? ""}`}
            >
              {STATI.find((s) => s.value === order.stato)?.label ?? order.stato}
            </span>
          </div>
          <h3 className="mt-3 font-serif text-lg font-bold">{order.nome_cliente}</h3>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <a href={`mailto:${order.email_cliente}`} className="inline-flex items-center gap-1.5 hover:text-primary">
              <Mail className="h-4 w-4" /> {order.email_cliente}
            </a>
            {order.telefono_cliente && (
              <a href={`tel:${order.telefono_cliente}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                <Phone className="h-4 w-4" /> {order.telefono_cliente}
              </a>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Ricevuta il {created}</p>
          {order.messaggio && (
            <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">{order.messaggio}</p>
          )}
        </div>

        <div className="w-44">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Stato</label>
          <Select
            value={order.stato}
            onValueChange={(v) => {
              setBusy(true);
              run({ stato: v as Stato }).then(() => setBusy(false));
            }}
            disabled={busy}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATI.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={order.contattato_il ? "secondary" : "outline"}
            size="sm"
            className="mt-3 w-full"
            onClick={() => run({ contattato: !order.contattato_il })}
          >
            {order.contattato_il ? (
              <>
                <Check className="h-4 w-4" /> Contattato
              </>
            ) : (
              <>
                <PhoneCall className="h-4 w-4" /> Segna contattato
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Note interne
        </label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Appunti interni sulla trattativa..."
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={savingNote || note === order.note_interne}
            onClick={() => {
              setSavingNote(true);
              run({ note_interne: note }, () => toast.success("Note salvate")).then(() =>
                setSavingNote(false),
              );
            }}
          >
            {savingNote ? "Salvataggio..." : "Salva note"}
          </Button>
        </div>
      </div>
    </div>
  );
}