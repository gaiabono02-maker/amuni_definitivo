import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { passwordRedirectUrl } from "@/lib/auth-redirect";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Accesso amministratore — A.M.U.N.Ì." }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: () => <AdminLogin />,
});

export function AdminLogin({ initialMode = "login", adminOnly = true }: { initialMode?: "login" | "forgot" | "reset"; adminOnly?: boolean }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "reset">(initialMode);
  const [confirm, setConfirm] = useState("");
  const [sent, setSent] = useState(false);
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    let active = true;
    setMode(initialMode);
    setSent(false);
    setPassword("");
    setConfirm("");
    setLinkError("");
    if (initialMode === "reset") {
      setLoading(true);
      void (async () => {
        try {
          const { data, error } = await supabase.auth.getUser();
          if (error || !data.user) throw new Error("Il link non è valido oppure è scaduto. Richiedi un nuovo link di recupero.");
          if (adminOnly) {
            const { data: role, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
            if (roleError || !role) throw new Error("Questo account non ha i permessi di amministratore.");
          }
        } catch (err) {
          if (active) setLinkError(err instanceof Error ? err.message : "Impossibile verificare il link. Riprova.");
        } finally {
          if (active) setLoading(false);
        }
      })();
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setPassword("");
        setConfirm("");
      }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [initialMode, adminOnly]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: passwordRedirectUrl(window.location.origin, adminOnly ? "admin" : "customer"),
        });
        if (error) throw new Error("Impossibile inviare il link. Riprova tra qualche minuto.");
        setSent(true);
        return;
      }
      if (mode === "reset") {
        if (password !== confirm) throw new Error("Le password non coincidono.");
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Link scaduto. Richiedi un nuovo link di recupero.");
        if (adminOnly) {
          const { data: role, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
          if (roleError || !role) throw new Error("Questo account non ha i permessi di amministratore.");
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error("Impossibile aggiornare la password. Richiedi un nuovo link e riprova.");
        toast.success("Password aggiornata.");
        navigate({ to: adminOnly ? "/admin" : "/profilo" });
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error("Email o password non corretti.");
      const { data: role, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id",data.user.id).eq("role","admin").maybeSingle();
      if (roleError || !role) {
        await supabase.auth.signOut();
        throw new Error("Questo account non ha i permessi di amministratore.");
      }
      navigate({ to: "/admin" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore. Riprova.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-depth px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-gold">
            <Leaf className="h-6 w-6" />
          </span>
          <h1 className="font-serif text-2xl font-bold text-brown">{mode === "login" ? "Area amministratore" : mode === "forgot" ? "Recupera password" : "Imposta nuova password"}</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Accedi per vedere ordini, persone e aziende iscritte." : mode === "forgot" ? "Inserisci l’email del tuo account per ricevere il link di recupero." : "Scegli una nuova password di almeno 12 caratteri."}
          </p>
        </div>

        {linkError ? <p className="text-sm" role="alert">{linkError}</p> : sent ? <p className="text-sm" role="status">Se l’indirizzo è associato a un account, riceverai un’email con il link per impostare una nuova password. Controlla anche la cartella spam.</p> : <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== "reset" && <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              autoComplete="username"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@esempio.it"
            />
          </div>}
          {mode !== "forgot" && <div className="space-y-1.5">
            <Label htmlFor="password">{mode === "reset" ? "Nuova password" : "Password"}</Label>
            <Input
              id="password"
              autoComplete={mode === "reset" ? "new-password" : "current-password"}
              type="password"
              required
              minLength={mode === "reset" ? 12 : 6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>}
          {mode === "reset" && <div className="space-y-1.5"><Label htmlFor="confirm">Conferma password</Label><Input id="confirm" type="password" autoComplete="new-password" required minLength={12} value={confirm} onChange={e => setConfirm(e.target.value)} /></div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Operazione in corso…" : mode === "login" ? "Accedi" : mode === "forgot" ? "Invia link di recupero" : "Salva password e accedi"}
          </Button>
        </form>}
        <Button variant="link" className="mt-3 w-full" disabled={loading} onClick={() => navigate({to: mode === "login" || linkError ? (adminOnly ? "/admin/recupera-password" : "/recupera-password") : (adminOnly ? "/admin/login" : "/profilo")})}>{linkError ? "Richiedi un nuovo link" : mode === "login" ? "Password dimenticata?" : "Torna all’accesso"}</Button>

        {adminOnly && <p className="mt-5 text-center text-xs text-muted-foreground">Accesso riservato agli amministratori autorizzati.</p>}
        <a href="/" className="mt-4 block text-center text-sm text-primary hover:underline">Torna al sito</a>
      </div>
    </div>
  );
}
