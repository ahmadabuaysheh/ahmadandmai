'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useLocale } from 'next-intl';

export default function InkHeading({ children }: { children: string }) {
  const locale = useLocale();
  const reduced = useReducedMotion();

  if (reduced) return <h2 className="mb-6 text-3xl">{children}</h2>;

  if (locale === 'ar') {
    // Masked wipe: connected Arabic script doesn't suit stroke animation
    return (
      <h2 className="mb-6 overflow-hidden text-3xl">
        <motion.span
          className="inline-block"
          initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.6 }}
          whileInView={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          style={{ direction: 'rtl' }}
        >
          {children}
        </motion.span>
      </h2>
    );
  }

  return (
    <h2 className="mb-6" aria-label={children}>
      <svg
        viewBox="0 0 320 48"
        className="h-12 w-full max-w-xs overflow-visible"
        aria-hidden
      >
        <motion.text
          x="0"
          y="36"
          fill="transparent"
          stroke="var(--ink)"
          strokeWidth="0.6"
          style={{ fontFamily: 'var(--font-serif), serif', fontSize: 32 }}
          initial={{ strokeDasharray: 400, strokeDashoffset: 400 }}
          whileInView={{ strokeDashoffset: 0, fill: 'var(--ink)' }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{
            strokeDashoffset: { duration: 1.6, ease: 'easeInOut' },
            fill: { delay: 1.2, duration: 0.6 },
          }}
        >
          {children}
        </motion.text>
      </svg>
    </h2>
  );
}
