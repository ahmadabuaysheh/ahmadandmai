import type { AdminGuestbookNote } from '@/lib/data';
import { toggleGuestbook } from '@/app/admin/actions';

export default function GuestbookSection({
  notes,
}: {
  notes: AdminGuestbookNote[];
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold">Guestbook</h2>
      <ul className="mt-3 space-y-2">
        {notes.map((n) => (
          <li
            key={n.id}
            className={`flex items-start justify-between gap-3 rounded-md border p-3 ${
              n.approved ? 'border-ink-faded/30' : 'border-wax bg-wax/5'
            }`}
          >
            <div>
              <p className="text-sm">{n.note}</p>
              <p className="mt-1 text-xs text-ink-faded">
                — {n.name} ({n.inviteCode}) ·{' '}
                {n.approved ? 'visible' : 'hidden'}
              </p>
            </div>
            <form action={toggleGuestbook}>
              <input type="hidden" name="id" value={n.id} />
              <input
                type="hidden"
                name="approved"
                value={String(!n.approved)}
              />
              <button type="submit" className="text-sm underline">
                {n.approved ? 'Hide' : 'Approve'}
              </button>
            </form>
          </li>
        ))}
        {notes.length === 0 && (
          <li className="text-sm text-ink-faded">No notes yet.</li>
        )}
      </ul>
    </section>
  );
}
