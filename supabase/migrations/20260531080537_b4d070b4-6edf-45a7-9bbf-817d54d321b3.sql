-- Add stato column to iscrizioni
ALTER TABLE public.iscrizioni
ADD COLUMN IF NOT EXISTS stato text NOT NULL DEFAULT 'in_attesa';

-- Allow admins to update iscrizioni (e.g. change stato)
CREATE POLICY "Solo admin aggiornano le iscrizioni"
ON public.iscrizioni
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));