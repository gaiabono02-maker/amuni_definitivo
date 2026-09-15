import { z } from "zod";

export const iscrizioneSchema = z.object({
  nome: z.string().trim().min(1, "Inserisci il tuo nome").max(100),
  azienda: z.string().trim().min(1, "Inserisci il nome dell'azienda").max(150),
  settore: z.string().trim().max(100).optional(),
  provincia: z.string().trim().max(50).optional(),
  email: z.string().trim().email("Inserisci un'email valida").max(255),
  messaggio: z.string().trim().max(1000).optional(),
});
