import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/site";

const xmlEscape = (value: string) => value.replace(/[<>&"']/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {auth: {persistSession: false, autoRefreshToken: false}});
        const paths = ["/", "/iscrizione-impresa", "/privacy"];
        // Only published company pages belong in the public sitemap.
        for (let from = 0; ; from += 500) {
          const {data, error} = await db.from("aziende").select("slug").eq("pubblica", true).order("id").range(from, from + 499);
          if (error) return new Response("Sitemap temporaneamente non disponibile.", {status: 503, headers: {"Retry-After": "300"}});
          paths.push(...data.filter(company => company.slug).map(company => `/aziende/${encodeURIComponent(company.slug)}`));
          if (data.length < 500) break;
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path => `  <url><loc>${xmlEscape(SITE_URL + path)}</loc></url>`).join("\n")}\n</urlset>`;
        return new Response(xml, {headers: {"Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300"}});
      },
    },
  },
});
