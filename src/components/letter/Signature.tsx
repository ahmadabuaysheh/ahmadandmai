import { useTranslations } from 'next-intl';
import Monogram from '@/components/Monogram';

export default function Signature() {
  const t = useTranslations('signature');
  const tc = useTranslations('common');
  const monogram = tc.raw('monogram') as [string, string];
  return (
    <footer className="mx-auto max-w-xl px-6 py-16 text-center">
      <p className="italic">{t('closing')}</p>
      <p className="script mt-4 text-5xl leading-relaxed text-ink">
        {t('names')}
      </p>
      <div
        aria-hidden
        className="mx-auto mt-8 grid size-16 place-items-center rounded-full text-paper shadow-md"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #b04a58, var(--wax) 60%, #6e222d)',
        }}
      >
        <Monogram letters={monogram} className="size-12" />
      </div>
      <p className="mt-8 text-sm text-ink-faded">{t('postscript')}</p>
    </footer>
  );
}
