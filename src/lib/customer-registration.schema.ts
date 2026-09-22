import { z } from "zod";

export const customerRegistrationSchema = z.object({
  nome: z.string().trim().min(1, "Inserisci nome e cognome").max(100),
  email: z.string().trim().email("Inserisci un’email valida").max(255),
  password: z.string().min(6, "La password deve contenere almeno 6 caratteri").max(128),
});
