import type { QuizScore } from '@/lib/data';

export function topScores(rows: QuizScore[], limit = 10): QuizScore[] {
  const best = new Map<string, QuizScore>();
  for (const r of rows) {
    const cur = best.get(r.name);
    if (
      !cur ||
      r.score > cur.score ||
      (r.score === cur.score && r.createdAt < cur.createdAt)
    ) {
      best.set(r.name, r);
    }
  }
  return [...best.values()]
    .sort(
      (a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt),
    )
    .slice(0, limit);
}
