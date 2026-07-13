'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Monogram from '@/components/Monogram';

export default function WaxSeal({
  letters,
  broken,
  onBreak,
  label,
}: {
  letters: [string, string];
  broken: boolean;
  onBreak: () => void;
  label: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onBreak}
      aria-label={label}
      className="relative grid size-24 place-items-center rounded-full text-paper shadow-lg"
      style={{
        background:
          'radial-gradient(circle at 35% 30%, #b04a58, var(--wax) 60%, #6e222d)',
      }}
      animate={
        broken
          ? reduced
            ? { opacity: 0 }
            : { scale: [1, 1.15, 0], rotate: [0, -8, 12], opacity: [1, 1, 0] }
          : {}
      }
      transition={{ duration: 0.7, ease: 'easeInOut' }}
      whileTap={reduced ? undefined : { scale: 0.92 }}
    >
      <Monogram letters={letters} className="size-18" />
    </motion.button>
  );
}
