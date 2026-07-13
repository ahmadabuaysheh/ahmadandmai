import { describe, it, expect } from 'vitest';
import { topScores } from '@/lib/quiz/leaderboard';
import type { QuizScore } from '@/lib/data';

const row = (name: string, score: number, createdAt: string): QuizScore => ({
  name,
  score,
  createdAt,
});

describe('topScores', () => {
  it('keeps only the best score per name', () => {
    const rows = [
      row('Omar', 3, '2026-01-01T10:00:00Z'),
      row('Omar', 5, '2026-01-02T10:00:00Z'),
      row('Sara', 4, '2026-01-01T11:00:00Z'),
    ];
    expect(topScores(rows).map((r) => [r.name, r.score])).toEqual([
      ['Omar', 5],
      ['Sara', 4],
    ]);
  });

  it('breaks equal-score ties by earliest achievement', () => {
    const rows = [
      row('Sara', 5, '2026-01-02T10:00:00Z'),
      row('Omar', 5, '2026-01-01T10:00:00Z'),
    ];
    expect(topScores(rows).map((r) => r.name)).toEqual(['Omar', 'Sara']);
  });

  it('uses the earliest attempt of a repeated best score', () => {
    const rows = [
      row('Omar', 5, '2026-01-03T10:00:00Z'),
      row('Omar', 5, '2026-01-01T10:00:00Z'),
      row('Sara', 5, '2026-01-02T10:00:00Z'),
    ];
    expect(topScores(rows).map((r) => r.name)).toEqual(['Omar', 'Sara']);
  });

  it('truncates to the limit', () => {
    const rows = Array.from({ length: 15 }, (_, i) =>
      row(`Guest ${i}`, i, '2026-01-01T00:00:00Z'),
    );
    expect(topScores(rows)).toHaveLength(10);
    expect(topScores(rows, 3)).toHaveLength(3);
  });

  it('handles empty input', () => {
    expect(topScores([])).toEqual([]);
  });
});
