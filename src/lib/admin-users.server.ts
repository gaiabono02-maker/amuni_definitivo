import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { passwordRedirectUrl } from "./auth-redirect.ts";

export async function authorizeAdministrator(token: string) {
  const url = process.env.SUPABASE_URL;
  const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publicKey) throw new Error("Servizio amministratori non configurato.");
  const client = createClient<Database>(url, publicKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await verifyAdministrator(client, token);
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Servizio amministratori non configurato.");
  return createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function verifyAdministrator(client: SupabaseClient<Database>, token: string) {
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Sessione scaduta. Accedi di nuovo.");
  const { data: role, error: roleError } = await client.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  if (roleError || !role) throw new Error("Accesso riservato agli amministratori.");
}

export async function grantAdministrator(db: SupabaseClient<Database>, email: string) {
  let existing;
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Impossibile cercare l’account.");
    existing = data.users.find(user => user.email?.toLowerCase() === email);
    if (existing || data.users.length < 1000) break;
  }
  let invitationLink: string | undefined;
  if (!existing) {
    const { data, error } = await db.auth.admin.generateLink({
      type: "invite", email, options: { redirectTo: passwordRedirectUrl("https://amuni-sicilia.vercel.app") },
    });
    if (error || !data.user) throw new Error("Impossibile creare l’account. Riprova.");
    existing = data.user;
    invitationLink = data.properties.action_link;
  }
  const { error } = await db.from("user_roles").upsert({ user_id: existing.id, role: "admin" }, { onConflict: "user_id,role" });
  if (error) throw new Error("Impossibile abilitare l’amministratore.");
  return { email, invitationLink };
}

export async function sendAdministratorInvite(email: string, link: string) {
  const { default: nodemailer } = await import("nodemailer");
  const host = process.env.AMUNI_SMTP_HOST;
  const user = process.env.AMUNI_SMTP_USER;
  const pass = process.env.AMUNI_SMTP_PASSWORD;
  const from = process.env.AMUNI_NOREPLY_EMAIL;
  const port = Number(process.env.AMUNI_SMTP_PORT || 465);
  const gmailPassword = process.env.AMUNI_GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  const smtp = host && user && pass && from && Number.isInteger(port) && port > 0 && port <= 65535;
  if ((!smtp && (host || user || pass || from)) || (!smtp && !gmailPassword)) return false;
  try {
    const transport = nodemailer.createTransport({
      ...(smtp ? { host, port, secure: port === 465, requireTLS: port !== 465, auth: { user, pass } } : { service: "gmail", auth: { user: "amunirichieste@gmail.com", pass: gmailPassword } }),
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      disableFileAccess: true, disableUrlAccess: true,
    });
    const result = await transport.sendMail({
      from: { name: "A.M.U.N.Ì.", address: smtp ? from : "amunirichieste@gmail.com" },
      to: email, replyTo: "amunirichieste@gmail.com",
      subject: "Invito al pannello amministratore A.M.U.N.Ì.",
      text: `Sei stato abilitato come amministratore di A.M.U.N.Ì.\n\nApri questo link per impostare la tua password:\n${link}\n\nPotrai consultare ordini, persone e aziende iscritte.\nIl link è personale: non condividerlo. Se è scaduto, richiedi una nuova password da https://amuni-sicilia.vercel.app/admin/recupera-password.`,
      headers: { "Auto-Submitted": "auto-generated" },
    });
    return result.accepted.some(address => typeof address === "string" && address.toLowerCase() === email);
  } catch {
    // Never log invitation URLs or auth tokens.
    console.error("[admin-invite] Email delivery failed");
    return false;
  }
}
