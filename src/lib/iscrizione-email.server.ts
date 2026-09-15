import nodemailer from "nodemailer";

export function applicationConfirmationText(nome: string) {
  return `Ciao ${nome},

grazie per aver inviato la tua candidatura ad A.M.U.N.Ì.! L'abbiamo ricevuta e ti ricontatteremo a breve per conoscerti meglio e illustrarti i prossimi passi.

A.M.U.N.Ì., promosso da Associazione Forma Mentis OdV, mette in rete le imprese agricole siciliane per valorizzare i prodotti del territorio e creare nuove opportunità di collaborazione, partendo da Palermo e Agrigento.

A presto,
Il team A.M.U.N.Ì.

Questa email è stata inviata automaticamente. Non rispondere a questo indirizzo.
Per informazioni puoi scriverci a formamentisonlus@gmail.com.`;
}

export async function sendApplicationConfirmation(email: string, nome: string) {
  const { AMUNI_SMTP_HOST: host, AMUNI_SMTP_USER: user, AMUNI_SMTP_PASSWORD: pass, AMUNI_NOREPLY_EMAIL: from } = process.env;
  const port = Number(process.env.AMUNI_SMTP_PORT || 465);
  if (!host || !user || !pass || !from || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("[application-email] Missing or invalid SMTP configuration");
    return false;
  }
  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const result = await transport.sendMail({
      from: { name: "A.M.U.N.Ì. — No Reply", address: from },
      to: [{ name: nome, address: email }],
      subject: "Candidatura ricevuta — Ti ricontatteremo a breve | A.M.U.N.Ì.",
      text: applicationConfirmationText(nome),
      headers: { "Auto-Submitted": "auto-generated" },
    });
    return result.accepted.includes(email);
  } catch {
    console.error("[application-email] Confirmation delivery failed");
    return false;
  }
}
