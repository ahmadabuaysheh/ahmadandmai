import { getFormatter, getTranslations } from 'next-intl/server';
import type { GatedContent } from '@/lib/gating';
import LetterSection from './LetterSection';

interface ScheduleRow {
  time: string;
  event: string;
}

export default async function Details({ gated }: { gated: GatedContent }) {
  const t = await getTranslations('details');
  const format = await getFormatter();
  const schedule = t.raw('schedule') as ScheduleRow[];

  return (
    <LetterSection id="details" title={t('title')}>
      <dl className="space-y-4">
        <div>
          <dt className="text-sm uppercase tracking-wide text-ink-faded">
            {t('whenLabel')}
          </dt>
          <dd className="mt-1">
            {gated.weddingDateIso
              ? format.dateTime(new Date(gated.weddingDateIso), {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })
              : t('venueHidden')}
          </dd>
        </div>
        <div>
          <dt className="text-sm uppercase tracking-wide text-ink-faded">
            {t('venueLabel')}
          </dt>
          <dd className="mt-1">
            {gated.venue ? (
              <>
                {gated.venue.name} — {gated.venue.address}{' '}
                <a
                  href={gated.venue.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-gold underline-offset-4"
                >
                  {t('mapTitle')}
                </a>
              </>
            ) : (
              t('venueHidden')
            )}
          </dd>
        </div>
      </dl>
      {gated.showSchedule && (
        <ul className="mt-8 space-y-2 border-t border-gold/30 pt-6">
          {schedule.map((row) => (
            <li key={row.event} className="flex gap-4">
              <span className="min-w-16 text-ink-faded">{row.time}</span>
              <span>{row.event}</span>
            </li>
          ))}
        </ul>
      )}
    </LetterSection>
  );
}
