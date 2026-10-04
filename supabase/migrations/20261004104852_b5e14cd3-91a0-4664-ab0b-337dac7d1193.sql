DROP POLICY IF EXISTS "Signed-in shop users can browse service history customers" ON public.service_history_customers;
DROP POLICY IF EXISTS "Signed-in shop users can add service history customers" ON public.service_history_customers;
DROP POLICY IF EXISTS "Signed-in shop users can update service history customers" ON public.service_history_customers;
DROP POLICY IF EXISTS "Signed-in shop users can delete service history customers" ON public.service_history_customers;
DROP POLICY IF EXISTS "Signed-in shop users can browse service history bills" ON public.service_history_bills;
DROP POLICY IF EXISTS "Signed-in shop users can add service history bills" ON public.service_history_bills;
DROP POLICY IF EXISTS "Signed-in shop users can update service history bills" ON public.service_history_bills;
DROP POLICY IF EXISTS "Signed-in shop users can delete service history bills" ON public.service_history_bills;

CREATE POLICY "Signed-in shop users can browse service history customers" ON public.service_history_customers FOR SELECT TO authenticated USING ((SELECT auth.uid()) = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'::uuid);
CREATE POLICY "Signed-in shop users can add service history customers" ON public.service_history_customers FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'::uuid);
CREATE POLICY "Signed-in shop users can update service history customers" ON public.service_history_customers FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'::uuid) WITH CHECK ((SELECT auth.uid()) = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'::uuid);
CREATE POLICY "Signed-in shop users can delete service history customers" ON public.service_history_customers FOR DELETE TO authenticated USING ((SELECT auth.uid()) = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'::uuid);

CREATE POLICY "Signed-in shop users can browse service history bills" ON public.service_history_bills FOR SELECT TO authenticated USING ((SELECT auth.uid()) = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'::uuid);
CREATE POLICY "Signed-in shop users can add service history bills" ON public.service_history_bills FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'::uuid);
CREATE POLICY "Signed-in shop users can update service history bills" ON public.service_history_bills FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'::uuid) WITH CHECK ((SELECT auth.uid()) = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'::uuid);
CREATE POLICY "Signed-in shop users can delete service history bills" ON public.service_history_bills FOR DELETE TO authenticated USING ((SELECT auth.uid()) = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'::uuid);

UPDATE storage.objects
SET owner_id = 'fe332de2-d3e1-4938-8aad-f98606d8cc03'
WHERE bucket_id = 'service-bills' AND owner_id IS NULL;

DROP POLICY IF EXISTS "Signed-in shop users can view service bill files" ON storage.objects;
DROP POLICY IF EXISTS "Signed-in shop users can upload service bill files" ON storage.objects;
DROP POLICY IF EXISTS "Signed-in shop users can update service bill files" ON storage.objects;
DROP POLICY IF EXISTS "Signed-in shop users can delete service bill files" ON storage.objects;
CREATE POLICY "Signed-in shop users can view service bill files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'service-bills' AND owner_id = (SELECT auth.uid()::text));
CREATE POLICY "Signed-in shop users can upload service bill files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'service-bills' AND owner_id = (SELECT auth.uid()::text));
CREATE POLICY "Signed-in shop users can update service bill files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'service-bills' AND owner_id = (SELECT auth.uid()::text)) WITH CHECK (bucket_id = 'service-bills' AND owner_id = (SELECT auth.uid()::text));
CREATE POLICY "Signed-in shop users can delete service bill files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'service-bills' AND owner_id = (SELECT auth.uid()::text));