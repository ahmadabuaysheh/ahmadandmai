import { describe, it, expect } from 'vitest';
import { countdownTo } from '@/lib/countdown';

describe('countdownTo', () => {
  const target = '2027-05-21T16:00:00+03:00';

  it('computes full parts for a future date', () => {
    const now = Date.parse('2027-05-19T16:00:00+03:00'); // exactly 2 days
    expect(countdownTo(target, now)).toEqual({
      days: 2,
      hours: 0,
      minutes: 0,
      seconds: 0,
      done: false,
    });
  });

  it('computes mixed parts', () => {
    const now = Date.parse('2027-05-20T13:58:30+03:00');
    expect(countdownTo(target, now)).toEqual({
      days: 1,
      hours: 2,
      minutes: 1,
      seconds: 30,
      done: false,
    });
  });

  it('clamps to zero once the moment passes', () => {
    const now = Date.parse('2027-05-21T16:00:01+03:00');
    expect(countdownTo(target, now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      done: true,
    });
  });
});
