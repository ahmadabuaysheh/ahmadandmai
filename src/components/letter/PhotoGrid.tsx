'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface Item {
  id: string;
  url: string;
  uploaderName: string | null;
}

export default function PhotoGrid({ items }: { items: Item[] }) {
  const tc = useTranslations('common');
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<Item | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <ul className="mt-6 grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <button
              type="button"
              onClick={() => setOpen(item)}
              className="block w-full bg-white p-1.5 pb-4 shadow-md"
              style={{ rotate: `${i % 2 === 0 ? -1.5 : 1.5}deg` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- signed URLs, next/image can't optimize them */}
              <img
                src={item.url}
                alt={item.uploaderName ?? ''}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </button>
          </motion.li>
        ))}
      </ul>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- signed URL */}
          <img
            src={open.url}
            alt={open.uploaderName ?? ''}
            className="max-h-full max-w-full bg-white p-2 shadow-xl"
          />
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label={tc('close')}
            className="fixed top-4 grid size-10 place-items-center rounded-full bg-paper text-xl"
            style={{ insetInlineEnd: '1rem' }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
