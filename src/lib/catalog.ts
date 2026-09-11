import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/components/CartContext";

export type DbProduct = {
  id: string;
  nome: string;
  azienda: string;
  provincia: string;
  categoria: string;
  descrizione: string;
  prezzo: number;
  immagine_url: string | null;
  disponibile: boolean;
  ordine: number;
};

export type DbBundle = {
  id: string;
  nome: string;
  descrizione: string;
  prodotti_inclusi: string[];
  prezzo: number;
  prezzo_singoli: number;
  immagine_url: string | null;
  attivo: boolean;
  ordine: number;
};

export type DbProdottoMese = {
  id: string;
  prodotto_id: string | null;
  produttore_storia: string;
  sconto_percentuale: number;
  scadenza: string;
  attivo: boolean;
  prodotti: DbProduct | null;
};

export type DbAzienda = {
  id: string;
  nome: string;
  slug: string;
  descrizione: string;
  provincia: string;
  comune: string;
  settore: string;
  certificazioni: string[];
  logo_url: string | null;
  sito_web: string | null;
  instagram: string | null;
  facebook: string | null;
  pubblica: boolean;
};

export const productToCart = (p: DbProduct): Product => ({
  id: p.id,
  nome: p.nome,
  azienda: p.azienda,
  provincia: p.provincia,
  categoria: p.categoria,
  descrizione: p.descrizione,
  prezzo: Number(p.prezzo),
});

export async function fetchProdotti(): Promise<DbProduct[]> {
  const { data, error } = await supabase
    .from("prodotti")
    .select("*")
    .eq("disponibile", true)
    .order("ordine", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DbProduct[]) ?? [];
}

export async function fetchBundle(): Promise<DbBundle[]> {
  const { data, error } = await supabase
    .from("bundle")
    .select("*")
    .eq("attivo", true)
    .order("ordine", { ascending: true });
  if (error) throw error;
  return (data as DbBundle[]) ?? [];
}

export async function fetchProdottoDelMese(): Promise<DbProdottoMese | null> {
  const { data, error } = await supabase
    .from("prodotto_del_mese")
    .select("*, prodotti(*)")
    .eq("attivo", true)
    .gt("scadenza", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as DbProdottoMese) ?? null;
}

export async function fetchAziende(): Promise<DbAzienda[]> {
  const { data, error } = await supabase
    .from("aziende")
    .select(
      "id, nome, slug, descrizione, provincia, comune, settore, certificazioni, logo_url, sito_web, instagram, facebook, pubblica",
    )
    .eq("pubblica", true)
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data as DbAzienda[]) ?? [];
}

export async function fetchAzienda(slug: string): Promise<DbAzienda | null> {
  const { data, error } = await supabase
    .from("aziende")
    .select(
      "id, nome, slug, descrizione, provincia, comune, settore, certificazioni, logo_url, sito_web, instagram, facebook, pubblica",
    )
    .eq("slug", slug)
    .eq("pubblica", true)
    .maybeSingle();
  if (error) throw error;
  return (data as DbAzienda) ?? null;
}

export async function fetchProdottiByAzienda(nome: string): Promise<DbProduct[]> {
  const { data, error } = await supabase
    .from("prodotti")
    .select("*")
    .eq("azienda", nome)
    .eq("disponibile", true)
    .order("ordine", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DbProduct[]) ?? [];
}