import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getGuestContext } from '@/lib/invite/guest-context';
import { getDataStore } from '@/lib/data';
import { gateForTier } from '@/lib/gating';
import EnvelopeGate from '@/components/envelope/EnvelopeGate';
import LetterSection from '@/components/letter/LetterSection';
import RibbonNav from '@/components/letter/RibbonNav';
import Signature from '@/components/letter/Signature';

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

  const settings = await getDataStore().getSettings();
  const gated = gateForTier(guest.tier, settings);
  void gated; // consumed by Hero/Details in upcoming tasks

  const t = await getTranslations();

  const sections = [
    { id: 'story', label: t('story.title') },
    { id: 'details', label: t('details.title') },
    { id: 'rsvp', label: t('rsvp.title') },
    { id: 'guestbook', label: t('guestbook.title') },
    { id: 'gallery', label: t('gallery.title') },
    { id: 'quiz', label: t('quiz.title') },
    { id: 'faq', label: t('faq.title') },
  ];

  return (
    <EnvelopeGate tier={guest.tier}>
      <RibbonNav sections={sections} label={t('common.nav')} />
      <main className="pb-8">
        <header className="mx-auto max-w-xl px-6 pt-16 text-center">
          <p className="text-lg italic text-ink-faded">{t('hero.greeting')}</p>
          <h1 className="mt-4 text-5xl">{t('common.coupleNames')}</h1>
          <p className="mt-6">{t('hero.line1')}</p>
          <p className="mt-2">{t('hero.line2')}</p>
        </header>
        {sections.map((s) => (
          <LetterSection key={s.id} id={s.id} title={s.label}>
            <p className="italic text-ink-faded">{t('common.comingSoon')}</p>
          </LetterSection>
        ))}
        <Signature />
      </main>
    </EnvelopeGate>
  );
}
