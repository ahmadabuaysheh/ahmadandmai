'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data';
import {
  ADMIN_COOKIE,
  passphraseMatches,
  requireAdmin,
  signAdminCookie,
} from '@/lib/admin/auth';
import { parseInviteForm, parseSettingsForm } from '@/lib/admin/forms';

export async function loginAdmin(formData: FormData): Promise<void> {
  const passphrase = String(formData.get('passphrase') ?? '');
  const signed = signAdminCookie();
  if (!passphraseMatches(passphrase) || !signed) {
    redirect('/admin?error=1');
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, signed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/admin',
  });
  redirect('/admin');
}

export async function logoutAdmin(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect('/admin');
}

async function guard(): Promise<void> {
  if (!(await requireAdmin())) redirect('/admin');
}

export async function toggleGuestbook(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get('id') ?? '');
  const approved = String(formData.get('approved')) === 'true';
  if (id) await getDataStore().setGuestbookApproval(id, approved);
  revalidatePath('/admin');
}

export async function togglePhoto(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get('id') ?? '');
  const approved = String(formData.get('approved')) === 'true';
  if (id) await getDataStore().setPhotoApproval(id, approved);
  revalidatePath('/admin');
}

export async function saveSettings(formData: FormData): Promise<void> {
  await guard();
  const store = getDataStore();
  const current = await store.getSettings();
  const next = parseSettingsForm(
    {
      weddingDate: String(formData.get('weddingDate') ?? ''),
      venueName: String(formData.get('venueName') ?? ''),
      venueAddress: String(formData.get('venueAddress') ?? ''),
      venueMapUrl: String(formData.get('venueMapUrl') ?? ''),
      galleryMode: String(formData.get('galleryMode') ?? ''),
    },
    current,
  );
  if (next) await store.updateSettings(next);
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

export async function saveInvite(formData: FormData): Promise<void> {
  await guard();
  const invite = parseInviteForm({
    code: String(formData.get('code') ?? ''),
    guestNames: String(formData.get('guestNames') ?? ''),
    tier: String(formData.get('tier') ?? ''),
    maxPartySize: String(formData.get('maxPartySize') ?? ''),
    languagePref: String(formData.get('languagePref') ?? ''),
  });
  if (invite) await getDataStore().upsertInvite(invite);
  revalidatePath('/admin');
}
