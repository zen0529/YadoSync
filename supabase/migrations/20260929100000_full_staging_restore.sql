-- Schema-only baseline of the live Prod database after the 2026-09-29 migration.
-- Auth rows, application data, and Storage file bytes are excluded from Git.
-- See SUPABASE_PROD_MIGRATION.md for the one-time data transfer.




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "internal";


ALTER SCHEMA "internal" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_user_role"("user_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select role from public.users where id = user_id;
$$;


ALTER FUNCTION "public"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'owner'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_bookings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_bookings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_revision_failure"("p_revision_id" "text", "p_booking_id" "text", "p_last_error" "text", "p_error_kind" "text", "p_tried_at" timestamp with time zone) RETURNS TABLE("revision_id" "text", "booking_id" "text", "attempt_count" integer, "last_error" "text", "error_kind" "text", "first_failed_at" timestamp with time zone, "last_tried_at" timestamp with time zone, "resolved" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO revision_failures (
    revision_id, booking_id, attempt_count,
    last_error, error_kind,
    first_failed_at, last_tried_at
  )
  VALUES (
    p_revision_id, p_booking_id, 1,
    p_last_error, p_error_kind,
    p_tried_at, p_tried_at
  )
  ON CONFLICT (revision_id) WHERE resolved = false
  DO UPDATE SET
    attempt_count = revision_failures.attempt_count + 1,
    last_error    = EXCLUDED.last_error,
    error_kind    = EXCLUDED.error_kind,
    last_tried_at = EXCLUDED.last_tried_at;

  RETURN QUERY
  SELECT
    rf.revision_id, rf.booking_id, rf.attempt_count,
    rf.last_error, rf.error_kind,
    rf.first_failed_at, rf.last_tried_at, rf.resolved
  FROM revision_failures rf
  WHERE rf.revision_id = p_revision_id
    AND rf.resolved = false;
END;
$$;


ALTER FUNCTION "public"."upsert_revision_failure"("p_revision_id" "text", "p_booking_id" "text", "p_last_error" "text", "p_error_kind" "text", "p_tried_at" timestamp with time zone) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "internal"."to_be_deleted_rate_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "original_rate_plan_id" "uuid" NOT NULL,
    "original_channex_id" "text" NOT NULL,
    "new_rate_plan_id" "uuid",
    "new_channex_id" "text",
    "rate_plan_snapshot" "jsonb" NOT NULL,
    "failure_reason" "text" NOT NULL,
    "original_created_at" timestamp with time zone NOT NULL,
    "queued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "purged_at" timestamp with time zone
);


ALTER TABLE "internal"."to_be_deleted_rate_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "room_type_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "available" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "channex_booking_id" "text" NOT NULL,
    "channex_revision_id" "text",
    "ota_name" "text",
    "ota_reservation_code" "text",
    "status" "text" DEFAULT 'confirmed'::"text" NOT NULL,
    "guest_name" "text",
    "guest_email" "text",
    "guest_phone" "text",
    "check_in" "date" NOT NULL,
    "check_out" "date" NOT NULL,
    "amount" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text",
    "raw_payload" "jsonb",
    "notes" "text",
    "booked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "booked_rooms" "jsonb" DEFAULT '[]'::"jsonb",
    "commission_amount" numeric
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bookings"."commission_amount" IS 'Platform commission earned on this booking. Calculated at ingestion time as SUM(rooms[].amount) * (properties.commission_rate / 100). Set to 0 on cancellation. NULL means the property has no commission_rate configured.';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "property_id" "uuid" DEFAULT "gen_random_uuid"(),
    "type" character varying,
    "channel" character varying,
    "status" character varying,
    "sent_at" timestamp without time zone,
    "message" "text",
    "booking_id" "text"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_connections" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "property_id" "uuid" DEFAULT "gen_random_uuid"(),
    "platform" character varying,
    "external_property_id" character varying,
    "connection_status" character varying,
    "connected_at" timestamp without time zone,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" DEFAULT "gen_random_uuid"(),
    "channex_channel_id" "uuid",
    "channex_group_id" "uuid",
    "ota_hotel_id" "text",
    "mapping_payload" "jsonb"
);


