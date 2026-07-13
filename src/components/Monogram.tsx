export default function Monogram({
  letters,
  className,
}: {
  letters: [string, string];
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`monogram ${className ?? ''}`}
      aria-hidden
      focusable="false"
    >
      {/* First initial: solid. Second: outlined, offset so they interlock. */}
      <text x="39" y="63" textAnchor="middle" fontSize="52" fill="currentColor">
        {letters[0]}
      </text>
      <text
        x="61"
        y="76"
        textAnchor="middle"
        fontSize="52"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="1.1"
      >
        {letters[1]}
      </text>
      <circle cx="50" cy="88" r="1.4" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
