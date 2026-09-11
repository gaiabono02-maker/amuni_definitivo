-- Timestamp helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ PRODOTTI ============
CREATE TABLE public.prodotti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  azienda TEXT NOT NULL DEFAULT '',
  provincia TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'Altri prodotti',
  descrizione TEXT NOT NULL DEFAULT '',
  prezzo NUMERIC NOT NULL DEFAULT 0,
  immagine_url TEXT,
  disponibile BOOLEAN NOT NULL DEFAULT true,
  ordine INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prodotti TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prodotti TO authenticated;
GRANT ALL ON public.prodotti TO service_role;
ALTER TABLE public.prodotti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prodotti visibili a tutti" ON public.prodotti FOR SELECT USING (true);
CREATE POLICY "Admin gestiscono i prodotti" ON public.prodotti FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_prodotti_updated BEFORE UPDATE ON public.prodotti
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AZIENDE ============
CREATE TABLE public.aziende (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descrizione TEXT NOT NULL DEFAULT '',
  provincia TEXT NOT NULL DEFAULT '',
  comune TEXT NOT NULL DEFAULT '',
  settore TEXT NOT NULL DEFAULT '',
  certificazioni TEXT[] NOT NULL DEFAULT '{}',
  logo_url TEXT,
  sito_web TEXT,
  instagram TEXT,
  facebook TEXT,
  pubblica BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aziende TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aziende TO authenticated;
GRANT ALL ON public.aziende TO service_role;
ALTER TABLE public.aziende ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aziende pubbliche visibili a tutti" ON public.aziende FOR SELECT USING (pubblica = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin gestiscono le aziende" ON public.aziende FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_aziende_updated BEFORE UPDATE ON public.aziende
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ BUNDLE ============
CREATE TABLE public.bundle (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descrizione TEXT NOT NULL DEFAULT '',
  prodotti_inclusi TEXT[] NOT NULL DEFAULT '{}',
  prezzo NUMERIC NOT NULL DEFAULT 0,
  prezzo_singoli NUMERIC NOT NULL DEFAULT 0,
  immagine_url TEXT,
  attivo BOOLEAN NOT NULL DEFAULT true,
  ordine INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bundle TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle TO authenticated;
GRANT ALL ON public.bundle TO service_role;
ALTER TABLE public.bundle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bundle visibili a tutti" ON public.bundle FOR SELECT USING (true);
CREATE POLICY "Admin gestiscono i bundle" ON public.bundle FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_bundle_updated BEFORE UPDATE ON public.bundle
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PRODOTTO DEL MESE ============
CREATE TABLE public.prodotto_del_mese (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prodotto_id UUID REFERENCES public.prodotti(id) ON DELETE CASCADE,
  produttore_storia TEXT NOT NULL DEFAULT '',
  sconto_percentuale INTEGER NOT NULL DEFAULT 0,
  scadenza TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  attivo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prodotto_del_mese TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prodotto_del_mese TO authenticated;
GRANT ALL ON public.prodotto_del_mese TO service_role;
ALTER TABLE public.prodotto_del_mese ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prodotto del mese visibile a tutti" ON public.prodotto_del_mese FOR SELECT USING (true);
CREATE POLICY "Admin gestiscono prodotto del mese" ON public.prodotto_del_mese FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_pdm_updated BEFORE UPDATE ON public.prodotto_del_mese
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RICHIESTE PRODOTTI ============
CREATE TABLE public.richieste_prodotti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_prodotto TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Altro',
  note TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  stato TEXT NOT NULL DEFAULT 'nuova',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.richieste_prodotti TO authenticated;
GRANT INSERT ON public.richieste_prodotti TO anon;
GRANT ALL ON public.richieste_prodotti TO service_role;
ALTER TABLE public.richieste_prodotti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chiunque può richiedere un prodotto" ON public.richieste_prodotti FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin leggono le richieste" ON public.richieste_prodotti FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin aggiornano le richieste" ON public.richieste_prodotti FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============ STORAGE: catalogo immagini ============
INSERT INTO storage.buckets (id, name, public) VALUES ('catalogo', 'catalogo', true)
  ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Immagini catalogo pubbliche" ON storage.objects FOR SELECT USING (bucket_id = 'catalogo');
CREATE POLICY "Admin caricano immagini catalogo" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalogo' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin aggiornano immagini catalogo" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'catalogo' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin eliminano immagini catalogo" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'catalogo' AND has_role(auth.uid(), 'admin'));