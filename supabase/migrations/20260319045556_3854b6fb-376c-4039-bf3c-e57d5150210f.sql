ALTER TABLE public.contact_messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));