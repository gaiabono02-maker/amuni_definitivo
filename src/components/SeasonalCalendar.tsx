import { useState } from "react";
import { calendario } from "@/data/network";
import { Reveal } from "@/components/Reveal";

export function SeasonalCalendar() {
  const current = new Date().getMonth();
  const [active, setActive] = useState(current);

  return (
    <section id="stagionalita" className="scroll-mt-16 bg-cream py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest brand-label">Calendario dei Sapori</p>
          <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Mangia siciliano, mangia di stagione</h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold" />
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Ogni mese la terra siciliana offre i suoi frutti migliori. Scopri cosa raccolgono le aziende del network.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {calendario.map((m, i) => {
            const isActive = i === active;
            const isCurrent = i === current;
            return (
              <button
                key={m.mese}
                onClick={() => setActive(i)}
                className={`rounded-2xl border p-3 text-center transition-all ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card hover:-translate-y-0.5 hover:border-primary"
                }`}
              >
                <span className="block text-sm font-bold">{m.mese}</span>
                {isCurrent && (
                  <span className={`mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide ${isActive ? "text-primary-foreground/80" : "text-secondary"}`}>
                    Questo mese
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-10 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-cream to-secondary/10 p-8 lg:p-12">
            <h3 className="text-center font-serif text-2xl font-bold text-brown">
              Di stagione a {calendario[active].mese}
            </h3>
            <div className="mt-8 flex flex-wrap justify-center gap-6">
              {calendario[active].prodotti.map((p) => (
                <div key={p.nome} className="flex w-32 flex-col items-center gap-3 rounded-2xl bg-card p-5 shadow-sm">
                  <span className="text-5xl" aria-hidden>{p.emoji}</span>
                  <span className="text-center font-serif text-base font-semibold">{p.nome}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}