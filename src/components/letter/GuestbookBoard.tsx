'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { GuestbookNote } from '@/lib/data/types';

export default function GuestbookBoard({ notes }: { notes: GuestbookNote[] }) {
  const reduced = useReducedMotion();
  return (
    <ul className="mt-6 grid grid-cols-2 gap-3">
      {notes.map((n, i) => {
        const tilt = i % 2 === 0 ? -2 : 2.5;
        return (
          <motion.li
            key={n.createdAt + n.name}
            className="rounded-sm bg-white p-3 shadow-md"
            initial={reduced ? false : { opacity: 0, y: 16, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: tilt }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={reduced ? { rotate: tilt } : undefined}
          >
            <p className="text-sm leading-snug">{n.note}</p>
            <p className="mt-2 text-xs italic text-ink-faded">— {n.name}</p>
          </motion.li>
        );
      })}
    </ul>
  );
}
