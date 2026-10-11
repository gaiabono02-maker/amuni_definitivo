import { createFileRoute } from "@tanstack/react-router";
import { AdminLogin } from "./admin.login";
export const Route = createFileRoute("/recupera-password")({
  ssr: false,
  head: () => ({meta: [{title: "Recupera password — A.M.U.N.Ì."}, {name: "robots", content: "noindex, nofollow"}]}),
  component: () => <AdminLogin initialMode="forgot" adminOnly={false} />,
});
