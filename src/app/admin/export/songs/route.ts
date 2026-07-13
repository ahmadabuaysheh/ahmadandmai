import { getDataStore } from '@/lib/data';
import { requireAdmin } from '@/lib/admin/auth';
import { songsToText } from '@/lib/admin/csv';

export async function GET(): Promise<Response> {
  if (!(await requireAdmin())) {
    return new Response('Unauthorized', { status: 401 });
  }
  const rows = await getDataStore().listAllRsvps();
  return new Response(songsToText(rows), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="songs.txt"',
    },
  });
}
