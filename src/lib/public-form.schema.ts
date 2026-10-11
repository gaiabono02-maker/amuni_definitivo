import { z } from "zod";

export const publicFormFields = { website: z.string().max(200).optional().default("") };
