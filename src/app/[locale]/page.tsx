import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getGuestContext } from '@/lib/invite/guest-context';
import EnvelopeGate from '@/components/envelope/EnvelopeGate';

export default async function LetterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const guest = await getGuestContext();

  // Public visitors get the envelope only — the letter's HTML must never
  // reach clients without a valid invite.
  if (guest.tier === 'public') {
    return <EnvelopeGate tier="public" />;
  }

  const t = await getTranslations('hero');

  return (
    <EnvelopeGate tier={guest.tier}>
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-3xl">{t('greeting')}</h1>
        <p>{t('line1')}</p>
      </main>
    </EnvelopeGate>
  );
}
