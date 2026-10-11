import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Accesso amministratore — A.M.U.N.Ì." }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [confirm, setConfirm] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setPassword("");
        setConfirm("");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/admin/login`,
        });
        if (error) throw new Error("Impossibile inviare il link. Riprova tra qualche minuto.");
        setSent(true);
        return;
      }
      if (mode === "reset") {
        if (password !== confirm) throw new Error("Le password non coincidono.");
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Link scaduto. Richiedi un nuovo link di recupero.");
        const { data: role, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
        if (roleError || !role) throw new Error("Questo account non ha i permessi di amministratore.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error("Impossibile aggiornare la password. Richiedi un nuovo link e riprova.");
        toast.success("Password aggiornata.");
        navigate({ to: "/admin" });
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
            {mode === "login" ? "Accedi per vedere ordini, persone e aziende iscritte." : mode === "forgot" ? "Inserisci la tua email amministratore per ricevere il link di recupero." : "Scegli una nuova password di almeno 12 caratteri."}
          </p>
        </div>

        {sent ? <p className="text-sm" role="status">Se l’indirizzo è associato a un account, riceverai un’email con il link per impostare una nuova password. Controlla anche la cartella spam.</p> : <form onSubmit={handleSubmit} className="space-y-4">
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
        {mode !== "reset" && <Button variant="link" className="mt-3 w-full" disabled={loading} onClick={() => {setMode(mode === "login" ? "forgot" : "login"); setSent(false); setPassword("");}}>{mode === "login" ? "Password dimenticata?" : "Torna all’accesso"}</Button>}

        <p className="mt-5 text-center text-xs text-muted-foreground">Accesso riservato agli amministratori autorizzati.</p>
        <a href="/" className="mt-4 block text-center text-sm text-primary hover:underline">Torna al sito</a>
      </div>
    </div>
  );
}
