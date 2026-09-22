import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { customerRegistrationSchema } from "./customer-registration.schema.ts";
import { sendRegistrationConfirmation } from "./registration-email.server.ts";

type Registration = z.infer<typeof customerRegistrationSchema>;

export async function registerCustomerAccount(
  client: Pick<SupabaseClient, "auth">,
  input: Registration,
  send = sendRegistrationConfirmation,
) {
  const startedAt = Date.now();
  const {data, error} = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {nome: input.nome},
      emailRedirectTo: "https://amuni-definitivo.vercel.app/profilo",
    },
  });
  if (error) throw new Error("Impossibile completare l’iscrizione. Controlla i dati, oppure accedi se hai già un account.");
  // Existing/obfuscated accounts must not trigger unsolicited welcome messages.
  const isNew = Boolean(data.user?.identities?.length) &&
    Date.parse(data.user!.created_at) >= startedAt - 1000;
  let emailSent: boolean | null = null;
  if (isNew) {
    try {
      emailSent = await send("cliente", data.user!.email || input.email, input.nome);
    } catch {
      // The account already exists: an email failure must not invite another signup.
      emailSent = false;
    }
  }
  return {
    session: data.session ? {access_token: data.session.access_token, refresh_token: data.session.refresh_token} : null,
    confirmationRequired: !data.session,
    emailSent,
  };
}
