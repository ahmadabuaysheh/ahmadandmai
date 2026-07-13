import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getGuestContext } from '@/lib/invite/guest-context';
import { getDataStore } from '@/lib/data';
import { gateForTier } from '@/lib/gating';
import EnvelopeGate from '@/components/envelope/EnvelopeGate';
import Details from '@/components/letter/Details';
import Gallery from '@/components/letter/Gallery';
import Guestbook from '@/components/letter/Guestbook';
import Hero from '@/components/letter/Hero';
import LetterSection from '@/components/letter/LetterSection';
import Quiz from '@/components/letter/Quiz';
import RibbonNav from '@/components/letter/RibbonNav';
import Rsvp from '@/components/letter/Rsvp';
import Signature from '@/components/letter/Signature';
import Story from '@/components/letter/Story';

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
        <Hero gated={gated} />
        <Story />
        <Details gated={gated} />
        <Rsvp guest={guest} />
        <Guestbook guest={guest} />
        <Gallery guest={guest} settings={settings} />
        <Quiz guest={guest} />
        <LetterSection id="faq" title={t('faq.title')}>
          <p className="italic text-ink-faded">{t('common.comingSoon')}</p>
        </LetterSection>
        <Signature />
      </main>
    </EnvelopeGate>
  );
}