ALTER TABLE "public"."platform_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "name" character varying,
    "location" character varying,
    "owner_name" character varying,
    "owner_email" character varying,
    "owner_phone" character varying,
    "commission_rate" real NOT NULL,
    "status" character varying,
    "channex_property_id" "text",
    "property_type" character varying,
    "currency" character varying,
    "channex_name" "text",
    "modified_at" timestamp with time zone DEFAULT "now"(),
    "channex_settings" "jsonb",
    "content_description" "text",
    "content_imp_info" "text",
    "total_commission" real DEFAULT 0.00
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_address" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "address_line" "text",
    "city" "text",
    "state" "text",
    "country" "text",
    "postcode" "text",
    "latitude" "text",
    "longitude" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."property_address" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_group_assignments" (
    "property_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL
);


ALTER TABLE "public"."property_group_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channex_group_id" "text",
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."property_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "channex_photo_id" "text",
    "url" "text" NOT NULL,
    "position" integer DEFAULT 0,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "room_type_id" "text"
);


ALTER TABLE "public"."property_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "room_type_id" "uuid" NOT NULL,
    "channex_rate_plan_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "currency" "text" DEFAULT ''::"text",
    "sell_mode" "text" DEFAULT ''::"text" NOT NULL,
    "rate_mode" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tax_set_id" "text",
    "parent_rate_plan_id" "uuid",
    "children_fee" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "infant_fee" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "min_stay_arrival" integer DEFAULT 1 NOT NULL,
    "min_stay_through" integer DEFAULT 1 NOT NULL,
    "max_stay" integer DEFAULT 0 NOT NULL,
    "closed_to_arrival" boolean DEFAULT false NOT NULL,
    "closed_to_departure" boolean DEFAULT false NOT NULL,
    "stop_sell" boolean DEFAULT false NOT NULL,
    "inherit_settings" "jsonb" DEFAULT '{"rate": false, "max_sell": false, "max_stay": false, "stop_sell": false, "max_availability": false, "min_stay_arrival": false, "min_stay_through": false, "closed_to_arrival": false, "availability_offset": false, "closed_to_departure": false}'::"jsonb" NOT NULL,
    "options" "jsonb" DEFAULT '[{"rate": 0, "occupancy": 1, "is_primary": true}]'::"jsonb" NOT NULL,
    "auto_rate_settings" "jsonb",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    CONSTRAINT "rate_plans_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."rate_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restrictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "rate_plan_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "rate" integer DEFAULT 0 NOT NULL,
    "min_stay_arrival" integer DEFAULT 1,
    "stop_sell" boolean DEFAULT false,
    "closed_to_arrival" boolean DEFAULT false,
    "closed_to_departure" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "min_stay_through" integer DEFAULT 1 NOT NULL,
    "max_stay" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."restrictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."revision_failures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "revision_id" "text" NOT NULL,
    "booking_id" "text",
    "attempt_count" integer DEFAULT 1 NOT NULL,
    "last_error" "text",
    "error_kind" "text",
    "first_failed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_tried_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved" boolean DEFAULT false NOT NULL,
    "resolved_at" timestamp with time zone,
    CONSTRAINT "revision_failures_error_kind_check" CHECK (("error_kind" = ANY (ARRAY['transient'::"text", 'permanent'::"text"])))
);


