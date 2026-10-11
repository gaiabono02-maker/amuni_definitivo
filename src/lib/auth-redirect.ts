// Supabase currently authorizes this production domain for auth redirects.
// Both public domains point to the same deployment.
export function passwordRedirectUrl(origin: string, audience: "admin" | "customer" = "admin") {
  const url = new URL(origin);
  return `${url.hostname === "localhost" || url.hostname === "127.0.0.1" ? url.origin : "https://amuni-definitivo.vercel.app"}${audience === "admin" ? "/admin/reset-password" : "/imposta-password"}`;
}
