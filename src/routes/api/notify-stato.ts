import { createFileRoute } from "@tanstack/react-router";

// Endpoint best-effort per la notifica email al cambio stato di un'azienda.
// L'invio reale viene attivato dopo la configurazione del dominio email.
export const Route = createFileRoute("/api/notify-stato")({
  server: {
    handlers: {
      POST: async () => {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});