import { getFormatter, getTranslations } from 'next-intl/server';
import type { GatedContent } from '@/lib/gating';
import Countdown from './Countdown';

export default async function Hero({ gated }: { gated: GatedContent }) {
  const t = await getTranslations('hero');
  const tc = await getTranslations('common');
  const format = await getFormatter();

  return (
    <header className="mx-auto max-w-xl px-6 pt-16 text-center">
      <p className="text-lg italic text-ink-faded">{t('greeting')}</p>
      <h1 className="script mt-4 text-6xl leading-snug">{tc('coupleNames')}</h1>
      <p className="mt-6">{t('line1')}</p>
      <p className="mt-2">{t('line2')}</p>
      <p className="mt-6 font-medium">
        {gated.weddingDateIso
          ? t('dateRevealed', {
              date: format.dateTime(new Date(gated.weddingDateIso), {
                dateStyle: 'full',
              }),
            })
          : t('dateHidden')}
      </p>
      {gated.weddingDateIso && (
        <Countdown
          targetIso={gated.weddingDateIso}
          label={t('countdownLabel')}
        />
      )}
    </header>
  );
}
