import { getTranslations } from 'next-intl/server';
import { getDataStore } from '@/lib/data';
import { topScores } from '@/lib/quiz/leaderboard';
import type { GuestContext } from '@/lib/invite/guest-context';
import LetterSection from './LetterSection';
import QuizFlow from './QuizFlow';

export default async function Quiz({ guest }: { guest: GuestContext }) {
  const t = await getTranslations('quiz');
  const leaderboard = topScores(await getDataStore().getQuizScores());

  return (
    <LetterSection id="quiz" title={t('title')}>
      <p className="italic text-ink-faded">{t('intro')}</p>
      <QuizFlow guestNames={guest.guestNames} />
      <div className="mt-8 border-t border-gold/30 pt-6">
        <h3 className="text-xl">{t('leaderboard')}</h3>
        {leaderboard.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faded">{t('emptyLeaderboard')}</p>
        ) : (
          <ol className="mt-2 space-y-1">
            {leaderboard.map((s, i) => (
              <li key={s.name} className="flex gap-3 text-sm">
                <span className="min-w-6 text-ink-faded">{i + 1}.</span>
                <span className="flex-1">{s.name}</span>
                <span className="tabular-nums">{s.score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </LetterSection>
  );
}
