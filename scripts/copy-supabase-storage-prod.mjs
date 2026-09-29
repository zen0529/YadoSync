import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const projectRef = 'pwcdgzliwavpfykohntc';
const bucket = 'yadoManagement';
const serviceKey = process.env.PROD_SERVICE_ROLE_KEY;
if (!serviceKey) throw new Error('PROD_SERVICE_ROLE_KEY is required');

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const photoDir = path.resolve(scriptDir, '../migration-backups/storage-files/property-photos');
const client = createClient(`https://${projectRef}.supabase.co`, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const files = (await readdir(photoDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();
if (files.length !== 9) throw new Error(`Expected 9 staging objects, found ${files.length}`);

for (const name of files) {
  const data = await readFile(path.join(photoDir, name));
  const objectPath = `property-photos/${name}`;
  const contentType = name.endsWith('.jpg') ? 'image/jpeg'
    : name.endsWith('.png') ? 'image/png'
      : 'application/octet-stream';
  const { error: uploadError } = await client.storage.from(bucket).upload(
    objectPath,
    data,
    { upsert: true, contentType, cacheControl: '3600' },
  );
  if (uploadError) throw new Error(`Upload failed for ${objectPath}: ${uploadError.message}`);

  const { data: downloaded, error: downloadError } = await client.storage
    .from(bucket).download(objectPath);
  if (downloadError) throw new Error(`Verify download failed for ${objectPath}: ${downloadError.message}`);
  const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
  if (digest(data) !== digest(Buffer.from(await downloaded.arrayBuffer()))) {
    throw new Error(`Checksum mismatch for ${objectPath}`);
  }
  process.stdout.write(`Verified ${objectPath}\n`);
}

process.stdout.write(`Copied and verified ${files.length} Storage objects in Prod.\n`);
