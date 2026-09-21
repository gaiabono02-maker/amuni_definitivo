import { useState } from "react";
import { ArrowRight, MapPin, X } from "lucide-react";
import { province, siciliaPath } from "@/data/network";

import type { DbAzienda } from "@/lib/catalog";

export function SicilyMap({ imprese }: { imprese: DbAzienda[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const aziendeIn = (nome: string) =>
    imprese.filter((a) => a.provincia === nome);

  const selectedAziende = selected ? aziendeIn(selected) : [];

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="relative rounded-2xl border border-border bg-card p-4 shadow-sm">
        <svg viewBox="0 0 800 520" className="h-auto w-full" role="img" aria-label="Mappa interattiva della Sicilia">
          <path d={siciliaPath} fill="oklch(0.93 0.015 80)" stroke="oklch(0.55 0.09 120 / 0.4)" strokeWidth={2} />
          {province.map((p) => {
            const aziende = aziendeIn(p.nome);
            const active = aziende.length > 0;
            const isSel = selected === p.nome;
            const r = active ? 18 : 12;
            return (
              <g
                key={p.id}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(p.nome)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => active && setSelected(p.nome)}
                style={{ pointerEvents: active ? "auto" : "none" }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSel ? r + 5 : r}
                  fill={active ? "var(--terracotta)" : "oklch(0.75 0.01 80)"}
                  stroke="var(--cream)"
                  strokeWidth={3}
                  className="transition-all"
                  opacity={active ? 1 : 0.6}
                />
                {active && (
                  <text x={p.x} y={p.y + 4} textAnchor="middle" className="pointer-events-none fill-cream text-[11px] font-bold">
                    {aziende.length}
                  </text>
                )}
                <text
                  x={p.x}
                  y={p.y - r - 6}
                  textAnchor="middle"
                  className="pointer-events-none text-[12px] font-semibold"
                  fill="var(--brown)"
                >
                  {p.nome}
                </text>
              </g>
            );
          })}
        </svg>
        {hovered && (
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-brown px-3 py-1.5 text-xs font-medium text-cream shadow-lg">
            {hovered}: {aziendeIn(hovered).length} {aziendeIn(hovered).length === 1 ? "azienda" : "aziende"}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-4 px-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-primary" /> Province con aziende
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-muted-foreground/40" /> Altre province
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {!selected ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
            <MapPin className="h-8 w-8 text-primary" />
            <p className="mt-3 text-sm">{imprese.length === 0 ? "La rete cresce con le nuove adesioni. Iscrivi la tua impresa per rappresentare il tuo territorio." : <>Clicca su una provincia in <span className="font-semibold text-foreground">terracotta</span> per scoprire le aziende del network di quella zona.</>}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-bold text-brown">{selected}</h3>
              <button onClick={() => setSelected(null)} className="rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Chiudi">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedAziende.length} {selectedAziende.length === 1 ? "azienda aderente" : "aziende aderenti"}
            </p>
            <div className="mt-5 space-y-3">
              {selectedAziende.map((a) => (
                <div key={a.nome} className="rounded-xl border border-border bg-background p-4">
                  <h4 className="font-serif text-lg font-bold">{a.nome}</h4>
                  <p className="text-sm font-medium text-secondary">{a.comune}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.settore}</p>
                  <a href="#imprese" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5">
                    Vedi scheda <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}