import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { iscrizioneSchema } from "@/lib/iscrizione.schema";
import { submitApplication } from "@/lib/iscrizione.functions";
import { province } from "@/data/network";

export function CompanyApplicationForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = iscrizioneSchema.safeParse({
      nome: fd.get("nome"),
      azienda: fd.get("azienda"),
      settore: fd.get("settore") || undefined,
      provincia: fd.get("provincia") || undefined,
      email: fd.get("email"),
      messaggio: fd.get("messaggio") || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { emailSent } = await submitApplication({ data: parsed.data });
      setSent(true);
      form.reset();
      toast.success("Candidatura inviata con successo!");
      if (!emailSent) {
        toast.info("Candidatura ricevuta. La mail di conferma non è stata inviata, ma ti ricontatteremo a breve.");
      }
    } catch {
      toast.error("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  return (
              <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-cream p-7 text-foreground shadow-lg">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome" id="nome"><Input id="nome" name="nome" required placeholder="Nome e cognome" /></Field>
                  <Field label="Azienda" id="azienda"><Input id="azienda" name="azienda" required placeholder="Nome azienda" /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Settore agricolo" id="settore"><Input id="settore" name="settore" placeholder="Es. viticoltura" /></Field>
                  <Field label="Provincia" id="provincia">
                    <select id="provincia" name="provincia" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" defaultValue="">
                      <option value="" disabled>Seleziona</option>
                      {province.map((p) => <option key={p.id}>{p.nome}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Email" id="email"><Input id="email" name="email" type="email" required placeholder="latua@email.it" /></Field>
                <Field label="Messaggio" id="messaggio"><Textarea id="messaggio" name="messaggio" rows={4} placeholder="Raccontaci della tua azienda..." /></Field>
                <Button type="submit" size="lg" className="w-full" disabled={loading || sent}>
                  {loading ? "Invio in corso..." : sent ? "Candidatura ricevuta" : "Invia la candidatura"}
                </Button>
                {sent && <p role="status" className="text-sm font-medium text-secondary">Grazie! La tua candidatura è stata inviata. Ti contatteremo presto.</p>}
              </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
