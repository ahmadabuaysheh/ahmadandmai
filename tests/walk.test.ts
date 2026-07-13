import { describe, it, expect } from 'vitest';
import { walkProgress } from '@/lib/walk';

describe('walkProgress', () => {
  const start = '2026-07-13T00:00:00+03:00';
  const target = '2026-11-15T16:00:00+03:00';

  it('is 0 at the start and 1 at the target', () => {
    expect(walkProgress(start, target, Date.parse(start))).toBe(0);
    expect(walkProgress(start, target, Date.parse(target))).toBe(1);
  });

  it('is halfway in the middle and clamps outside the range', () => {
    const mid = (Date.parse(start) + Date.parse(target)) / 2;
    expect(walkProgress(start, target, mid)).toBeCloseTo(0.5, 5);
    expect(walkProgress(start, target, Date.parse(start) - 1000)).toBe(0);
    expect(walkProgress(start, target, Date.parse(target) + 1000)).toBe(1);
  });

  it('returns 1 for degenerate ranges', () => {
    expect(walkProgress(target, target, Date.parse(start))).toBe(1);
  });
});
