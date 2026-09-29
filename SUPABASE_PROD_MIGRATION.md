# Supabase staging to Prod migration

Migration started on 2026-09-29 from `jjuukcyauernljhudnyo`
(`yadoManagement-staging`) to the existing project `pwcdgzliwavpfykohntc`
(`yadoManagement-Prod`). The projects are in different organizations, but the
same saved Supabase CLI login can access both. Clear this session's
`SUPABASE_ACCESS_TOKEN` override before Prod CLI commands; it sees staging
only.

## Completed

- Staging's `yadosync-poll-booking-feed` and `yadosync-full-sync-ari` cron jobs
  were set inactive. Their schedules remain for rollback. The final schema
  and data export is in ignored `migration-backups/`; keep it private and out
  of Git because it contains Auth and application data.
- Schema, Auth users, application rows, and Storage metadata were restored
  into Prod in one CLI migration. Prod has 4 Auth users with password hashes,
  4 profiles, 3 properties, 12 room types, 16 rate plans, 6,655 availability
  rows, and 9 Storage records. The signup trigger and Realtime publications
  are present. Owner/superadmin RLS was tightened, app users cannot edit
  `public.users.role`, and public Storage writes were removed.
- All 9 Storage file bytes were uploaded to Prod and verified by SHA-256 after
  downloading them back. Four `property_photos.url` values now use Prod's
  Storage host. The source export contained no other staging project URLs.
- All 19 deployed staging Edge Function bundles were copied to Prod. Five
  additional tax/photo functions added during migration were later removed
  from Prod and this repo at the user's request, so the deployed function
  lists now match. Browser code no longer reads Channex or Resend keys.
  The 19 copied bundles came from deployed staging snapshots in the ignored
  backup folder. Some local function source files differ; reconcile them with
  those snapshots before redeploying the existing functions from this repo.
  `channex-webhook` and `registerWebhook` were not deployed in staging or
  Prod; automatic booking ingestion currently depends on feed polling.
  The inactive tax-set panel and its callers were removed. Property updates
  still pass photo changes to `updateProperty`, but removed Storage files are
  retained because the separate Channex photo deletion route was removed.
- Prod's `CHANNEX_API_KEY` and `CHANNEX_BASE_URL` secrets were set. The key
  digest matches staging. A manual call to Prod's `pollBookingFeed` succeeded.
  No recurring jobs were created in Prod. The unused Vault copy of Prod's
  service-role key from the cancelled cron plan was removed.
- The repository's Supabase link and ignored local `.env` point to Prod. The
  13 historical SQL files were preserved in `supabase/migration-history-archive/`.
  `supabase/migrations/20260929100000_full_staging_restore.sql` is a
  **schema-only** baseline with the same version as Prod's restore record.
  `supabase db push --dry-run` reports Prod is up to date. One-time user data
  and Storage bytes are deliberately absent from Git.

## Required to finish the live cutover

1. **Finish the AWS EventBridge/Lambda replacements.** The user
   explicitly declined creating Prod Supabase cron jobs and plans to use AWS
   EventBridge with Lambda. Both Supabase cron jobs remain **off in Prod**, and
   staging's equivalents are inactive. Until the AWS schedule is confirmed
   running, automatic Channex booking ingestion is unverified; the hourly ARI
   correction push is also unverified. Have Lambda POST to Prod's
   `/functions/v1/pollBookingFeed` (body `{"source":"aws-eventbridge"}`)
   and `/functions/v1/fullSyncARI` (same body) using the **Prod** service-role
   key in the `Authorization: Bearer` and `apikey` headers. Store that key in
   AWS Secrets Manager. Schedule the booking poll once per minute and full
   sync hourly when the user is ready, prevent overlapping poller runs, and
   monitor failures. Keep only one booking poller active for the shared
   Channex account. A manual Lambda test of `pollBookingFeed` returned HTTP
   200 with no pending revisions; the recurring schedule has not been verified.
2. **Switch the hosted frontend.** Set Vercel's production
   `VITE_SUPABASE_URL` to `https://pwcdgzliwavpfykohntc.supabase.co` and
   `VITE_SUPABASE_ANON_KEY` to Prod's **anon** key, then redeploy. Never put a
   Channex or Resend key in a `VITE_*` variable. This workspace has no Vercel
   project link or CLI login; the hosted frontend remains unchanged. Do not
   enter new data through the hosted app before redeployment: it still writes
   to staging and those changes will diverge from the copied Prod data. Get its
   actual production URL and set it as Prod Supabase Auth's Site URL/redirect
   allow list. Both projects currently use `http://localhost:3000`.
3. **Configure onboarding email.** The deployed `createProperty` function
   uses `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, and `SMTP_PASSWORD` to send a
   temporary owner password. These secrets are absent in Prod. Supabase only
   exposes hashes for existing staging function secrets; obtain the actual
   credentials from their owner and enter them directly in Prod's dashboard.
   Do not paste them into chat or commit them to Git.
4. **Verify with real accounts.** Sign in to Prod as an existing owner and
   superadmin. Check owner isolation, role lookup, photos, tax reads, and a
   harmless function call. Copied Auth hashes allow existing passwords, but
   the new project's JWT keys require users to sign in again.
5. **Check external Channex photo URLs before retiring staging.** The four
   database links use Prod Storage, but Channex may still store staging URLs.
   Keep staging Storage available until those references have been updated.
6. **Rotate historically exposed keys.** The earlier tracked `.env.example`
   contained browser Channex/Resend keys. Its current contents are scrubbed,
   and frontend code no longer uses them. Old Git history and browser builds
   may still contain the values. Rotate both provider keys after all clients
   and Prod secrets have been updated.

Supabase rejected copying staging's email template text to Prod's free-tier
default email provider: template modification requires a paid plan or custom
SMTP. The non-template Auth settings, including enabled email login, matched.
Prod currently uses its default email templates.

## Rollback

Stop any AWS jobs before reactivating staging's jobs with
`cron.alter_job(jobid, active := true)` for the two named jobs. Point the
hosted frontend back to staging only after reconciling any bookings or edits
already written to Prod. Keep staging Storage and the ignored backup files.

## References

- [Supabase backup and restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase Auth user migration](https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects)
- [Supabase Edge Function secrets](https://supabase.com/docs/guides/functions/secrets)
- [Supabase Auth config API](https://supabase.com/docs/reference/api/v1-get-auth-service-config)
- [Vite environment variables](https://vite.dev/guide/env-and-mode)
