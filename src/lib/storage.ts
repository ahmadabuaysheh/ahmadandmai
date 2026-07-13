import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'photos';

function storageClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export async function getViewUrls(
  paths: string[],
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const client = storageClient();
  if (!client) return new Map(paths.map((p) => [p, p])); // env-less dev
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrls(paths, 3600);
  if (error || !data) return new Map();
  const entries: [string, string][] = [];
  for (const d of data) {
    if (d.path && d.signedUrl) entries.push([d.path, d.signedUrl]);
  }
  return new Map(entries);
}

export async function createUploadUrl(
  path: string,
): Promise<{ path: string; signedUrl: string } | null> {
  const client = storageClient();
  if (!client) return null;
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) return null;
  return { path: data.path, signedUrl: data.signedUrl };
}
