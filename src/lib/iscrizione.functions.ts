import { createServerFn } from "@tanstack/react-start";
import { iscrizioneSchema } from "./iscrizione.schema";

export const submitApplication = createServerFn({ method: "POST" })
  .validator((data: unknown) => iscrizioneSchema.parse(data))
  .handler(async ({ data }) => {
    const { guardPublicForm } = await import("./public-form-guard.server");
    await guardPublicForm(data.website, data.email, "iscrizioni");
    const {website, ...application} = data;
    const { createClient } = await import("@supabase/supabase-js");
    const { sendApplicationConfirmation } = await import("./iscrizione-email.server");
    const supabase = createClient(
      process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.from("iscrizioni").insert({...application, email: application.email.toLowerCase()});
    if (error) throw new Error("Impossibile salvare la candidatura.");
    // A delivery failure must not invite a duplicate application.
    const emailSent = await sendApplicationConfirmation(application.email, application.nome, application);
    return { emailSent };
  });
