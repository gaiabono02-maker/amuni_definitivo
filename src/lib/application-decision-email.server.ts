import nodemailer from "nodemailer";

export type ApplicationDecision = "approvata" | "rifiutata";
export type DecisionRecipient = { nome: string; azienda: string; email: string };

export function applicationDecisionEmail(recipient: DecisionRecipient, decision: ApplicationDecision) {
  const greeting = `Ciao ${recipient.nome},`;
  const outcome = decision === "approvata"
    ? `siamo felici di comunicarti che la candidatura di ${recipient.azienda} al progetto A.M.U.N.Ì. è stata approvata.\n\nTi contatteremo per concordare i prossimi passi e completare l’inserimento della tua azienda nella rete.`
    : `grazie per aver candidato ${recipient.azienda} al progetto A.M.U.N.Ì.\n\nDopo aver valutato la candidatura, ti comunichiamo che in questa fase non possiamo accogliere la richiesta di adesione. Ti ringraziamo per l’interesse e per il tempo dedicato al progetto.`;
  return {
    subject: decision === "approvata" ? "Candidatura approvata — A.M.U.N.Ì." : "Esito della candidatura — A.M.U.N.Ì.",
    text: `${greeting}\n\n${outcome}\n\nPer informazioni o chiarimenti puoi rispondere direttamente a questa email.\n\nIl team A.M.U.N.Ì.\nForma Mentis\namunirichieste@gmail.com`,
  };
}

export async function sendApplicationDecisionEmail(recipient: DecisionRecipient, decision: ApplicationDecision) {
  const host = process.env.AMUNI_SMTP_HOST;
  const user = process.env.AMUNI_SMTP_USER;
  const pass = process.env.AMUNI_SMTP_PASSWORD;
  const from = process.env.AMUNI_NOREPLY_EMAIL;
  const port = Number(process.env.AMUNI_SMTP_PORT || 465);
  const gmailPassword = process.env.AMUNI_GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  const smtp = host && user && pass && from && Number.isInteger(port) && port > 0 && port <= 65535;
  if ((!smtp && (host || user || pass || from)) || (!smtp && !gmailPassword)) return false;
  const mailbox = "amunirichieste@gmail.com";
  try {
    const transport = nodemailer.createTransport({
      ...(smtp ? { host, port, secure: port === 465, requireTLS: port !== 465, auth: { user, pass } } : { service: "gmail", auth: { user: mailbox, pass: gmailPassword } }),
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      disableFileAccess: true, disableUrlAccess: true,
    });
    const result = await transport.sendMail({
      from: { name: "A.M.U.N.Ì. — Forma Mentis", address: smtp ? from : mailbox },
      to: [{ name: recipient.nome, address: recipient.email }],
      replyTo: mailbox,
      ...applicationDecisionEmail(recipient, decision),
      headers: { "Auto-Submitted": "auto-generated" },
    });
    return result.accepted.some(address => typeof address === "string" && address.toLowerCase() === recipient.email.toLowerCase());
  } catch {
    console.error("[application-decision-email] Email delivery failed");
    return false;
  }
}
