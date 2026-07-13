import type { RsvpRow } from '@/lib/data';

export default function RsvpSection({ rsvps }: { rsvps: RsvpRow[] }) {
  const attending = rsvps.filter((r) => r.attending);
  const declined = rsvps.filter((r) => !r.attending);
  const meals = new Map<string, number>();
  for (const r of attending) {
    if (r.meal) meals.set(r.meal, (meals.get(r.meal) ?? 0) + 1);
  }

  return (
    <section>
      <h2 className="text-xl font-semibold">RSVPs</h2>
      <p className="mt-1 text-sm text-ink-faded">
        {attending.length} attending · {declined.length} declined
        {[...meals.entries()].map(([m, n]) => ` · ${m}: ${n}`).join('')}
      </p>
      <p className="mt-2 flex gap-4 text-sm">
        <a href="/admin/export/rsvps" className="underline">
          Download rsvps.csv
        </a>
        <a href="/admin/export/songs" className="underline">
          Download songs.txt
        </a>
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b [&>th]:py-1 [&>th]:pe-3 [&>th]:text-start">
              <th>Code</th>
              <th>Guest</th>
              <th>Attending</th>
              <th>Meal</th>
              <th>Song</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {rsvps.map((r, i) => (
              <tr
                key={i}
                className="border-b border-ink-faded/20 [&>td]:py-1 [&>td]:pe-3"
              >
                <td>{r.inviteCode}</td>
                <td>{r.guestName}</td>
                <td>{r.attending ? 'yes' : 'no'}</td>
                <td>{r.meal}</td>
                <td>{r.songRequest}</td>
                <td className="max-w-48 truncate" title={r.message ?? ''}>
                  {r.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rsvps.length === 0 && (
          <p className="mt-2 text-sm text-ink-faded">No replies yet.</p>
        )}
      </div>
    </section>
  );
}
