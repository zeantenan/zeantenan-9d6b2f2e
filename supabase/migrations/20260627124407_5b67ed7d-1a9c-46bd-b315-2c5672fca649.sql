
-- product-media (public read, staff write)
CREATE POLICY "pm_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-media');
CREATE POLICY "pm_staff_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-media' AND public.is_staff(auth.uid()));
CREATE POLICY "pm_staff_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-media' AND public.is_staff(auth.uid()));
CREATE POLICY "pm_staff_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-media' AND public.is_staff(auth.uid()));

-- avatars (public read, owner writes own folder /<uid>/...)
CREATE POLICY "av_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
CREATE POLICY "av_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "av_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "av_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- payment-proofs (private, owner upload within /<uid>/..., staff read all)
CREATE POLICY "pp_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "pp_owner_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "pp_staff_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs' AND public.is_staff(auth.uid()));
CREATE POLICY "pp_staff_all" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'payment-proofs' AND public.is_staff(auth.uid())) WITH CHECK (bucket_id = 'payment-proofs' AND public.is_staff(auth.uid()));
