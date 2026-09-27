CREATE TABLE public.service_history_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name text NOT NULL,
  owner_name_normalized text NOT NULL,
  bike_model text,
  bike_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_history_customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_history_customers TO authenticated;
GRANT ALL ON public.service_history_customers TO service_role;
ALTER TABLE public.service_history_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public users can browse service history customers" ON public.service_history_customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public users can add service history customers" ON public.service_history_customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public users can update service history customers" ON public.service_history_customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public users can delete service history customers" ON public.service_history_customers FOR DELETE TO anon, authenticated USING (true);
CREATE UNIQUE INDEX service_history_customers_owner_name_normalized_idx ON public.service_history_customers (owner_name_normalized);

CREATE TABLE public.service_history_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.service_history_customers(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  service_date date,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_history_bills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_history_bills TO authenticated;
GRANT ALL ON public.service_history_bills TO service_role;
ALTER TABLE public.service_history_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public users can browse service history bills" ON public.service_history_bills FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public users can add service history bills" ON public.service_history_bills FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public users can update service history bills" ON public.service_history_bills FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public users can delete service history bills" ON public.service_history_bills FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_service_history_customers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER update_service_history_customers_updated_at
BEFORE UPDATE ON public.service_history_customers
FOR EACH ROW EXECUTE FUNCTION public.update_service_history_customers_updated_at();

CREATE POLICY "Public users can view service bill files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'service-bills');
CREATE POLICY "Public users can upload service bill files" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'service-bills' AND lower((storage.foldername(name))[1]) = 'service-bills');
CREATE POLICY "Public users can update service bill files" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'service-bills') WITH CHECK (bucket_id = 'service-bills');
CREATE POLICY "Public users can delete service bill files" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'service-bills');