// Isolated PostgreSQL regression test; never connects to a hosted database.
// npm install --prefix node_modules/.cache/sync-notification-tests --no-save --package-lock=false @electric-sql/pglite
// node supabase/tests/bookingSyncNotifications.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "../../node_modules/.cache/sync-notification-tests/node_modules/@electric-sql/pglite/dist/index.js";

const db = new PGlite();
const a = "00000000-0000-0000-0000-000000000001";
const b = "00000000-0000-0000-0000-000000000002";
const admin = "00000000-0000-0000-0000-000000000003";
try {
  // Minimal pre-migration schema with the production roles, grants and policies.
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE TABLE public.users (id uuid PRIMARY KEY, role text);
    INSERT INTO public.users VALUES ('${a}', 'owner'), ('${b}', 'owner'), ('${admin}', 'superadmin');
    CREATE TABLE public.properties (id uuid PRIMARY KEY, user_id uuid, name text, channex_property_id text);
    INSERT INTO public.properties VALUES ('${a}', '${a}', 'Property A', 'channel-a'), ('${b}', '${b}', 'Property B', 'channel-b');
    ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
    CREATE POLICY owner_properties ON public.properties FOR SELECT TO authenticated USING (user_id = auth.uid());
    CREATE TABLE public.bookings (channex_booking_id text, property_id uuid, ota_reservation_code text);
    CREATE TABLE public.revision_failures (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), revision_id text NOT NULL, booking_id text,
      attempt_count integer NOT NULL DEFAULT 1, last_error text, error_kind text CHECK (error_kind IN ('transient', 'permanent')),
      first_failed_at timestamptz NOT NULL DEFAULT now(), last_tried_at timestamptz NOT NULL DEFAULT now(),
      resolved boolean NOT NULL DEFAULT false, resolved_at timestamptz
    );
    CREATE UNIQUE INDEX revision_failures_active_revision_idx ON public.revision_failures(revision_id) WHERE resolved = false;
    ALTER TABLE public.revision_failures ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "authenticated users can read unresolved revision_failures" ON public.revision_failures FOR SELECT TO authenticated USING (NOT resolved);
    CREATE POLICY "superadmin can read all revision_failures" ON public.revision_failures FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
    );
    CREATE TABLE public.notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
      property_id uuid REFERENCES public.properties(id), type varchar, channel varchar, status varchar,
      sent_at timestamp, message text, booking_id text
    );
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    CREATE FUNCTION public.upsert_revision_failure(text,text,text,text,timestamptz) RETURNS void LANGUAGE sql AS $$ SELECT $$;
    CREATE PUBLICATION supabase_realtime;
  `);
  await db.exec(await readFile(new URL("../migrations/20260930120000_booking_sync_notifications.sql", import.meta.url), "utf8"));
  const record = (id, kind = "transient", property = "channel-a") => db.query(
    "SELECT public.record_booking_sync_failure($1, $2, $3, $4, $5, $6)",
    [id, `booking-${id}`, "PRIVATE DATABASE ERROR", kind, property, `REF-${id}`],
  );
  const dispatch = async () => (await db.query("SELECT public.dispatch_booking_sync_notifications() AS count")).rows[0].count;
  const count = async (where = "true") => Number((await db.query(`SELECT count(*) FROM public.notifications WHERE ${where}`)).rows[0].count);

  await record("transient");
  assert.equal(await dispatch(), 0, "short transient stays silent");
  await db.exec("UPDATE revision_failures SET first_failed_at = now() - interval '25 minutes' WHERE revision_id = 'transient'");
  assert.equal(await dispatch(), 1, "aged local incident alerts without a feed revision or booking row");
  await record("transient");
  await db.exec("UPDATE notifications SET status = 'read'");
  assert.equal(await dispatch(), 0, "retry cannot duplicate or reset a read alert");
  assert.equal((await db.query("SELECT status FROM notifications")).rows[0].status, "read");
  assert.equal((await db.query("SELECT attempt_count FROM revision_failures")).rows[0].attempt_count, 2);

  await record("permanent", "permanent", "channel-b");
  assert.equal(await dispatch(), 1, "permanent failure alerts immediately");
  await record("unmapped", "permanent", "unknown");
  assert.equal(await dispatch(), 0, "unknown property cannot notify arbitrary owners");
  await db.exec(`INSERT INTO properties VALUES (gen_random_uuid(), '${a}', 'Duplicate mapping', 'channel-a')`);
  await record("ambiguous", "permanent");
  assert.equal(await dispatch(), 0, "ambiguous mapping cannot disclose a booking");
  await db.exec(`DELETE FROM properties WHERE name = 'Duplicate mapping'`);
  assert.equal(await dispatch(), 1, "mapping repaired later allows durable delivery");
  assert.equal(await count("message LIKE '%PRIVATE DATABASE ERROR%'"), 0);

  await record("quiet-success");
  await db.exec("UPDATE revision_failures SET resolved = true, resolved_at = now() WHERE revision_id IN ('transient', 'quiet-success')");
  assert.equal(await dispatch(), 1, "only a previously alerted incident gets a restored event");
  assert.equal(await dispatch(), 0, "restored event is sent once");
  assert.equal(await count("type = 'booking_sync_restored'"), 1);

  await record("delivery-retry", "permanent");
  await db.exec("ALTER TABLE notifications ADD CONSTRAINT simulate_delivery_failure CHECK (sync_revision_id <> 'delivery-retry')");
  await assert.rejects(dispatch, /simulate_delivery_failure/);
  await db.exec("ALTER TABLE notifications DROP CONSTRAINT simulate_delivery_failure");
  assert.equal(await dispatch(), 1, "failed notification delivery retries from durable incident state");

  await db.exec(`INSERT INTO notifications(property_id,type,channel,status,message) VALUES ('${a}','booking_modified','email','sent','Email only')`);
  await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${a}'`);
  const ownerRows = (await db.query("SELECT * FROM notifications")).rows;
  assert.ok(ownerRows.length > 0);
  assert.ok(ownerRows.every((row) => row.property_id === a && row.channel === "in_app"));
  assert.equal((await db.query("SELECT * FROM revision_failures")).rows.length, 0, "raw failures hidden from owner");
  assert.equal((await db.query(`UPDATE notifications SET status = 'read' WHERE property_id = '${b}' RETURNING id`)).rows.length, 0);
  await db.exec("UPDATE notifications SET status = 'read'");
  await assert.rejects(() => db.exec("UPDATE notifications SET message = 'rewritten'"), /permission denied/);
  await assert.rejects(() => db.exec("UPDATE notifications SET status = 'sent'"), /row-level security/);
  await assert.rejects(dispatch, /permission denied/);
  await assert.rejects(() => record("forged"), /permission denied/);
  await db.exec(`SET request.jwt.claim.sub = '${b}'`);
  assert.equal(await count(), 1, "second owner sees only their incident");
  await db.exec(`SET request.jwt.claim.sub = '${admin}'`);
  assert.ok((await db.query("SELECT * FROM revision_failures")).rows.length > 0, "admin retains raw failure access");
  await db.exec("RESET ROLE; SET ROLE service_role");
  assert.equal(await dispatch(), 0, "backend retains execution rights");
  console.log("PASS: notification thresholds, ownership mapping, deduplication, recovery, retry, owner RLS and backend privileges");
} finally {
  await db.close();
}