ALTER TABLE "public"."revision_failures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "channex_room_type_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "count_of_rooms" integer DEFAULT 1 NOT NULL,
    "occ_adults" integer DEFAULT 2 NOT NULL,
    "occ_children" integer DEFAULT 0 NOT NULL,
    "occ_infants" integer DEFAULT 0 NOT NULL,
    "default_occupancy" integer DEFAULT 2 NOT NULL,
    "capacity" integer,
    "room_kind" "text" DEFAULT 'room'::"text" NOT NULL,
    "content_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."room_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "booking_id" "uuid" DEFAULT "gen_random_uuid"(),
    "platform" character varying,
    "status" character varying,
    "message" character varying,
    "synced_at" timestamp without time zone,
    "type" "text",
    "payload" "jsonb"
);


ALTER TABLE "public"."sync_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true NOT NULL,
    "sms_notifications" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "full_name" character varying,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "role" "text" DEFAULT 'owner'::"text" NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "internal"."to_be_deleted_rate_plans"
    ADD CONSTRAINT "to_be_deleted_rate_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_room_type_id_date_key" UNIQUE ("room_type_id", "date");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "booking_channex_booking_id_key" UNIQUE ("channex_booking_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_channex_booking_id_key" UNIQUE ("channex_booking_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifcations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_connections"
    ADD CONSTRAINT "platform_connection_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_connections"
    ADD CONSTRAINT "platform_connections_property_platform_unique" UNIQUE ("property_id", "platform");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_address"
    ADD CONSTRAINT "property_address_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_address"
    ADD CONSTRAINT "property_address_property_id_key" UNIQUE ("property_id");



ALTER TABLE ONLY "public"."property_group_assignments"
    ADD CONSTRAINT "property_group_assignments_pkey" PRIMARY KEY ("property_id", "group_id");



ALTER TABLE ONLY "public"."property_groups"
    ADD CONSTRAINT "property_groups_channex_group_id_key" UNIQUE ("channex_group_id");



ALTER TABLE ONLY "public"."property_groups"
    ADD CONSTRAINT "property_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_photos"
    ADD CONSTRAINT "property_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_plans"
    ADD CONSTRAINT "rate_plans_channex_rate_plan_id_key" UNIQUE ("channex_rate_plan_id");



ALTER TABLE ONLY "public"."rate_plans"
    ADD CONSTRAINT "rate_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restrictions"
    ADD CONSTRAINT "restrictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restrictions"
    ADD CONSTRAINT "restrictions_rate_plan_id_date_key" UNIQUE ("rate_plan_id", "date");



ALTER TABLE ONLY "public"."revision_failures"
    ADD CONSTRAINT "revision_failures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_types"
    ADD CONSTRAINT "room_types_channex_room_type_id_key" UNIQUE ("channex_room_type_id");



ALTER TABLE ONLY "public"."room_types"
    ADD CONSTRAINT "room_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sync_logs"
    ADD CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_to_be_deleted_rate_plans_purged" ON "internal"."to_be_deleted_rate_plans" USING "btree" ("purged_at") WHERE ("purged_at" IS NULL);



CREATE INDEX "availability_date_idx" ON "public"."availability" USING "btree" ("date");



CREATE INDEX "availability_property_id_idx" ON "public"."availability" USING "btree" ("property_id");



CREATE INDEX "availability_room_type_id_idx" ON "public"."availability" USING "btree" ("room_type_id");



CREATE INDEX "bookings_channex_booking_id_idx" ON "public"."bookings" USING "btree" ("channex_booking_id");



CREATE INDEX "bookings_check_in_idx" ON "public"."bookings" USING "btree" ("check_in");



CREATE INDEX "bookings_property_id_idx" ON "public"."bookings" USING "btree" ("property_id");



CREATE INDEX "bookings_status_idx" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_rate_plans_status" ON "public"."rate_plans" USING "btree" ("status");



CREATE INDEX "platform_connections_channex_channel_id_idx" ON "public"."platform_connections" USING "btree" ("channex_channel_id") WHERE ("channex_channel_id" IS NOT NULL);



CREATE INDEX "rate_plans_property_id_idx" ON "public"."rate_plans" USING "btree" ("property_id");



CREATE INDEX "rate_plans_room_type_id_idx" ON "public"."rate_plans" USING "btree" ("room_type_id");



CREATE INDEX "restrictions_date_idx" ON "public"."restrictions" USING "btree" ("date");



CREATE INDEX "restrictions_property_id_idx" ON "public"."restrictions" USING "btree" ("property_id");



CREATE INDEX "restrictions_rate_plan_id_idx" ON "public"."restrictions" USING "btree" ("rate_plan_id");



CREATE UNIQUE INDEX "revision_failures_active_revision_idx" ON "public"."revision_failures" USING "btree" ("revision_id") WHERE ("resolved" = false);



CREATE INDEX "revision_failures_unresolved_age_idx" ON "public"."revision_failures" USING "btree" ("first_failed_at") WHERE ("resolved" = false);



CREATE OR REPLACE TRIGGER "bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_bookings_updated_at"();



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifcations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."platform_connections"
    ADD CONSTRAINT "platform_connection_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."property_address"
    ADD CONSTRAINT "property_address_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_group_assignments"
    ADD CONSTRAINT "property_group_assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."property_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_group_assignments"
    ADD CONSTRAINT "property_group_assignments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_photos"
    ADD CONSTRAINT "property_photos_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rate_plans"
    ADD CONSTRAINT "rate_plans_parent_rate_plan_id_fkey" FOREIGN KEY ("parent_rate_plan_id") REFERENCES "public"."rate_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rate_plans"
    ADD CONSTRAINT "rate_plans_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rate_plans"
    ADD CONSTRAINT "rate_plans_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restrictions"
    ADD CONSTRAINT "restrictions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restrictions"
    ADD CONSTRAINT "restrictions_rate_plan_id_fkey" FOREIGN KEY ("rate_plan_id") REFERENCES "public"."rate_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_types"
    ADD CONSTRAINT "room_types_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Enable delete for authenticated users" ON "public"."property_address" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."property_group_assignments" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."property_groups" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."property_photos" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."properties" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."property_address" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."property_group_assignments" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."property_groups" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."property_photos" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."properties" USING (true);



CREATE POLICY "Enable read for authenticated users" ON "public"."properties" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read for authenticated users" ON "public"."property_address" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read for authenticated users" ON "public"."property_group_assignments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read for authenticated users" ON "public"."property_groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read for authenticated users" ON "public"."property_photos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."properties" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."property_address" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."property_group_assignments" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."property_groups" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."property_photos" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Owner read own" ON "public"."room_types" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "room_types"."property_id") AND ("properties"."user_id" = "auth"."uid"())))));



