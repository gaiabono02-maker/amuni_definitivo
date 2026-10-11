import { z } from "zod";

export const richiestaSchema = z.object({
  nome_prodotto: z.string().trim().min(1, "Indica il prodotto").max(150),
  categoria: z.string().trim().max(80).optional(),
  email: z.string().trim().email("Inserisci un'email valida").max(255),
  note: z.string().trim().max(800).optional(),
});
