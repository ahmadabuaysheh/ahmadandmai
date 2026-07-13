import { getTranslations } from 'next-intl/server';
import { getDataStore } from '@/lib/data';
import type { Settings } from '@/lib/data';
import { getViewUrls } from '@/lib/storage';
import type { GuestContext } from '@/lib/invite/guest-context';
import LetterSection from './LetterSection';
import PhotoGrid from './PhotoGrid';
import UploadBlock from './UploadBlock';

export default async function Gallery({
  guest,
  settings,
}: {
  guest: GuestContext;
  settings: Settings;
}) {
  const t = await getTranslations('gallery');
  const photos = await getDataStore().getPhotos();
  const urls = await getViewUrls(photos.map((p) => p.storagePath));
  const items = photos
    .map((p) => ({
      id: p.id,
      url: urls.get(p.storagePath),
      uploaderName: p.uploaderName,
    }))
    .filter(
      (p): p is { id: string; url: string; uploaderName: string | null } =>
        Boolean(p.url),
    );
  const guests = settings.galleryMode === 'guests';

  return (
    <LetterSection id="gallery" title={t('title')}>
      <p className="italic text-ink-faded">
        {guests ? t('guestsIntro') : t('coupleIntro')}
      </p>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-ink-faded">{t('comingSoonPhotos')}</p>
      ) : (
        <PhotoGrid items={items} />
      )}
      {guests && (
        <UploadBlock auth={{ kind: 'invite' }} guestNames={guest.guestNames} />
      )}
    </LetterSection>
  );
}
