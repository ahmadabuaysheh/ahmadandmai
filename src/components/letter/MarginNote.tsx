export default function MarginNote({ children }: { children: string }) {
  return (
    <p
      aria-hidden
      className="script pointer-events-none absolute max-w-32 text-lg leading-snug text-ink-faded/70"
      style={{ insetInlineEnd: '0.25rem', rotate: '-2deg' }}
    >
      {children}
    </p>
  );
}
