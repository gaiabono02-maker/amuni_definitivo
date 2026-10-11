import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import type { z } from "zod";
import type { richiestaSchema } from "./richiesta.schema.ts";

const mailbox = "amunirichieste@gmail.com";

export const confirmationSubject = "Abbiamo ricevuto la tua richiesta — A.M.U.N.Ì.";

export const confirmationText = `Ciao,

grazie per averci scritto! Abbiamo ricevuto la tua richiesta e ti ricontatteremo a breve per aiutarti a trovare ciò che cerchi tra le imprese della nostra rete.

A.M.U.N.Ì., promosso da Associazione Forma Mentis OdV, nasce per unire le imprese agricole siciliane e valorizzare i prodotti del territorio, partendo da Palermo e Agrigento.

Per aggiungere qualche dettaglio alla tua richiesta, puoi rispondere direttamente a questa email.

A presto,
Il team A.M.U.N.Ì.
Associazione Forma Mentis OdV
amunirichieste@gmail.com`;

async function sendRequestEmail(email: string, message: SendMailOptions) {
  const password = process.env.AMUNI_GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!password) {
    console.error("[request-email] Missing AMUNI_GMAIL_APP_PASSWORD");
    return false;
  }
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: mailbox, pass: password },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const result = await transport.sendMail({
      from: { name: "A.M.U.N.Ì. — Forma Mentis", address: mailbox },
      to: [{ address: email, name: "" }],
      replyTo: mailbox,
      headers: { "Auto-Submitted": "auto-generated" },
      ...message,
    });
    if (!result.accepted.some(address => typeof address === "string" && address.toLowerCase() === email.toLowerCase())) {
      console.error("[request-email] Gmail did not accept recipient");
      return false;
    }
    return true;
  } catch (error) {
    // Record only diagnostic codes, never credentials or SMTP message contents.
    const failure = error as { code?: unknown; responseCode?: unknown } | null;
    const code = typeof failure?.code === "string" && /^[A-Z_]{2,30}$/.test(failure.code)
      ? failure.code : "UNKNOWN";
    const responseCode = typeof failure?.responseCode === "number" ? failure.responseCode : null;
    console.error("[request-email] Gmail send failed", { code, responseCode });
    return false;
  }
}

export async function sendRequestConfirmation(email: string, requestId: string) {
  return sendRequestEmail(email, {
    messageId: `<product-request.${requestId}@gmail.com>`,
    subject: confirmationSubject,
    text: confirmationText,
  });
}

export async function sendProductRequestEmails(data: z.infer<typeof richiestaSchema>, requestId: string) {
  // Attempt both deliveries independently: a failure must not suppress the other
  // message or turn an already saved request into a failed submission.
  const [notificationSent, emailSent] = await Promise.all([
    sendRequestEmail(mailbox, {
      replyTo: { address: data.email, name: "" },
      messageId: `<product-request-team.${requestId}@gmail.com>`,
      subject: "Nuova richiesta prodotto — A.M.U.N.Ì.",
      text: `È arrivata una nuova richiesta dal sito A.M.U.N.Ì.

Prodotto: ${data.nome_prodotto}
Categoria: ${data.categoria || "Altro"}
Email del cliente: ${data.email}
Note: ${data.note || "Nessuna nota"}

Riferimento: ${requestId}

Puoi rispondere direttamente a questa email per contattare il cliente.
La richiesta è disponibile anche nel pannello amministratore del sito.`,
    }),
    sendRequestConfirmation(data.email, requestId),
  ]);
  return { notificationSent, emailSent };
}
