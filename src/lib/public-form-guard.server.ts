import { createHmac } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

const buckets = new Map<string, { count: number; expires: number }>();
const windowMs = 10 * 60 * 1000;

export function checkFormTrap(website: string) {
  if (website.trim()) throw new Error("Invio non riuscito. Ricarica la pagina e riprova.");
}

export function consumeFormLimit(key: string, now = Date.now(), limit = 8) {
  for (const [id, bucket] of buckets) if (bucket.expires <= now) buckets.delete(id);
  const bucket = buckets.get(key);
  if (bucket && bucket.expires > now) {
    if (bucket.count >= limit) throw new Error("Hai inviato diverse richieste in poco tempo. Attendi qualche minuto e riprova.");
    bucket.count++;
  } else {
    // Keep memory bounded if the service receives many different addresses.
    if (buckets.size >= 5000) throw new Error("Sono in corso molte richieste. Riprova tra qualche minuto.");
    buckets.set(key, { count: 1, expires: now + windowMs });
  }
}

export async function guardPublicForm(
  website: string, email: string,
  table: "iscrizioni" | "richieste_prodotti" | "richieste_interesse" | "acquirenti" | "profili",
) {
  checkFormTrap(website);
  const headers = getRequest().headers;
  // Vercel supplies this header; no IP addresses are stored in the database.
  const ip = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_URL;
  if (!secret || !url) throw new Error("Servizio temporaneamente non disponibile.");
  const hash = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
  consumeFormLimit(`ip:${hash(ip)}`);
  consumeFormLimit(`email:${hash(email.toLowerCase())}`, Date.now(), 3);
  // Recent submissions survive process restarts. The IP bucket is supplementary.
  const db = createClient(url, secret, {auth: {persistSession: false, autoRefreshToken: false}});
  const column = table === "richieste_interesse" ? "email_cliente" : "email";
  const escapedEmail = email.replace(/[\\%_]/g, character => `\\${character}`);
  const {count, error} = await db.from(table).select("id", {head: true, count: "exact"}).ilike(column, escapedEmail).gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if (error) throw new Error("Impossibile verificare l’invio. Riprova tra qualche minuto.");
  if ((count ?? 0) >= 3) throw new Error("Hai già inviato diverse richieste. Riprova più tardi.");
}
