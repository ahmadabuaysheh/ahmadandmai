'use client';

import { useState } from 'react';

export default function RibbonNav({
  sections,
  label,
}: {
  sections: { id: string; label: string }[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <nav
      className="fixed top-0 z-30"
      style={{ insetInlineStart: '1rem' }}
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="block h-16 w-8 bg-wax text-paper shadow-md"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
        }}
      >
        <span aria-hidden>≡</span>
      </button>
      {open && (
        <ul className="mt-2 flex flex-col gap-1 rounded-md bg-paper p-3 shadow-lg">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setOpen(false)}>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
