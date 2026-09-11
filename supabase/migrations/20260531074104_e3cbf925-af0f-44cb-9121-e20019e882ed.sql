-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Gli admin vedono i ruoli"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Acquirenti (buyers from checkout)
CREATE TABLE public.acquirenti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  totale numeric NOT NULL DEFAULT 0,
  articoli jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.acquirenti TO anon;
GRANT SELECT, INSERT ON public.acquirenti TO authenticated;
GRANT ALL ON public.acquirenti TO service_role;

ALTER TABLE public.acquirenti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chiunque può registrarsi come acquirente"
ON public.acquirenti FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Solo admin leggono gli acquirenti"
ON public.acquirenti FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Restrict iscrizioni reads to admins only
DROP POLICY IF EXISTS "Solo utenti autenticati leggono le iscrizioni" ON public.iscrizioni;

CREATE POLICY "Solo admin leggono le iscrizioni"
ON public.iscrizioni FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));