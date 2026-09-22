import { createServerFn } from "@tanstack/react-start";
import { customerRegistrationSchema } from "./customer-registration.schema";

export const registerCustomer = createServerFn({method: "POST"})
  .validator((input: unknown) => customerRegistrationSchema.parse(input))
  .handler(async ({data}) => {
    const {createClient} = await import("@supabase/supabase-js");
    const {registerCustomerAccount} = await import("./customer-registration.server");
    const client = createClient(
      process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      {auth: {persistSession: false, autoRefreshToken: false}},
    );
    return registerCustomerAccount(client, data);
  });
