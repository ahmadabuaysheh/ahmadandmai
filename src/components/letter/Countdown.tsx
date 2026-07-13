'use client';

import { useEffect, useState } from 'react';
import { countdownTo, type CountdownParts } from '@/lib/countdown';

export default function Countdown({
  targetIso,
  label,
}: {
  targetIso: string;
  label: string;
}) {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const tick = () => setParts(countdownTo(targetIso, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!parts || parts.done) return null;

  const cells: [number, string][] = [
    [parts.days, 'd'],
    [parts.hours, 'h'],
    [parts.minutes, 'm'],
    [parts.seconds, 's'],
  ];

  return (
    <div className="mt-6 text-center">
      <p className="text-sm italic text-ink-faded">{label}</p>
      <div className="mt-2 flex justify-center gap-3" dir="ltr">
        {cells.map(([value, unit]) => (
          <span
            key={unit}
            className="min-w-14 rounded-md bg-paper-deep px-2 py-3 text-2xl tabular-nums shadow-inner"
          >
            {String(value).padStart(2, '0')}
            <span className="block text-xs text-ink-faded">{unit}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
