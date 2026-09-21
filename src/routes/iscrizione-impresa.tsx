import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Leaf, Check } from "lucide-react";
import { CompanyApplicationForm } from "@/components/CompanyApplicationForm";

export const Route = createFileRoute("/iscrizione-impresa")({
  head: () => ({ meta: [
    { title: "Iscrivi la tua impresa — A.M.U.N.Ì." },
    { name: "description", content: "Presenta la tua impresa agricola e richiedi di aderire alla rete A.M.U.N.Ì. in Sicilia." },
  ] }),
  component: IscrizioneImpresa,
});

function IscrizioneImpresa() {
  return (
    <div className="min-h-screen bg-cream text-brown">
      <header className="border-b border-border">
        <nav aria-label="Navigazione" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <Link to="/" className="flex items-center gap-2 font-serif text-xl font-bold"><Leaf className="h-6 w-6 text-primary" /> A.M.U.N.Ì.</Link>
          <a href="/#imprese" className="flex items-center gap-2 text-sm hover:text-primary"><ArrowLeft className="h-4 w-4" /> Le Imprese</a>
        </nav>
      </header>
      <main className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Entra nella rete</p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">La tua impresa, una rete di opportunità.</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">Coltivi, produci o trasformi in Sicilia? Presentaci la tua attività e scopri come crescere insieme alle altre imprese agricole del territorio.</p>
          <ul className="my-8 space-y-4">
            {["Racconta la tua impresa e le tue produzioni", "Crea relazioni con altri produttori siciliani", "Partecipa alle iniziative del network"].map(t => <li key={t} className="flex gap-3"><Check className="h-5 w-5 shrink-0 text-secondary" />{t}</li>)}
          </ul>
          <div className="rounded-2xl bg-secondary/10 p-6">
            <h2 className="font-serif text-xl font-bold">Cosa succede dopo l’invio?</h2>
            <p className="mt-3 text-sm leading-relaxed">Il team di A.M.U.N.Ì. esaminerà la candidatura e ti contatterà all’indirizzo email indicato per conoscere la tua attività e illustrarti le modalità di adesione. L’invio non pubblica automaticamente la tua impresa sul sito.</p>
          </div>
        </div>
        <section aria-labelledby="modulo-iscrizione">
          <h2 id="modulo-iscrizione" className="mb-2 font-serif text-2xl font-bold">Iscrivi la tua impresa</h2>
          <p className="mb-6 text-sm text-muted-foreground">Nome, azienda ed email sono obbligatori. Gli altri campi ci aiutano a conoscerti meglio.</p>
          <CompanyApplicationForm />
          <p className="mt-5 text-sm text-muted-foreground">Hai bisogno di aiuto? <a className="text-primary underline" href="mailto:formamentisonlus@gmail.com">Scrivici</a>.</p>
        </section>
      </main>
    </div>
  );
}
