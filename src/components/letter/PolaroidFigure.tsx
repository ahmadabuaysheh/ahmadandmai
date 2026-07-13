'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function PolaroidFigure({
  src,
  tilt,
}: {
  src: string;
  tilt: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.figure
      className="mx-auto mt-4 w-40 bg-white p-2 pb-6 shadow-lg"
      initial={reduced ? false : { opacity: 0, y: 24, rotate: 0 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={reduced ? { rotate: tilt } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static svg placeholder */}
      <img src={src} alt="" className="block w-full" />
    </motion.figure>
  );
}
