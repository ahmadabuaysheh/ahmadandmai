import { getTranslations } from 'next-intl/server';
import { getDataStore } from '@/lib/data';
import type { GuestContext } from '@/lib/invite/guest-context';
import LetterSection from './LetterSection';
import RsvpFlow from './RsvpFlow';

export default async function Rsvp({ guest }: { guest: GuestContext }) {
  const t = await getTranslations('rsvp');
  const existing = guest.code ? await getDataStore().getRsvps(guest.code) : [];

  return (
    <LetterSection id="rsvp" title={t('title')}>
      <p className="italic text-ink-faded">{t('intro')}</p>
      <RsvpFlow
        guestNames={guest.guestNames}
        maxPartySize={guest.maxPartySize}
        existing={existing.map((r) => ({
          guestName: r.guestName,
          attending: r.attending,
          meal: r.meal,
          songRequest: r.songRequest,
          message: r.message,
        }))}
      />
    </LetterSection>
  );
}
