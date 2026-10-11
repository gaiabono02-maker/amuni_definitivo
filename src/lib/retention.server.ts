import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function retentionCutoff(now = new Date()) {
  const year = now.getUTCFullYear() - 1;
  const month = now.getUTCMonth();
  const day = Math.min(now.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
  return new Date(Date.UTC(year, month, day)).toISOString();
}

export async function purgeExpiredRequests(db: SupabaseClient<Database>, dryRun = false, now = new Date()) {
  const cutoff = retentionCutoff(now);
  const results: Record<string, number> = {};
  const queries = [
    { table: "iscrizioni" as const, states: ["in_attesa", "rifiutata"] },
    { table: "richieste_prodotti" as const },
    { table: "richieste_interesse" as const },
    { table: "acquirenti" as const },
  ];
  for (const rule of queries) {
    const query = dryRun ? db.from(rule.table).select("id", {head: true, count: "exact"}) : db.from(rule.table).delete({count: "exact"});
    const filtered = query.lt("created_at", cutoff);
    const {count, error} = await (rule.states ? filtered.in("stato", rule.states) : filtered);
    if (error) throw new Error(`Pulizia non completata per ${rule.table}.`);
    results[rule.table] = count ?? 0;
  }
  return {dryRun, cutoff, removed: results};
}