CREATE POLICY "Superadmin full access" ON "public"."room_types" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text")))));



CREATE POLICY "Users can delete own platform connections" ON "public"."platform_connections" FOR DELETE TO "authenticated" USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own properties" ON "public"."properties" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert addresses for their own properties" ON "public"."property_address" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "property_address"."property_id") AND ("properties"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own platform connections" ON "public"."platform_connections" FOR INSERT TO "authenticated" WITH CHECK (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own properties" ON "public"."properties" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own platform connections" ON "public"."platform_connections" FOR SELECT TO "authenticated" USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own properties" ON "public"."properties" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update addresses of their own properties" ON "public"."property_address" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "property_address"."property_id") AND ("properties"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own platform connections" ON "public"."platform_connections" FOR UPDATE TO "authenticated" USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own properties" ON "public"."properties" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view addresses of their own properties" ON "public"."property_address" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "property_address"."property_id") AND ("properties"."user_id" = "auth"."uid"())))));



CREATE POLICY "authenticated users can read unresolved revision_failures" ON "public"."revision_failures" FOR SELECT TO "authenticated" USING (("resolved" = false));



ALTER TABLE "public"."availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owners can update own notifications" ON "public"."notifications" FOR UPDATE USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "owners can view own bookings" ON "public"."bookings" FOR SELECT USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "owners can view own notifications" ON "public"."notifications" FOR SELECT USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "owners_can_manage_own_rate_plans" ON "public"."rate_plans" TO "authenticated" USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"())))) WITH CHECK (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "owners_can_manage_own_room_types" ON "public"."room_types" USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"())))) WITH CHECK (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "owners_can_select_own_rate_plans" ON "public"."rate_plans" FOR SELECT USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "owners_full_access_availability" ON "public"."availability" USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"())))) WITH CHECK (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



CREATE POLICY "owners_full_access_restrictions" ON "public"."restrictions" USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"())))) WITH CHECK (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."platform_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_address" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_group_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restrictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."revision_failures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."room_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "superadmin can read all preferences" ON "public"."user_preferences" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text")))));



