import { z } from "zod";

const text = z.string().trim().max(5000);
const name = z.string().trim().min(1, "Inserisci il nome").max(150);
const url = z.union([z.null(), z.literal(""), z.string().url("Inserisci un URL completo").refine(v => /^https?:\/\//i.test(v), "Usa un indirizzo https://")]).transform(v => v || null);
const money = z.coerce.number().finite().min(0).max(1000000);
const order = z.coerce.number().int().min(0).max(100000);
export const companyFields = z.object({
  nome: name, slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa lettere minuscole, numeri e trattini per l'indirizzo"),
  descrizione: text, provincia: z.string().trim().max(80), comune: z.string().trim().max(100), settore: z.string().trim().max(100),
  certificazioni: z.array(z.string().trim().max(100)).max(30), logo_url: url, sito_web: url, instagram: url, facebook: url, pubblica: z.boolean(),
});
export const productFields = z.object({
  nome: name, azienda: name, provincia: z.string().trim().max(80), categoria: name,
  descrizione: text, prezzo: money, immagine_url: url, disponibile: z.boolean(), ordine: order,
});
export const bundleFields = z.object({
  nome: name, descrizione: text, prodotti_inclusi: z.array(z.string().trim().min(1).max(150)).min(1, "Indica almeno un prodotto").max(50),
  prezzo: money, prezzo_singoli: money, immagine_url: url, attivo: z.boolean(), ordine: order,
});
export const monthFields = z.object({
  prodotto_id: z.string().uuid("Seleziona un prodotto"), produttore_storia: text,
  sconto_percentuale: z.coerce.number().int().min(0).max(100), scadenza: z.string().datetime(), attivo: z.boolean(),
});
export const catalogMutation = z.discriminatedUnion("table", [
  z.object({table: z.literal("aziende"), values: companyFields}),
  z.object({table: z.literal("prodotti"), values: productFields}),
  z.object({table: z.literal("bundle"), values: bundleFields}),
  z.object({table: z.literal("prodotto_del_mese"), values: monthFields}),
]);
export type CatalogTable = z.infer<typeof catalogMutation>["table"];
