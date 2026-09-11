CREATE TABLE public.profili (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  citta text NOT NULL DEFAULT '',
  provincia text NOT NULL DEFAULT '',
  indirizzo text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profili TO authenticated;
GRANT ALL ON public.profili TO service_role;
ALTER TABLE public.profili ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utenti vedono il proprio profilo" ON public.profili FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Utenti creano il proprio profilo" ON public.profili FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utenti aggiornano il proprio profilo" ON public.profili FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_profili_updated BEFORE UPDATE ON public.profili FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.abbonamenti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  piano text NOT NULL DEFAULT 'nessuno',
  stato text NOT NULL DEFAULT 'in_attesa',
  prezzo numeric NOT NULL DEFAULT 0,
  inizio timestamptz,
  scadenza timestamptz,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abbonamenti TO authenticated;
GRANT ALL ON public.abbonamenti TO service_role;
ALTER TABLE public.abbonamenti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utenti vedono il proprio abbonamento" ON public.abbonamenti FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin creano abbonamenti" ON public.abbonamenti FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin aggiornano abbonamenti" ON public.abbonamenti FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin eliminano abbonamenti" ON public.abbonamenti FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_abbonamenti_updated BEFORE UPDATE ON public.abbonamenti FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profili (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), COALESCE(NEW.email, ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();