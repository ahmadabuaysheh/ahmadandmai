import type { Settings } from '@/lib/data';
import { saveSettings } from '@/app/admin/actions';

export default function SettingsSection({ settings }: { settings: Settings }) {
  const dateValue = settings.weddingDateIso
    ? settings.weddingDateIso.slice(0, 16)
    : '';

  return (
    <section>
      <h2 className="text-xl font-semibold">Settings</h2>
      <form action={saveSettings} className="mt-3 grid max-w-md gap-3">
        <label className="grid gap-1 text-sm">
          Wedding date &amp; time (GMT+3)
          <input
            type="datetime-local"
            name="weddingDate"
            defaultValue={dateValue}
            className="rounded-md border border-ink-faded/40 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Venue name (empty = hidden/teaser)
          <input
            name="venueName"
            defaultValue={settings.venue?.name ?? ''}
            className="rounded-md border border-ink-faded/40 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Venue address
          <input
            name="venueAddress"
            defaultValue={settings.venue?.address ?? ''}
            className="rounded-md border border-ink-faded/40 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Map URL
          <input
            name="venueMapUrl"
            defaultValue={settings.venue?.mapUrl ?? ''}
            className="rounded-md border border-ink-faded/40 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Gallery mode
          <select
            name="galleryMode"
            defaultValue={settings.galleryMode}
            className="rounded-md border border-ink-faded/40 px-3 py-2"
          >
            <option value="couple">couple (our photos)</option>
            <option value="guests">guests (upload wall)</option>
          </select>
        </label>
        <button
          type="submit"
          className="justify-self-start rounded-md bg-ink px-4 py-2 text-paper"
        >
          Save settings
        </button>
      </form>
    </section>
  );
}
