import { imprese } from "@/data/network";
import { fetchProdotti, fetchAziende, fetchAzienda, fetchProdottiByAzienda, type DbAzienda, type DbProduct } from "@/lib/catalog";

const immagini = ["vino", "olio", "agrumi", "grani", "mandorle", "ortaggi"];
const categorie = ["Vino", "Olio", "Ortofrutta", "Cereali", "Altro", "Ortofrutta"];
const racconti = [
  "Il Nero d’Avola introduce il racconto della viticoltura siciliana. In questa anteprima, Cantine del Belice rappresenta il legame tra vino e territorio agrigentino: un invito a conoscere il lavoro che accompagna l’uva dalla vigna alla bottiglia. La scheda è dimostrativa; annata, caratteristiche e disponibilità saranno raccontate dall’impresa nella piattaforma definitiva.",
  "L’olio extravergine Nocellara porta al centro della tavola uno dei prodotti simbolo del paesaggio agricolo siciliano. La scheda dimostrativa di Frantoi Russo, nel territorio palermitano, invita a scoprire il rapporto tra cultivar, raccolta e frantoio. Origine delle olive, lavorazione e profilo sensoriale saranno approfonditi insieme al produttore.",
  "Arance e limoni raccontano una Sicilia fatta di agrumeti, profumi e stagioni. Agrumeto di Lorenzo è l’impresa dimostrativa associata a questa produzione nel territorio agrigentino. Il racconto parte dalla freschezza e dal piacere di conoscere ciò che arriva sulla tavola; varietà e calendario di raccolta saranno indicati dall’impresa.",
  "Le farine di grani antichi aprono una finestra sul paesaggio cerealicolo siciliano e sui gesti della trasformazione. Antichi Grani è la realtà dimostrativa del territorio palermitano che accompagna questo racconto. La scheda invita a conoscere i cereali e i loro impieghi in cucina, lasciando al produttore il racconto delle varietà e della molitura.",
  "Le mandorle di Avola introducono il mondo della frutta secca e il suo posto nella cultura gastronomica siciliana. Campagna Viva compare in questa anteprima come impresa dimostrativa del territorio agrigentino. Un punto di partenza per parlare di raccolta, lavorazione e utilizzi, senza anticipare certificazioni o caratteristiche che dovranno essere confermate dall’impresa.",
  "Gli ortaggi di stagione raccontano il ritmo della terra e una tavola che cambia durante l’anno. Orto Mediterraneo è la realtà dimostrativa associata al territorio palermitano. Questa scheda invita a conoscere chi coltiva e a chiedere quali produzioni siano disponibili, dando spazio al dialogo con l’impresa prima di ogni scelta.",
];

// Anteprima esclusivamente frontend: nessuna scrittura o migrazione del database.
export const demoProdotti: DbProduct[] = imprese.map((impresa, i) => ({
  id: `anteprima-${i}`, nome: impresa.prodotto, azienda: impresa.nome,
  provincia: impresa.provincia, categoria: categorie[i], descrizione: racconti[i],
  prezzo: 0, immagine_url: `/images/catalogo/${immagini[i]}.jpg`, disponibile: true, ordine: i,
}));
export const isDemoProduct = (p: DbProduct) => p.id.startsWith("anteprima-");
export async function fetchShowcaseProducts(): Promise<DbProduct[]> {
  const prodotti = await fetchProdotti();
  return prodotti.length ? prodotti : demoProdotti;
}

export const demoAziende: DbAzienda[] = imprese.map((impresa, i) => ({
  id: `anteprima-impresa-${i}`, nome: impresa.nome,
  slug: impresa.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  descrizione: impresa.desc, provincia: impresa.provincia, comune: "",
  settore: impresa.settore, certificazioni: [], logo_url: null,
  sito_web: null, instagram: null, facebook: null, pubblica: true,
}));
export const isDemoCompany = (a: DbAzienda) => a.id.startsWith("anteprima-impresa-");
export async function fetchShowcaseCompanies(): Promise<DbAzienda[]> {
  const aziende = await fetchAziende();
  return aziende.length ? aziende : demoAziende;
}
export async function fetchShowcaseCompany(slug: string): Promise<DbAzienda | null> {
  const azienda = await fetchAzienda(slug);
  if (azienda) return azienda;
  return (await fetchShowcaseCompanies()).find(a => a.slug === slug) ?? null;
}
export async function fetchShowcaseCompanyProducts(a: DbAzienda): Promise<DbProduct[]> {
  return isDemoCompany(a) ? demoProdotti.filter(p => p.azienda === a.nome) : fetchProdottiByAzienda(a.nome);
}
