import { createServerFn } from "@tanstack/react-start";
import { iscrizioneSchema } from "./iscrizione.schema";

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => iscrizioneSchema.parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { sendApplicationConfirmation } = await import("./iscrizione-email.server");
    const supabase = createClient(
      process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.from("iscrizioni").insert(data);
    if (error) throw new Error("Impossibile salvare la candidatura.");
    // A delivery failure must not invite a duplicate application.
    const emailSent = await sendApplicationConfirmation(data.email, data.nome);
    return { emailSent };
  });
