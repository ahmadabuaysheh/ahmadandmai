'use client';

import { useState, useTransition } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { submitQuizScore } from '@/app/[locale]/quiz-actions';

interface Question {
  q: string;
  options: string[];
  answer: number;
}

const stepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function QuizFlow({ guestNames }: { guestNames: string[] }) {
  const t = useTranslations('quiz');
  const reduced = useReducedMotion();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const questions = t.raw('questions') as Question[];
  const [phase, setPhase] = useState<'idle' | 'playing' | 'finished' | 'saved'>(
    'idle',
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [name, setName] = useState(guestNames[0] ?? '');
  const [error, setError] = useState(false);

  const start = () => {
    setPhase('playing');
    setIndex(0);
    setPicked(null);
    setScore(0);
    setError(false);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === questions[index].answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setPhase('finished');
    }
  };

  const save = () => {
    setError(false);
    startTransition(async () => {
      const res = await submitQuizScore({ name, score });
      if (res.status === 'ok') {
        setPhase('saved');
        router.refresh(); // leaderboard updates
      } else {
        setError(true);
      }
    });
  };

  if (phase === 'idle') {
    return (
      <button
        type="button"
        onClick={start}
        className="mt-4 rounded-full bg-wax px-5 py-2 text-paper"
      >
        {t('start')}
      </button>
    );
  }

  if (phase === 'playing') {
    const q = questions[index];
    return (
      <motion.div
        key={index}
        {...(reduced ? {} : stepMotion)}
        transition={{ duration: 0.3 }}
        className="mt-4"
      >
        <p className="text-sm text-ink-faded">
          {t('progress', { n: index + 1, total: questions.length })}
        </p>
        <p className="mt-1 font-medium">{q.q}</p>
        <div className="mt-3 flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer;
            const isPicked = i === picked;
            const revealed = picked !== null;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => pick(i)}
                disabled={revealed}
                className={`rounded-md border px-4 py-2 text-start transition-colors ${
                  revealed && isAnswer
                    ? 'border-gold bg-gold/20'
                    : revealed && isPicked
                      ? 'border-wax bg-wax/10'
                      : 'border-ink-faded/40 bg-paper'
                }`}
              >
                {opt}
                {revealed && isAnswer ? ' ✓' : revealed && isPicked ? ' ✗' : ''}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <button
            type="button"
            onClick={next}
            className="mt-4 rounded-full bg-wax px-5 py-2 text-paper"
          >
            {t('next')}
          </button>
        )}
      </motion.div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="mt-4">
        <p className="font-medium">
          {t('yourScore', { score, total: questions.length })}
        </p>
        {guestNames.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {guestNames.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setName(n)}
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  name === n
                    ? 'border-wax bg-wax text-paper'
                    : 'border-ink-faded/40 bg-paper'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-wax">
            {t('errorGeneric')}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            disabled={isPending || name === ''}
            onClick={save}
            className="rounded-full bg-wax px-5 py-2 text-paper disabled:opacity-40"
          >
            {isPending ? '…' : t('saveScore')}
          </button>
          <button
            type="button"
            onClick={start}
            className="text-sm text-ink-faded underline"
          >
            {t('retake')}
          </button>
        </div>
      </div>
    );
  }

  // phase === 'saved'
  return (
    <div className="mt-4">
      <p>{t('yourScore', { score, total: questions.length })}</p>
      <button
        type="button"
        onClick={start}
        className="mt-2 text-sm text-ink-faded underline"
      >
        {t('retake')}
      </button>
    </div>
  );
}
