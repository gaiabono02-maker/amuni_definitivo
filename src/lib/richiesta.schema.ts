import { z } from "zod";
import { publicFormFields } from "./public-form.schema.ts";

export const richiestaSchema = z.object({
  ...publicFormFields,
  nome_prodotto: z.string().trim().min(1, "Indica il prodotto").max(150),
  categoria: z.string().trim().max(80).optional(),
  email: z.string().trim().email("Inserisci un'email valida").max(255),
  note: z.string().trim().max(800).optional(),
});
