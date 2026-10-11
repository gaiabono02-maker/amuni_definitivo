import { createServerFn } from "@tanstack/react-start";
import { richiestaSchema } from "./richiesta.schema";

export const submitProductRequest = createServerFn({ method: "POST" })
  .validator((data: unknown) => richiestaSchema.parse(data))
  .handler(async ({ data }) => {
    const { guardPublicForm } = await import("./public-form-guard.server");
    await guardPublicForm(data.website, data.email, "richieste_prodotti");
    const { createClient } = await import("@supabase/supabase-js");
    const { sendProductRequestEmails } = await import("./richiesta-email.server");
    const supabase = createClient(
      process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const id = crypto.randomUUID();
    const { error } = await supabase.from("richieste_prodotti").insert({
      id,
      nome_prodotto: data.nome_prodotto,
      categoria: data.categoria || "Altro",
      email: data.email.toLowerCase(),
      note: data.note || "",
    });
    if (error) throw new Error("Impossibile salvare la richiesta. Riprova più tardi.");
    // An email failure must not turn a saved request into a failed submission.
    const { emailSent, notificationSent } = await sendProductRequestEmails(data, id);
    if (!notificationSent) console.error("[request-email] Team notification failed for request", id);
    return { emailSent };
  });
