import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getDataStore } from '@/lib/data';
import { tokenMatches } from '@/lib/gallery/validate';
import UploadBlock from '@/components/letter/UploadBlock';

export default async function UploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t: token } = await searchParams;
  const t = await getTranslations('gallery');
  const tc = await getTranslations('common');
  const settings = await getDataStore().getSettings();
  const valid = tokenMatches(token ?? '', settings.uploadToken);

  return (
    <main className="paper-grain deckled mx-auto my-8 w-full max-w-md px-6 py-10 shadow-md">
      <h1 className="text-3xl">{tc('coupleNames')}</h1>
      {valid ? (
        <>
          <p className="mt-4 italic text-ink-faded">{t('guestsIntro')}</p>
          <UploadBlock auth={{ kind: 'token', token: token! }} />
        </>
      ) : (
        <p className="mt-4 text-wax">{t('invalidToken')}</p>
      )}
    </main>
  );
}
