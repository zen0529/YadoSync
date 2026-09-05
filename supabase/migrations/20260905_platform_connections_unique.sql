-- Add unique constraint on (property_id, platform) to allow upsert by property and platform
ALTER TABLE platform_connections
  ADD CONSTRAINT platform_connections_property_platform_unique
  UNIQUE (property_id, platform);
