import { registrationEmail } from "./registration-email.ts";
import { sendRegistrationConfirmation, type ApplicationDetails } from "./registration-email.server.ts";

export function applicationConfirmationText(nome: string) {
  return registrationEmail("azienda", nome).text;
}

export async function sendApplicationConfirmation(email: string, nome: string, details?: ApplicationDetails) {
  return sendRegistrationConfirmation("azienda", email, nome, details);
}
