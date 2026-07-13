'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { walkProgress } from '@/lib/walk';

// The figures started walking the day the site went live.
const JOURNEY_START = '2026-07-13T00:00:00+03:00';

function Figure({ x, flip, bob }: { x: number; flip: boolean; bob: boolean }) {
  return (
    <g transform={`translate(${x} 14) ${flip ? 'scale(-1 1)' : ''}`}>
      <g
        className={bob ? 'walk-bob' : undefined}
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      >
        <circle cx="0" cy="4" r="4" fill="var(--ink)" stroke="none" />
        <path d="M0 8 L0 20" />
        <path d="M0 11 L-5 16 M0 11 L5 15" />
        <path d="M0 20 L-4 30 M0 20 L4 30" />
      </g>
    </g>
  );
}

export default function WalkingCountdown({ targetIso }: { targetIso: string }) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    setProgress(walkProgress(JOURNEY_START, targetIso, Date.now()));
  }, [targetIso]);

  if (progress === null) return null;
  const met = progress >= 1;
  const groomX = 24 + (148 - 24) * progress;
  const brideX = 296 - (296 - 172) * progress;

  return (
    <svg
      viewBox="0 0 320 52"
      className="mx-auto mt-8 h-13 w-full max-w-xs"
      aria-hidden
    >
      <line
        x1="12"
        y1="46"
        x2="308"
        y2="46"
        stroke="var(--ink-faded)"
        strokeWidth="1"
        strokeDasharray="1 6"
        strokeLinecap="round"
      />
      <Figure x={groomX} flip={false} bob={!reduced && !met} />
      <Figure x={brideX} flip bob={!reduced && !met} />
      {met && (
        <text
          x="160"
          y="18"
          textAnchor="middle"
          fontSize="14"
          fill="var(--wax)"
        >
          ♥
        </text>
      )}
    </svg>
  );
}
