CREATE TABLE public.iscrizioni (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  azienda text NOT NULL,
  settore text,
  provincia text,
  email text NOT NULL,
  messaggio text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.iscrizioni TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iscrizioni TO authenticated;
GRANT ALL ON public.iscrizioni TO service_role;

ALTER TABLE public.iscrizioni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chiunque può inviare un'iscrizione"
ON public.iscrizioni
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Solo utenti autenticati leggono le iscrizioni"
ON public.iscrizioni
FOR SELECT
TO authenticated
USING (true);