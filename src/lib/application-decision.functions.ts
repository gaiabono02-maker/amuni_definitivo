import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const updateApplicationDecision = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({
    token: z.string().min(1), id: z.string().uuid(),
    stato: z.enum(["in_attesa", "approvata", "rifiutata"]),
    retryEmail: z.boolean().default(false),
  }).parse(input))
  .handler(async ({ data }) => {
    const { authorizeAdministrator } = await import("./admin-users.server");
    const { saveApplicationDecision } = await import("./application-decision.server");
    const db = await authorizeAdministrator(data.token);
    return saveApplicationDecision(db, data);
  });
