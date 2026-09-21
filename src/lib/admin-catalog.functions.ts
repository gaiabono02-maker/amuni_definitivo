import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { catalogMutation } from "./admin-catalog.schema";

export const saveCatalogItem = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ token: z.string().min(1), id: z.string().uuid().optional(), item: catalogMutation }).parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { item, id } = data;
    const db = createClient<Database>(
      process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      { global: { headers: { Authorization: `Bearer ${data.token}` } }, auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: user, error: authError } = await db.auth.getUser(data.token);
    if (authError || !user.user) throw new Error("Sessione scaduta. Accedi di nuovo.");
    const { data: role, error: roleError } = await db.from("user_roles").select("role").eq("user_id", user.user.id).eq("role", "admin").maybeSingle();
    if (roleError || !role) throw new Error("Accesso riservato agli amministratori.");
    if (item.table === "aziende" && id) {
      const {data: old, error} = await db.from("aziende").select("nome, slug").eq("id",id).single();
      if (error) throw new Error("Azienda non trovata.");
      if (old.slug !== item.values.slug) throw new Error("L'indirizzo di una scheda esistente non può essere modificato.");
      if (old.nome !== item.values.nome) {
        const results = await Promise.all([
          db.from("prodotti").select("id", {head:true,count:"exact"}).eq("azienda",old.nome),
          db.from("richieste_interesse").select("id", {head:true,count:"exact"}).eq("azienda_slug",old.slug),
        ]);
        if (results.some(r=>r.error)) throw new Error("Impossibile verificare i collegamenti dell'azienda.");
        if (results.some(r=>(r.count ?? 0)>0)) throw new Error("Questa azienda ha prodotti o richieste collegati: conserva il nome per mantenere i collegamenti.");
      }
    }
    if (item.table === "prodotti") {
      const {data: company, error} = await db.from("aziende").select("id").eq("nome",item.values.azienda).limit(1).maybeSingle();
      if (error || !company) throw new Error("Seleziona un'azienda presente nel network.");
    }
    const query = (() => {
      switch(item.table) {
        case "aziende": return id ? db.from("aziende").update(item.values).eq("id",id) : db.from("aziende").insert(item.values);
        case "prodotti": return id ? db.from("prodotti").update(item.values).eq("id",id) : db.from("prodotti").insert(item.values);
        case "bundle": return id ? db.from("bundle").update(item.values).eq("id",id) : db.from("bundle").insert(item.values);
        case "prodotto_del_mese": return id ? db.from("prodotto_del_mese").update(item.values).eq("id",id) : db.from("prodotto_del_mese").insert(item.values);
      }
    })();
    const {data: saved, error} = await query.select("id").single();
    if (error) throw new Error(error.code === "23505" ? "Esiste già un'azienda con questo indirizzo." : "Salvataggio non riuscito. Riprova.");
    return {id:saved.id as string};
  });
