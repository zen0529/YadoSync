-- ============================================================
-- Phase 5: OTA Channel Connections — extend platform_connections
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- NOTE: The table is platform_connections (plural) in the DB.
-- ============================================================

-- Add Channex channel columns to the existing platform_connections table.
-- channex_channel_id  — UUID returned by POST /channels (needed for activate/deactivate/delete)
-- channex_group_id    — Channex group UUID used when creating the channel (required by API)
-- ota_hotel_id        — hotel_id entered by the property owner (Booking.com extranet ID, etc.)
-- mapping_payload     — the rate_plan[] mapping sent to Channex (stored for audit / re-sync)

ALTER TABLE platform_connections
  ADD COLUMN IF NOT EXISTS channex_channel_id  uuid,
  ADD COLUMN IF NOT EXISTS channex_group_id    uuid,
  ADD COLUMN IF NOT EXISTS ota_hotel_id        text,
  ADD COLUMN IF NOT EXISTS mapping_payload     jsonb;

-- Index for fast lookup when deactivating / deleting by channel id
CREATE INDEX IF NOT EXISTS platform_connections_channex_channel_id_idx
  ON platform_connections (channex_channel_id)
  WHERE channex_channel_id IS NOT NULL;
