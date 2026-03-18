DROP POLICY "Anyone can insert analytics events" ON public.analytics_events;

CREATE POLICY "Authenticated users can insert analytics events"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (true);