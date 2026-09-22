export type RegistrationKind = "cliente" | "azienda";

export function registrationEmail(kind: RegistrationKind, nome: string) {
  const greeting = nome.trim() ? `Ciao ${nome.trim()},` : "Ciao,";
  const detail = kind === "azienda"
    ? "Abbiamo ricevuto la candidatura della tua azienda. Il nostro team la esaminerà e ti contatterà per conoscere meglio la tua attività e illustrarti i prossimi passi per entrare nel network."
    : "La tua iscrizione è stata ricevuta. Siamo felici di averti nella comunità A.M.U.N.Ì.!";
  const subject = kind === "azienda"
    ? "Candidatura ricevuta: ti aggiorneremo sui prossimi passi — A.M.U.N.Ì."
    : "Grazie per esserti iscritto ad A.M.U.N.Ì.!";
  const text = `${greeting}

grazie per esserti iscritto ad A.M.U.N.Ì.!

${detail}

Ti terremo aggiornato sulle novità del progetto e sui prossimi passi della tua iscrizione.

A.M.U.N.Ì., promosso da Associazione Forma Mentis OdV, unisce le imprese agricole siciliane e le persone che vogliono conoscere e valorizzare i prodotti del territorio.

Per informazioni puoi rispondere a questa email o scriverci a formamentisonlus@gmail.com.

A presto,
Il team A.M.U.N.Ì.
Associazione Forma Mentis OdV`;
  return { subject, text };
}
