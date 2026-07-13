import { getTranslations } from 'next-intl/server';
import LetterSection from './LetterSection';
import MarginNote from './MarginNote';

interface FaqItem {
  q: string;
  a: string;
}

export default async function Faq() {
  const t = await getTranslations('faq');
  const items = t.raw('items') as FaqItem[];

  return (
    <LetterSection id="faq" title={t('title')}>
      <MarginNote>{t('marginNote')}</MarginNote>
      <dl className="space-y-5">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="font-medium">{item.q}</dt>
            <dd className="mt-1 text-ink-faded">{item.a}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 border-t border-gold/30 pt-6">
        <h3 className="text-xl">{t('registryTitle')}</h3>
        <p className="mt-2 text-ink-faded">{t('registryIntro')}</p>
      </div>
    </LetterSection>
  );
}
