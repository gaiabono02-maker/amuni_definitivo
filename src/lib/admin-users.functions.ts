import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentials = z.object({ token: z.string().min(1) });

export const listAdministrators = createServerFn({ method: "POST" })
  .validator((input: unknown) => credentials.parse(input))
  .handler(async ({ data }) => {
    const { authorizeAdministrator } = await import("./admin-users.server");
    const db = await authorizeAdministrator(data.token);
    const roles = [];
    for (let from = 0; ; from += 500) {
      const { data: rows, error } = await db.from("user_roles").select("user_id,created_at").eq("role", "admin").order("user_id").range(from, from + 499);
      if (error) throw new Error("Impossibile leggere gli amministratori.");
      roles.push(...rows);
      if (rows.length < 500) break;
    }
    return Promise.all(roles.map(async role => {
      const { data: user, error } = await db.auth.admin.getUserById(role.user_id);
      if (error) throw new Error("Impossibile leggere gli amministratori.");
      return { id: role.user_id, email: user.user.email || "", created_at: role.created_at };
    }));
  });

export const addAdministrator = createServerFn({ method: "POST" })
  .validator((input: unknown) => credentials.extend({ email: z.string().trim().email("Inserisci un’email valida.").max(255).transform(value => value.toLowerCase()) }).parse(input))
  .handler(async ({ data }) => {
    const { authorizeAdministrator, grantAdministrator, sendAdministratorInvite } = await import("./admin-users.server");
    const db = await authorizeAdministrator(data.token);
    const granted = await grantAdministrator(db, data.email);
    const invited = Boolean(granted.invitationLink);
    const invitationSent = granted.invitationLink ? await sendAdministratorInvite(granted.email, granted.invitationLink) : false;
    return { email: granted.email, invited, invitationSent };
  });
