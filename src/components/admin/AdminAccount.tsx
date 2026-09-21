import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminAccount({email}:{email:string}) {
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [saving,setSaving]=useState(false);
  async function save(e:FormEvent) {
    e.preventDefault();
    if(password !== confirm){toast.error("Le password non coincidono.");return;}
    setSaving(true);
    try {const {error}=await supabase.auth.updateUser({password});if(error)throw error;setPassword("");setConfirm("");toast.success("Password aggiornata");}
    catch {toast.error("Impossibile aggiornare la password. Accedi di nuovo e riprova.");}
    finally{setSaving(false);}
  }
  return <section className="max-w-xl space-y-5"><div><h2 className="font-serif text-2xl font-bold text-brown">Il tuo account</h2><p className="mt-2 text-sm text-muted-foreground">Accesso amministratore: {email}</p></div><form onSubmit={save} className="space-y-4 rounded-xl border bg-card p-6"><h3 className="font-medium">Cambia password</h3><label className="block text-sm">Nuova password<Input className="mt-1" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/></label><p className="text-xs text-muted-foreground">Usa almeno 12 caratteri.</p><label className="block text-sm">Conferma password<Input className="mt-1" type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><Button disabled={saving}>{saving ? "Salvataggio…":"Aggiorna password"}</Button></form></section>;
}
