import nodemailer from "nodemailer";
import { registrationEmail, type RegistrationKind } from "./registration-email.ts";

export type ApplicationDetails = { azienda: string; settore?: string; provincia?: string; messaggio?: string };

export async function sendRegistrationConfirmation(kind: RegistrationKind, email: string, nome: string, details?: ApplicationDetails) {
  const host = process.env.AMUNI_SMTP_HOST;
  const user = process.env.AMUNI_SMTP_USER;
  const pass = process.env.AMUNI_SMTP_PASSWORD;
  const from = process.env.AMUNI_NOREPLY_EMAIL;
  const gmailPassword = process.env.AMUNI_GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  const port = Number(process.env.AMUNI_SMTP_PORT || 465);
  const validSmtp = host && user && pass && from && Number.isInteger(port) && port > 0 && port <= 65535;
  // A partially configured SMTP account must be corrected, rather than silently
  // switching the sender to a different mailbox.
  const partialSmtp = Boolean(host || user || pass || from);
  if (!validSmtp && (partialSmtp || !gmailPassword)) {
    console.error("[registration-email] Missing or invalid email configuration");
    return false;
  }
  const mailbox = "amunirichieste@gmail.com";
  try {
    const transport = nodemailer.createTransport({
      ...(validSmtp
        ? { host, port, secure: port === 465, requireTLS: port !== 465, auth: {user, pass} }
        : { service: "gmail", auth: {user: mailbox, pass: gmailPassword} }),
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const confirmation = transport.sendMail({
      from: {name: "A.M.U.N.Ì. — Forma Mentis", address: validSmtp ? from : mailbox},
      to: [{name: nome, address: email}],
      replyTo: mailbox,
      ...registrationEmail(kind, nome),
      headers: {"Auto-Submitted": "auto-generated"},
    }).then(result => result.accepted.some(address => typeof address === "string" && address.toLowerCase() === email.toLowerCase()))
      .catch(() => { console.error("[registration-email] Confirmation failed"); return false; });
    {
      // Only contact details are passed here; never include passwords or sessions.
      await transport.sendMail({
        from: {name: "A.M.U.N.Ì. — Forma Mentis", address: validSmtp ? from : mailbox},
        to: mailbox,
        replyTo: {name: nome, address: email},
        subject: kind === "azienda" ? "Nuova candidatura azienda — A.M.U.N.Ì." : "Nuovo profilo creato — A.M.U.N.Ì.",
        text: kind === "azienda"
          ? `È arrivata una candidatura aziendale dal sito A.M.U.N.Ì.\n\nAzienda: ${details?.azienda || "Non indicata"}\nReferente: ${nome}\nEmail: ${email}\nSettore: ${details?.settore || "Non indicato"}\nProvincia: ${details?.provincia || "Non indicata"}\nMessaggio: ${details?.messaggio || "Nessun messaggio"}\n\nLa candidatura è disponibile nel pannello amministratore per la valutazione. Puoi rispondere direttamente a questa email per contattare il referente.`
          : `È stato creato un nuovo profilo sul sito A.M.U.N.Ì.\n\nNome: ${nome}\nEmail: ${email}\n\nPuoi rispondere a questa email per contattare la persona. L'eventuale verifica dell'indirizzo email è gestita separatamente.`,
        headers: {"Auto-Submitted": "auto-generated"},
      }).then(result => {
        if (!result.accepted.some(address => typeof address === "string" && address.toLowerCase() === mailbox)) {
          console.error("[registration-email] Team notification rejected");
        }
      }).catch(() => { console.error("[registration-email] Team notification failed"); });
    }
    return await confirmation;
  } catch {
    console.error("[registration-email] Delivery failed");
    return false;
  }
}