CREATE POLICY "superadmin can read all revision_failures" ON "public"."revision_failures" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text")))));



CREATE POLICY "superadmin can read all rows" ON "public"."users" FOR SELECT USING ((("auth"."uid"() = "id") OR ("public"."get_user_role"("auth"."uid"()) = 'superadmin'::"text")));



CREATE POLICY "superadmin can read all sync_logs" ON "public"."sync_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text")))));



CREATE POLICY "superadmin_full_access_availability" ON "public"."availability" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text")))));



CREATE POLICY "superadmin_full_access_rate_plans" ON "public"."rate_plans" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text")))));



CREATE POLICY "superadmin_full_access_restrictions" ON "public"."restrictions" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text")))));



CREATE POLICY "superadmin_full_access_room_types" ON "public"."room_types" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text")))));



ALTER TABLE "public"."sync_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can insert own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users can insert own row" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users can read own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users can read own row" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "users can update own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users can update own row" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."bookings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_bookings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_bookings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_bookings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_revision_failure"("p_revision_id" "text", "p_booking_id" "text", "p_last_error" "text", "p_error_kind" "text", "p_tried_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_revision_failure"("p_revision_id" "text", "p_booking_id" "text", "p_last_error" "text", "p_error_kind" "text", "p_tried_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_revision_failure"("p_revision_id" "text", "p_booking_id" "text", "p_last_error" "text", "p_error_kind" "text", "p_tried_at" timestamp with time zone) TO "service_role";
























GRANT ALL ON TABLE "public"."availability" TO "anon";
GRANT ALL ON TABLE "public"."availability" TO "authenticated";
GRANT ALL ON TABLE "public"."availability" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."platform_connections" TO "anon";
GRANT ALL ON TABLE "public"."platform_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_connections" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."property_address" TO "anon";
GRANT ALL ON TABLE "public"."property_address" TO "authenticated";
GRANT ALL ON TABLE "public"."property_address" TO "service_role";



GRANT ALL ON TABLE "public"."property_group_assignments" TO "anon";
GRANT ALL ON TABLE "public"."property_group_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."property_group_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."property_groups" TO "anon";
GRANT ALL ON TABLE "public"."property_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."property_groups" TO "service_role";



GRANT ALL ON TABLE "public"."property_photos" TO "anon";
GRANT ALL ON TABLE "public"."property_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."property_photos" TO "service_role";



GRANT ALL ON TABLE "public"."rate_plans" TO "anon";
GRANT ALL ON TABLE "public"."rate_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_plans" TO "service_role";



GRANT ALL ON TABLE "public"."restrictions" TO "anon";
GRANT ALL ON TABLE "public"."restrictions" TO "authenticated";
GRANT ALL ON TABLE "public"."restrictions" TO "service_role";



GRANT ALL ON TABLE "public"."revision_failures" TO "anon";
GRANT ALL ON TABLE "public"."revision_failures" TO "authenticated";
GRANT ALL ON TABLE "public"."revision_failures" TO "service_role";



GRANT ALL ON TABLE "public"."room_types" TO "anon";
GRANT ALL ON TABLE "public"."room_types" TO "authenticated";
GRANT ALL ON TABLE "public"."room_types" TO "service_role";



GRANT ALL ON TABLE "public"."sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































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
