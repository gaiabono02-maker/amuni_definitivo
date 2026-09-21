import { fetchProdotti, fetchAziende, fetchAzienda, fetchProdottiByAzienda, type DbAzienda, type DbProduct } from "@/lib/catalog";

export const isDemoProduct = (p: DbProduct) => p.id.startsWith("anteprima-");
export async function fetchShowcaseProducts(): Promise<DbProduct[]> {
  const prodotti = await fetchProdotti();
  return prodotti;
}

export const isDemoCompany = (a: DbAzienda) => a.id.startsWith("anteprima-impresa-");
export async function fetchShowcaseCompanies(): Promise<DbAzienda[]> {
  const aziende = await fetchAziende();
  return aziende;
}
export async function fetchShowcaseCompany(slug: string): Promise<DbAzienda | null> {
  const azienda = await fetchAzienda(slug);
  if (azienda) return azienda;
  return (await fetchShowcaseCompanies()).find(a => a.slug === slug) ?? null;
}
export async function fetchShowcaseCompanyProducts(a: DbAzienda): Promise<DbProduct[]> {
  return fetchProdottiByAzienda(a.nome);
}
