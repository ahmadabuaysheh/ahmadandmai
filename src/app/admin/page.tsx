import { getDataStore } from '@/lib/data';
import { requireAdmin } from '@/lib/admin/auth';
import { loginAdmin, logoutAdmin } from './actions';
import RsvpSection from '@/components/admin/RsvpSection';
import GuestbookSection from '@/components/admin/GuestbookSection';
import PhotoSection from '@/components/admin/PhotoSection';
import SettingsSection from '@/components/admin/SettingsSection';
import InviteSection from '@/components/admin/InviteSection';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!(await requireAdmin())) {
    return (
      <main>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <form action={loginAdmin} className="mt-6 flex max-w-sm flex-col gap-2">
          <input
            type="password"
            name="passphrase"
            placeholder="Passphrase"
            autoFocus
            className="rounded-md border border-ink-faded/40 px-3 py-2"
          />
          {error && <p className="text-sm text-wax">Wrong passphrase.</p>}
          <button
            type="submit"
            className="rounded-md bg-ink px-4 py-2 text-paper"
          >
            Enter
          </button>
        </form>
      </main>
    );
  }

  const store = getDataStore();
  const [rsvps, guestbook, photos, settings, invites] = await Promise.all([
    store.listAllRsvps(),
    store.listGuestbook(),
    store.listAllPhotos(),
    store.getSettings(),
    store.listInvites(),
  ]);

  return (
    <main className="space-y-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ahmad &amp; Mai — Admin</h1>
        <form action={logoutAdmin}>
          <button type="submit" className="text-sm underline">
            Log out
          </button>
        </form>
      </header>
      <RsvpSection rsvps={rsvps} />
      <GuestbookSection notes={guestbook} />
      <PhotoSection photos={photos} />
      <SettingsSection settings={settings} />
      <InviteSection invites={invites} />
    </main>
  );
}
