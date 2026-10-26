import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin, X } from "lucide-react";
import type { DbAzienda } from "@/lib/catalog";

type Ring = number[][];
type Feature = { properties: { name: string; code: string }; geometry: { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] } };
type Collection = { type: "FeatureCollection"; features: Feature[] };
const provinces = [
  { name: "Trapani", code: "TP", lon: 12.65, lat: 37.88, labelAngle: 0 },
  { name: "Palermo", code: "PA", lon: 13.45, lat: 37.93, labelAngle: 0 },
  { name: "Messina", code: "ME", lon: 14.9, lat: 38.06, labelAngle: -8 },
  { name: "Agrigento", code: "AG", lon: 13.5, lat: 37.4, labelAngle: 30 },
  { name: "Caltanissetta", code: "CL", lon: 14.02, lat: 37.28, labelAngle: 55 },
  { name: "Enna", code: "EN", lon: 14.37, lat: 37.62, labelAngle: 0 },
  { name: "Catania", code: "CT", lon: 14.92, lat: 37.57, labelAngle: -48 },
  { name: "Siracusa", code: "SR", lon: 15.02, lat: 37.08, labelAngle: 58 },
  { name: "Ragusa", code: "RG", lon: 14.66, lat: 36.91, labelAngle: 25 },
];
const normalize = (value: string) => value.trim().toLocaleLowerCase("it");
// Local Mercator projection; the inset preserves the remote islands without shrinking Sicily.
const mercatorY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI;
const project = (lon: number, lat: number): [number, number] => [38 + (lon - 12.35) * 210, 28 + (mercatorY(38.85) - mercatorY(lat)) * 210];
const inset = (lon: number, lat: number): [number, number] => [60 + (lon - 11.8) * 120, 475 + (mercatorY(36.9) - mercatorY(lat)) * 120];
const polygons = (feature: Feature) => feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
const remote = (rings: Ring[]) => rings[0][0][1] < 36.5 || rings[0][0][0] < 12.15;
const path = (rings: Ring[], projection: typeof project) => rings.map(ring => ring.map(([lon, lat], i) => {
  const [x, y] = projection(lon, lat);
  return `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
}).join(" ") + "Z").join(" ");

export function SicilyMap({ imprese }: { imprese: DbAzienda[] }) {
  const [geo, setGeo] = useState<Collection | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch("/maps/sicilia.geojson", { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Mappa non disponibile"); return response.json(); })
      .then((data: Collection) => {
        if (data.type !== "FeatureCollection" || data.features?.length !== 9 || !provinces.every(p => data.features.some(f => f.properties?.name === p.name && ["Polygon", "MultiPolygon"].includes(f.geometry?.type)))) throw new Error("Confini provinciali non validi");
        setGeo(data);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);
  const byProvince = useMemo(() => {
    const result: Record<string, DbAzienda[]> = Object.fromEntries(provinces.map(p => [p.name, []]));
    for (const company of imprese) {
      if (!company.pubblica) continue;
      const p = provinces.find(p => normalize(p.name) === normalize(company.provincia ?? "") || normalize(p.code) === normalize(company.provincia ?? ""));
      if (p) result[p.name].push(company);
    }
    return result;
  }, [imprese]);
  const companies = selected ? byProvince[selected] : [];
  const count = Object.values(byProvince).reduce((sum, list) => sum + list.length, 0);
  const active = hovered ?? selected;
  const select = (name: string) => { setSelected(name); setHovered(null); };
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.65fr_1fr]">
      <div className="overflow-hidden rounded-3xl border border-[#d5bd82]/40 bg-gradient-to-br from-[#faf9f5] via-[#f1f5f8] to-[#e8eef3] shadow-[0_14px_50px_-30px_#102c46]">
        <div className="flex items-start justify-between gap-3 px-5 pt-6 sm:px-7">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8b6b2d]">AMUNI · Sicilia</p><h3 className="mt-2 font-serif text-2xl text-[#102c46]">Un’isola, infinite connessioni.</h3><p className="mt-2 text-sm text-[#526477]">Esplora le province e incontra le nostre aziende.</p></div>
          <span className="shrink-0 rounded-full border border-[#d5bd82]/50 bg-white/70 px-3 py-2 text-xs text-[#102c46]">{count} aziende</span>
        </div>
        <div className="px-2 sm:px-5">
          {error ? <div role="alert" className="p-10 text-center text-[#102c46]"><p>La mappa non è disponibile al momento.</p><button type="button" onClick={() => setAttempt(a => a + 1)} className="mt-4 underline">Riprova</button></div> : !geo ? <p role="status" className="p-24 text-center text-sm text-[#526477]">Caricamento della Sicilia…</p> : (
            <svg viewBox="0 0 780 710" className="h-auto w-full" role="group" aria-label="Mappa geografica delle nove province siciliane; isole meridionali nel riquadro">
              <defs><filter id="sicily-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#102c46" floodOpacity="0.15" /></filter><linearGradient id="sicily-gold" x2="0.8" y2="1"><stop stopColor="#e7cc8b"/><stop offset="1" stopColor="#c49a45"/></linearGradient></defs>
              <text x="50" y="200" fill="#8294a5" fontSize="13" fontStyle="italic" letterSpacing="3">MAR TIRRENO</text>
              <text x="540" y="630" fill="#8294a5" fontSize="13" fontStyle="italic" letterSpacing="3">MAR IONIO</text>
              <rect x="30" y="460" width="230" height="235" rx="14" fill="white" fillOpacity="0.55" stroke="#d4dde4" />
              <text x="45" y="483" fontSize="11" fill="#526477">ISOLE MERIDIONALI · RIQUADRO</text>
              {geo.features.map(feature => {
                const name = feature.properties.name;
                const total = byProvince[name].length;
                const focused = active === name;
                return <g key={name} role="button" tabIndex={0} aria-label={`${name}, ${total} aziende aderenti`} aria-pressed={selected === name} className="group cursor-pointer outline-none" onMouseEnter={() => setHovered(name)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(name)} onBlur={() => setHovered(null)} onClick={() => select(name)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(name); } }}>
                  <title>{name}: {total} aziende aderenti</title>
                  {polygons(feature).map((rings, i) => <path key={i} d={path(rings, remote(rings) ? inset : project)} fill={selected === name ? "url(#sicily-gold)" : focused ? "#52728d" : total ? "#173a57" : "#dce3e9"} fillRule="evenodd" stroke={focused ? "#b68d3f" : "#ffffff"} strokeWidth={focused ? 2 : 1.2} strokeLinejoin="round" className="transition-colors duration-200 group-focus-visible:stroke-[#9c6c1c] group-focus-visible:stroke-[3]" style={{ filter: "url(#sicily-shadow)" }} />)}
                </g>;
              })}
              <text x="45" y="530" fontSize="11" fill="#526477" pointerEvents="none">Pantelleria</text>
              <text x="100" y="665" fontSize="11" fill="#526477" pointerEvents="none">Isole Pelagie</text>
              {provinces.map(p => {
                const [x, y] = project(p.lon, p.lat);
                const total = byProvince[p.name].length;
                const labelColor = total && selected !== p.name && hovered !== p.name ? "#fff8e9" : "#102c46";
                return <g key={p.code} transform={`translate(${x} ${y})`} pointerEvents={total ? "auto" : "none"}>
                  {total > 0 && <g transform="translate(0 -36)" role="button" tabIndex={0} aria-label={`Mostra ${total} aziende di ${p.name}, posizione aggregata provinciale`} aria-pressed={selected === p.name} className="group cursor-pointer outline-none" onClick={() => select(p.name)} onMouseEnter={() => setHovered(p.name)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(p.name)} onBlur={() => setHovered(null)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(p.name); } }}>
                    <title>{p.name}: {total} aziende · indicatore provinciale</title>
                    <circle r="20" cy="-7" fill="#d9b665" fillOpacity="0.15" className="group-focus-visible:stroke-[#102c46] group-focus-visible:stroke-[3]" />
                    <path d="M0 10 C-5 3 -13 -3 -13 -10 A13 13 0 1 1 13 -10 C13 -3 5 3 0 10Z" fill="#d9b665" stroke="#fff8e9" strokeWidth="1.5" />
                    <text y="-6" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#102c46">{total}</text>
                  </g>}
                  <text transform={`rotate(${p.labelAngle})`} textAnchor="middle" dominantBaseline="central" fontSize={p.name === "Caltanissetta" ? 19 : 22} fontWeight="600" fill={labelColor} stroke={labelColor === "#102c46" ? "#f7f9fa" : "#173a57"} strokeWidth="2" strokeLinejoin="round" paintOrder="stroke" pointerEvents="none">{p.name}</text>
                </g>;
              })}
              {active && <g pointerEvents="none"><rect x="300" y="655" width="440" height="38" rx="12" fill="#102c46"/><text x="520" y="679" textAnchor="middle" fontSize="15" fill="#f4dfb0">{active} · {byProvince[active].length} aziende aderenti</text></g>}
            </svg>
          )}
        </div>
        <div className="mx-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#102c46]/10 py-4 text-xs text-[#526477] sm:mx-7"><span>● <span className="text-[#173a57]">Province del network</span></span><span>◆ <span className="text-[#8b6b2d]">Aziende aggregate per provincia</span></span><span>○ Province senza aziende</span></div>
        <p className="px-5 pb-5 text-[11px] leading-relaxed text-[#526477] sm:px-7">I segnaposto indicano il totale provinciale, non la sede delle aziende. Confini: ISTAT · <a href="https://github.com/guglielmo/geojson-italy" target="_blank" rel="noreferrer" className="underline">geojson-italy, CC BY</a>. Isole meridionali in riquadro a scala diversa.</p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-[#d5bd82]/40 bg-white shadow-[0_14px_50px_-30px_#102c46]">
        <div className="bg-[#102c46] p-6 text-white"><p className="text-[10px] uppercase tracking-[0.25em] text-[#e2c586]">Il network AMUNI</p><div className="mt-3 flex items-center justify-between"><h3 className="font-serif text-2xl">{selected ?? "Esplora il territorio"}</h3>{selected ? <button type="button" aria-label="Chiudi provincia" onClick={() => setSelected(null)} className="rounded-full p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#d9b665]"><X size={19}/></button> : <MapPin className="text-[#d9b665]" />}</div><p className="mt-2 text-sm text-white/75">{selected ? `${companies.length} ${companies.length === 1 ? "azienda aderente" : "aziende aderenti"}` : "Nove province, una passione condivisa."}</p></div>
        <div className="p-6">
          <div className="mb-6 flex flex-wrap gap-2" aria-label="Seleziona una provincia">{provinces.map(p => <button type="button" key={p.code} aria-label={p.name} aria-pressed={selected === p.name} onClick={() => select(p.name)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad853c] ${selected === p.name ? "border-[#d9b665] bg-[#f5ead1] text-[#674a1c]" : "border-[#dce3e9] text-[#173a57] hover:border-[#b38a41] hover:bg-[#faf7ef]"}`}>{p.name}</button>)}</div>
          <div aria-live="polite" aria-atomic="true">
            {!selected ? <div className="py-8 text-center"><MapPin className="mx-auto h-10 w-10 text-[#b38a41]"/><p className="mt-4 font-serif text-xl text-[#102c46]">Il territorio prende vita.</p><p className="mt-3 text-sm leading-relaxed text-[#526477]">Seleziona una provincia o un segnaposto dorato per scoprire le aziende del network.</p></div> : companies.length === 0 ? <div className="rounded-2xl bg-[#f7f5ef] p-6"><h4 className="font-serif text-xl text-[#102c46]">La prossima storia potrebbe essere la tua.</h4><p className="mt-3 text-sm leading-relaxed text-[#526477]">Non ci sono ancora aziende pubblicate a {selected}. Porta la tua impresa nel network AMUNI.</p><a href="/iscrizione-impresa" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#856326]">Aderisci al network <ArrowRight size={16}/></a></div> : <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">{companies.map(a => <article key={a.id} className="rounded-2xl border border-[#e3e8ed] bg-gradient-to-br from-white to-[#f7f8fa] p-5"><h4 className="font-serif text-xl text-[#102c46]">{a.nome}</h4><p className="mt-2 flex items-center gap-1 text-sm text-[#526477]"><MapPin size={13}/>{a.comune}</p><p className="mt-2 text-xs text-[#856326]">{a.settore}</p><a href={a.slug ? `/aziende/${encodeURIComponent(a.slug)}` : "#imprese"} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#102c46] px-4 py-2 text-xs font-semibold text-[#f2d99d] transition-colors hover:bg-[#234c6b]">Scopri l’azienda <ArrowRight size={14}/></a></article>)}</div>}
          </div>
          <a href="#imprese" className="mt-6 inline-flex items-center gap-2 border-t border-[#e3e8ed] pt-5 text-sm font-semibold text-[#173a57]">Tutte le aziende del network <ArrowRight size={16}/></a>
        </div>
      </div>
    </div>
  );
}
