import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

export const Route = createFileRoute("/api/retention")({
  server: { handlers: { GET: async ({request}) => {
    const secret = process.env.CRON_SECRET;
    const token = request.headers.get("authorization");
    if (!secret || !token) return new Response("Accesso negato.", {status: 401});
    const expected = Buffer.from(`Bearer ${secret}`);
    const provided = Buffer.from(token);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return new Response("Accesso negato.", {status: 401});
    try {
      const {supabaseAdmin} = await import("@/integrations/supabase/client.server");
      const {purgeExpiredRequests} = await import("@/lib/retention.server");
      const result = await purgeExpiredRequests(supabaseAdmin, new URL(request.url).searchParams.get("dry_run") === "1");
      return Response.json(result, {headers: {"Cache-Control": "no-store"}});
    } catch {
      return new Response("Pulizia non completata.", {status: 500});
    }
  } } },
});
