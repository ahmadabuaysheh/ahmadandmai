'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export default function SealEasterEgg({
  caption,
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const [hearts, setHearts] = useState<number[]>([]);
  const [blooper, setBlooper] = useState(false);
  const taps = useRef<number[]>([]);
  const keys = useRef<string[]>([]);

  const trigger = () => {
    setBlooper(true);
    setHearts(Array.from({ length: 24 }, (_, i) => i));
    setTimeout(() => setHearts([]), 1800);
  };

  const onTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      trigger();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      keys.current = [...keys.current, e.key].slice(-KONAMI.length);
      if (
        keys.current.length === KONAMI.length &&
        KONAMI.every((k, i) => keys.current[i] === k)
      ) {
        keys.current = [];
        trigger();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onTap}
        className="cursor-pointer border-0 bg-transparent p-0"
        aria-hidden
        tabIndex={-1}
      >
        {children}
      </button>
      {hearts.map((i) => {
        const angle = (i / 24) * Math.PI * 2;
        const dist = 44 + (i % 3) * 22;
        return (
          <span
            key={i}
            aria-hidden
            className={reduced ? 'heart-still' : 'heart-fly'}
            style={
              {
                '--dx': `${Math.cos(angle) * dist}px`,
                '--dy': `${Math.sin(angle) * dist - 20}px`,
              } as React.CSSProperties
            }
          >
            ♥
          </span>
        );
      })}
      {blooper && (
        <figure className="mx-auto mt-6 w-40 rotate-3 bg-white p-2 pb-1 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- static placeholder */}
          <img src="/polaroids/blooper.svg" alt="" className="block w-full" />
          <figcaption className="script py-1 text-center text-sm text-ink-faded">
            {caption}
          </figcaption>
        </figure>
      )}
    </div>
  );
}
