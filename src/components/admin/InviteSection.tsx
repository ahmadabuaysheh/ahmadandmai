import type { Invite } from '@/lib/data';
import { saveInvite } from '@/app/admin/actions';

export default function InviteSection({ invites }: { invites: Invite[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">Invites</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b [&>th]:py-1 [&>th]:pe-3 [&>th]:text-start">
              <th>Code</th>
              <th>Guests</th>
              <th>Tier</th>
              <th>Max party</th>
              <th>Lang</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((i) => (
              <tr
                key={i.code}
                className="border-b border-ink-faded/20 [&>td]:py-1 [&>td]:pe-3"
              >
                <td className="font-mono">{i.code}</td>
                <td>{i.guestNames.join(', ')}</td>
                <td>{i.tier}</td>
                <td>{i.maxPartySize}</td>
                <td>{i.languagePref ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        action={saveInvite}
        className="mt-4 grid max-w-md gap-3 rounded-md border border-ink-faded/30 p-4"
      >
        <p className="text-sm font-medium">Add or update an invite</p>
        <input
          name="code"
          placeholder="Code (e.g. FAM01)"
          className="rounded-md border border-ink-faded/40 px-3 py-2"
        />
        <input
          name="guestNames"
          placeholder="Guest names, comma-separated"
          className="rounded-md border border-ink-faded/40 px-3 py-2"
        />
        <select
          name="tier"
          defaultValue="full"
          className="rounded-md border border-ink-faded/40 px-3 py-2"
        >
          <option value="full">full — sees everything</option>
          <option value="save_the_date">save_the_date — teasers only</option>
        </select>
        <input
          name="maxPartySize"
          type="number"
          min={1}
          max={20}
          defaultValue={2}
          className="rounded-md border border-ink-faded/40 px-3 py-2"
        />
        <select
          name="languagePref"
          defaultValue=""
          className="rounded-md border border-ink-faded/40 px-3 py-2"
        >
          <option value="">no language preference</option>
          <option value="en">English</option>
          <option value="ar">Arabic</option>
        </select>
        <button
          type="submit"
          className="justify-self-start rounded-md bg-ink px-4 py-2 text-paper"
        >
          Save invite
        </button>
      </form>
    </section>
  );
}
