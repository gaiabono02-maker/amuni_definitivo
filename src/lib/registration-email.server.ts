import nodemailer from "nodemailer";
import { registrationEmail, type RegistrationKind } from "./registration-email.ts";

export async function sendRegistrationConfirmation(kind: RegistrationKind, email: string, nome: string) {
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
  const mailbox = "formamentisonlus@gmail.com";
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
    const result = await transport.sendMail({
      from: {name: "A.M.U.N.Ì. — Forma Mentis", address: validSmtp ? from : mailbox},
      to: [{name: nome, address: email}],
      replyTo: mailbox,
      ...registrationEmail(kind, nome),
      headers: {"Auto-Submitted": "auto-generated"},
    });
    return result.accepted.some(address => typeof address === "string" && address.toLowerCase() === email.toLowerCase());
  } catch {
    console.error("[registration-email] Delivery failed");
    return false;
  }
}
