import { createFileRoute } from "@tanstack/react-router";
import { AdminLogin } from "./admin.login";

export const Route = createFileRoute("/admin/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Imposta password — A.M.U.N.Ì." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <AdminLogin initialMode="reset" />,
});
