import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicFormFields } from "./public-form.schema";

const contact = { ...publicFormFields, nome: z.string().trim().min(1).max(100), email: z.string().trim().email().max(255) };

export const submitProductInterest = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({
    ...publicFormFields, prodotto_id: z.string().uuid(),
    nome_cliente: z.string().trim().min(1).max(100), email_cliente: z.string().trim().email().max(255),
    telefono_cliente: z.string().trim().max(40).optional(), messaggio: z.string().trim().max(1000).optional(),
  }).parse(input))
  .handler(async ({data}) => {
    const {guardPublicForm} = await import("./public-form-guard.server");
    await guardPublicForm(data.website, data.email_cliente, "richieste_interesse");
    const {supabaseAdmin: db} = await import("@/integrations/supabase/client.server");
    const {data: product, error: productError} = await db.from("prodotti").select("id,nome,azienda").eq("id", data.prodotto_id).eq("disponibile", true).single();
    if (productError || !product) throw new Error("Il prodotto non è più disponibile.");
    const {data: company, error: companyError} = await db.from("aziende").select("nome,slug").eq("nome", product.azienda).eq("pubblica", true).single();
    if (companyError || !company) throw new Error("L’impresa non è al momento disponibile.");
    const {error} = await db.from("richieste_interesse").insert({
      azienda: company.nome, azienda_slug: company.slug, prodotto_id: product.id, prodotto_nome: product.nome,
      nome_cliente: data.nome_cliente, email_cliente: data.email_cliente.toLowerCase(), telefono_cliente: data.telefono_cliente || null, messaggio: data.messaggio || "",
    });
    if (error) throw new Error("Impossibile salvare la richiesta. Riprova più tardi.");
    return {saved: true};
  });

export const submitCartRequest = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ ...contact, items: z.array(z.object({id: z.string().uuid(), qty: z.number().int().min(1).max(99)})).min(1).max(50) }).parse(input))
  .handler(async ({data}) => {
    const {guardPublicForm} = await import("./public-form-guard.server");
    await guardPublicForm(data.website, data.email, "acquirenti");
    const {supabaseAdmin: db} = await import("@/integrations/supabase/client.server");
    const ids = [...new Set(data.items.map(item => item.id))];
    const {data: products, error} = await db.from("prodotti").select("id,nome,azienda,prezzo").in("id", ids).eq("disponibile", true);
    if (error || products.length !== ids.length) throw new Error("Alcuni prodotti non sono più disponibili. Aggiorna il carrello.");
    const {data: companies, error: companyError} = await db.from("aziende").select("nome").in("nome", [...new Set(products.map(product => product.azienda))]).eq("pubblica", true);
    if (companyError || products.some(product => !companies.some(company => company.nome === product.azienda))) throw new Error("Alcune imprese non sono più disponibili.");
    const articoli = data.items.map(item => {const product = products.find(product => product.id === item.id)!; return {nome: product.nome, qty: item.qty, prezzo: Number(product.prezzo)};});
    const totale = Math.round(articoli.reduce((total, item) => total + item.qty * Math.round(item.prezzo * 100), 0)) / 100;
    const {error: writeError} = await db.from("acquirenti").insert({nome: data.nome, email: data.email.toLowerCase(), articoli, totale});
    if (writeError) throw new Error("Impossibile salvare la richiesta d’ordine.");
    return {saved: true};
  });
