-- Apply after the staging data dump, before committing the Prod restore.
-- The live source has broad policies on several public tables. Copying those
-- policies unchanged would let users access or change other owners' rows.

-- The Supabase CLI omits custom triggers on managed auth tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

-- Keep the platform's Realtime publication in sync with the source project.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;

-- Properties already have owner-only policies in the source. Remove the
-- permissive policies and give the founder explicit platform-wide access.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.properties;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.properties;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.properties;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.properties;
DROP POLICY IF EXISTS "superadmin manages all properties" ON public.properties;
CREATE POLICY "superadmin manages all properties" ON public.properties
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'superadmin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'superadmin');

-- A related row is accessible only through its owner property, or to admin.
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.property_address;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.property_address;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.property_address;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.property_address;
DROP POLICY IF EXISTS "owner or admin manages property addresses" ON public.property_address;
CREATE POLICY "owner or admin manages property addresses" ON public.property_address
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'superadmin'
    OR EXISTS (SELECT 1 FROM public.properties p
               WHERE p.id = property_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'superadmin'
    OR EXISTS (SELECT 1 FROM public.properties p
               WHERE p.id = property_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.property_photos;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.property_photos;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.property_photos;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.property_photos;
DROP POLICY IF EXISTS "owner or admin manages property photos" ON public.property_photos;
CREATE POLICY "owner or admin manages property photos" ON public.property_photos
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'superadmin'
    OR EXISTS (SELECT 1 FROM public.properties p
               WHERE p.id = property_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'superadmin'
    OR EXISTS (SELECT 1 FROM public.properties p
               WHERE p.id = property_id AND p.user_id = auth.uid())
  );

-- Group rows are created by the superadmin property workflow. Owners may
-- read only the group associations for their own properties.
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.property_groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.property_groups;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.property_groups;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.property_groups;
DROP POLICY IF EXISTS "owner reads assigned groups" ON public.property_groups;
DROP POLICY IF EXISTS "superadmin manages property groups" ON public.property_groups;
CREATE POLICY "owner reads assigned groups" ON public.property_groups
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.property_group_assignments a
    JOIN public.properties p ON p.id = a.property_id
    WHERE a.group_id = property_groups.id AND p.user_id = auth.uid()
  ));
CREATE POLICY "superadmin manages property groups" ON public.property_groups
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'superadmin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'superadmin');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.property_group_assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.property_group_assignments;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.property_group_assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.property_group_assignments;
DROP POLICY IF EXISTS "owner reads own group assignments" ON public.property_group_assignments;
DROP POLICY IF EXISTS "superadmin manages group assignments" ON public.property_group_assignments;
CREATE POLICY "owner reads own group assignments" ON public.property_group_assignments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "superadmin manages group assignments" ON public.property_group_assignments
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'superadmin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'superadmin');

-- The user role is assigned manually and by the signup trigger. App users
-- only need to read their profile; table grants must not permit role edits.
DROP POLICY IF EXISTS "users can insert own row" ON public.users;
DROP POLICY IF EXISTS "users can update own row" ON public.users;
REVOKE ALL ON public.users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.users TO authenticated;

-- The founder needs a platform-wide bookings view.
DROP POLICY IF EXISTS "superadmin reads all bookings" ON public.bookings;
CREATE POLICY "superadmin reads all bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'superadmin');

-- Replace the source bucket's public write policies. Public reads are
-- intentional for property images; writes require a signed-in user.
DROP POLICY IF EXISTS "Allow public uploads 1glht12_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads 1glht12_1" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads 1glht12_2" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads 1glht12_3" ON storage.objects;
DROP POLICY IF EXISTS "yado public photos read" ON storage.objects;
DROP POLICY IF EXISTS "yado authenticated photos upload" ON storage.objects;
DROP POLICY IF EXISTS "yado photo owner update" ON storage.objects;
DROP POLICY IF EXISTS "yado photo owner delete" ON storage.objects;
CREATE POLICY "yado public photos read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'yadoManagement');
CREATE POLICY "yado authenticated photos upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'yadoManagement' AND name LIKE 'property-photos/%');
CREATE POLICY "yado photo owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'yadoManagement'
    AND (owner_id = auth.uid()::text
         OR public.get_user_role(auth.uid()) = 'superadmin')
  )
  WITH CHECK (
    bucket_id = 'yadoManagement'
    AND name LIKE 'property-photos/%'
    AND (owner_id = auth.uid()::text
         OR public.get_user_role(auth.uid()) = 'superadmin')
  );
CREATE POLICY "yado photo owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'yadoManagement'
    AND (owner_id = auth.uid()::text
         OR public.get_user_role(auth.uid()) = 'superadmin')
  );
