import InkHeading from './InkHeading';

export default function LetterSection({
  id,
  title,
  children,
}: {
  id: string;
  title?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="paper-grain deckled page-tilt relative mx-auto my-6 w-full max-w-xl px-6 py-10 shadow-md"
      style={{ scrollMarginBlockStart: '3rem' }}
    >
      {title ? <InkHeading>{title}</InkHeading> : null}
      {children}
    </section>
  );
}
