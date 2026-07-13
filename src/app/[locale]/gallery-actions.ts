'use server';

import { randomUUID } from 'node:crypto';
import { getDataStore } from '@/lib/data';
import { getGuestContext } from '@/lib/invite/guest-context';
import {
  extensionOf,
  isServerUploadPath,
  tokenMatches,
  validUploadName,
} from '@/lib/gallery/validate';
import { createUploadUrl } from '@/lib/storage';

export type UploadAuth =
  | { kind: 'invite' }
  | { kind: 'token'; token: string };

async function authorized(auth: UploadAuth): Promise<boolean> {
  if (auth.kind === 'invite') {
    const guest = await getGuestContext();
    return guest.tier !== 'public';
  }
  const settings = await getDataStore().getSettings();
  return tokenMatches(auth.token, settings.uploadToken);
}

export async function createPhotoUpload(
  auth: UploadAuth,
  filename: string,
): Promise<{ path: string; signedUrl: string } | { error: true }> {
  if (!(await authorized(auth))) return { error: true };
  const ext = extensionOf(filename);
  if (!ext) return { error: true };
  const upload = await createUploadUrl(`uploads/${randomUUID()}.${ext}`);
  return upload ?? { error: true };
}

export async function finalizePhotoUpload(
  auth: UploadAuth,
  path: string,
  uploaderName: string,
): Promise<{ status: 'ok' | 'error' }> {
  if (!(await authorized(auth))) return { status: 'error' };
  if (!isServerUploadPath(path)) return { status: 'error' };

  let name: string | null;
  if (auth.kind === 'invite') {
    const guest = await getGuestContext();
    name = guest.guestNames.includes(uploaderName) ? uploaderName : null;
  } else {
    name = validUploadName(uploaderName);
  }
  if (!name) return { status: 'error' };

  try {
    await getDataStore().addPhoto({ uploaderName: name, storagePath: path });
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}
