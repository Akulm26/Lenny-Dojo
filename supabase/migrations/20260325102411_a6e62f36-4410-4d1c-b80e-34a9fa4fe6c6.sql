
CREATE POLICY "Users can update own notifications" ON public.notifications_queue
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
