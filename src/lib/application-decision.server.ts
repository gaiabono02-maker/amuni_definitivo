import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sendApplicationDecisionEmail, type ApplicationDecision, type DecisionRecipient } from "./application-decision-email.server.ts";

type ApplicationStatus = ApplicationDecision | "in_attesa";
type Input = { id: string; stato: ApplicationStatus; retryEmail: boolean };

// Caller authorization is checked by the server function before entering here.
export async function saveApplicationDecision(
  db: SupabaseClient<Database>, input: Input,
  send: (recipient: DecisionRecipient, decision: ApplicationDecision) => Promise<boolean> = sendApplicationDecisionEmail,
) {
  const { data: application, error: readError } = await db.from("iscrizioni").select("id,nome,azienda,email,stato").eq("id", input.id).single();
  if (readError || !application) throw new Error("Candidatura non trovata.");
  const changed = application.stato !== input.stato;
  if (input.retryEmail && (changed || input.stato === "in_attesa")) throw new Error("Lo stato è cambiato. Aggiorna i dati prima di riprovare l’email.");
  if (changed) {
    const { data: saved, error } = await db.from("iscrizioni").update({ stato: input.stato }).eq("id", input.id).eq("stato", application.stato).select("id").maybeSingle();
    if (error) throw new Error("Impossibile aggiornare lo stato della candidatura.");
    if (!saved) throw new Error("Un altro amministratore ha modificato questa candidatura. Aggiorna i dati.");
  }
  const emailAttempted = input.stato !== "in_attesa" && (changed || input.retryEmail);
  let emailSent = false;
  if (emailAttempted) {
    try { emailSent = await send(application, input.stato as ApplicationDecision); }
    catch { emailSent = false; }
  }
  // Delivery failure never undoes a decision that was already saved.
  return { stato: input.stato, changed, emailAttempted, emailSent };
}
