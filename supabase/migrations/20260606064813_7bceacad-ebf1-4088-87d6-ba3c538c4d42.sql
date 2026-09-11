ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS codice_accesso text;

CREATE TABLE public.richieste_interesse (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  azienda text NOT NULL,
  azienda_slug text NOT NULL,
  prodotto_id uuid,
  prodotto_nome text NOT NULL,
  nome_cliente text NOT NULL,
  email_cliente text NOT NULL,
  telefono_cliente text,
  messaggio text NOT NULL DEFAULT '',
  stato text NOT NULL DEFAULT 'da_contattare',
  note_interne text NOT NULL DEFAULT '',
  contattato_il timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.richieste_interesse TO anon, authenticated;
GRANT SELECT, UPDATE ON public.richieste_interesse TO authenticated;
GRANT ALL ON public.richieste_interesse TO service_role;

ALTER TABLE public.richieste_interesse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chiunque può inviare una richiesta di interesse"
  ON public.richieste_interesse FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin leggono le richieste di interesse"
  ON public.richieste_interesse FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin aggiornano le richieste di interesse"
  ON public.richieste_interesse FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_richieste_interesse_updated_at
  BEFORE UPDATE ON public.richieste_interesse
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();