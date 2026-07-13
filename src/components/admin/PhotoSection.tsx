import type { AdminPhoto } from '@/lib/data';
import { getViewUrls } from '@/lib/storage';
import { togglePhoto } from '@/app/admin/actions';

export default async function PhotoSection({
  photos,
}: {
  photos: AdminPhoto[];
}) {
  const urls = await getViewUrls(photos.map((p) => p.storagePath));

  return (
    <section>
      <h2 className="text-xl font-semibold">Photos</h2>
      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((p) => (
          <li
            key={p.id}
            className={`rounded-md border p-2 ${
              p.approved ? 'border-ink-faded/30' : 'border-wax bg-wax/5'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- signed URL */}
            <img
              src={urls.get(p.storagePath)}
              alt={p.uploaderName ?? ''}
              className="aspect-square w-full object-cover"
            />
            <p className="mt-1 truncate text-xs text-ink-faded">
              {p.uploaderName} · {p.approved ? 'visible' : 'hidden'}
            </p>
            <form action={togglePhoto}>
              <input type="hidden" name="id" value={p.id} />
              <input
                type="hidden"
                name="approved"
                value={String(!p.approved)}
              />
              <button type="submit" className="text-sm underline">
                {p.approved ? 'Hide' : 'Approve'}
              </button>
            </form>
          </li>
        ))}
        {photos.length === 0 && (
          <li className="col-span-full text-sm text-ink-faded">
            No photos yet.
          </li>
        )}
      </ul>
    </section>
  );
}
