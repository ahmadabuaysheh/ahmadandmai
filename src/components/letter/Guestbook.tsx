import { getTranslations } from 'next-intl/server';
import { getDataStore } from '@/lib/data';
import type { GuestContext } from '@/lib/invite/guest-context';
import LetterSection from './LetterSection';
import GuestbookBoard from './GuestbookBoard';
import GuestbookForm from './GuestbookForm';

export default async function Guestbook({ guest }: { guest: GuestContext }) {
  const t = await getTranslations('guestbook');
  const notes = await getDataStore().getGuestbookNotes();

  return (
    <LetterSection id="guestbook" title={t('title')}>
      <p className="italic text-ink-faded">{t('intro')}</p>
      {notes.length === 0 ? (
        <p className="mt-6 text-sm text-ink-faded">{t('empty')}</p>
      ) : (
        <GuestbookBoard notes={notes} />
      )}
      <GuestbookForm guestNames={guest.guestNames} />
    </LetterSection>
  );
}
