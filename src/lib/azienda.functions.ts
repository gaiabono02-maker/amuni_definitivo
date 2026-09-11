import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type OrdineAzienda = {
  id: string;
  azienda: string;
  azienda_slug: string;
  prodotto_id: string | null;
  prodotto_nome: string;
  nome_cliente: string;
  email_cliente: string;
  telefono_cliente: string | null;
  messaggio: string;
  stato: string;
  note_interne: string;
  contattato_il: string | null;
  created_at: string;
};

const accessSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  codice: z.string().trim().min(1).max(60),
});

async function verifyAccess(slug: string, codice: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("aziende")
    .select("nome, slug, codice_accesso")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error("Errore di accesso");
  if (!data || !data.codice_accesso || data.codice_accesso.trim().toUpperCase() !== codice.trim().toUpperCase()) {
    return null;
  }
  return { nome: data.nome as string, supabaseAdmin };
}

export const companyLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => accessSchema.parse(data))
  .handler(async ({ data }) => {
    const access = await verifyAccess(data.slug, data.codice);
    if (!access) return { ok: false as const };
    return { ok: true as const, nome: access.nome };
  });

export const fetchCompanyOrders = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => accessSchema.parse(data))
  .handler(async ({ data }) => {
    const access = await verifyAccess(data.slug, data.codice);
    if (!access) throw new Error("Codice di accesso non valido");
    const { data: orders, error } = await access.supabaseAdmin
      .from("richieste_interesse")
      .select("*")
      .eq("azienda_slug", data.slug)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Errore nel caricamento delle richieste");
    return { nome: access.nome, orders: (orders ?? []) as OrdineAzienda[] };
  });

const updateSchema = accessSchema.extend({
  id: z.string().uuid(),
  stato: z.enum(["da_contattare", "in_trattativa", "confermato"]).optional(),
  note_interne: z.string().trim().max(2000).optional(),
  contattato: z.boolean().optional(),
});

export const updateCompanyOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data }) => {
    const access = await verifyAccess(data.slug, data.codice);
    if (!access) throw new Error("Codice di accesso non valido");
    const patch: {
      stato?: string;
      note_interne?: string;
      contattato_il?: string | null;
    } = {};
    if (data.stato !== undefined) patch.stato = data.stato;
    if (data.note_interne !== undefined) patch.note_interne = data.note_interne;
    if (data.contattato !== undefined) {
      patch.contattato_il = data.contattato ? new Date().toISOString() : null;
    }
    const { data: updated, error } = await access.supabaseAdmin
      .from("richieste_interesse")
      .update(patch)
      .eq("id", data.id)
      .eq("azienda_slug", data.slug)
      .select("*")
      .maybeSingle();
    if (error) throw new Error("Errore nell'aggiornamento");
    return { order: updated as OrdineAzienda | null };
  });