import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';

export default function LetterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('hero');
  return (
    <main className="p-8">
      <h1 className="text-3xl">{t('greeting')}</h1>
      <p>{t('line1')}</p>
    </main>
  );
}
