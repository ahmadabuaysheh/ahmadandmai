'use client';

import { useState, useTransition } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { submitRsvp } from '@/app/[locale]/rsvp-actions';

type Step = 'attending' | 'partySize' | 'meals' | 'song' | 'message' | 'done';

interface ExistingRow {
  guestName: string;
  attending: boolean;
  meal: string | null;
  songRequest: string | null;
  message: string | null;
}

// Entrance-only: exit animations would hold the step swap hostage to
// requestAnimationFrame, which pauses in hidden/backgrounded tabs.
const stepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function Chip({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 transition-colors ${
        selected
          ? 'border-wax bg-wax text-paper'
          : 'border-ink-faded/40 bg-paper hover:border-wax'
      }`}
    >
      {children}
    </button>
  );
}

export default function RsvpFlow({
  guestNames,
  maxPartySize,
  existing,
}: {
  guestNames: string[];
  maxPartySize: number;
  existing: ExistingRow[];
}) {
  const t = useTranslations('rsvp');
  const tc = useTranslations('common');
  const reduced = useReducedMotion();
  const [isPending, startTransition] = useTransition();

  const [editing, setEditing] = useState(existing.length === 0);
  const [step, setStep] = useState<Step>('attending');
  const [attending, setAttending] = useState<boolean | null>(null);
  const [partySize, setPartySize] = useState(1);
  const [meals, setMeals] = useState<(string | null)[]>([null]);
  const [song, setSong] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const mealOptions = t.raw('mealOptions') as string[];
  const guestLabel = (i: number) => guestNames[i] ?? t('guestN', { n: i + 1 });

  const send = () => {
    if (attending === null) return;
    setError(false);
    startTransition(async () => {
      const res = await submitRsvp({
        attending,
        partySize,
        meals,
        songRequest: song,
        message,
      });
      if (res.status === 'ok') {
        setStep('done');
      } else {
        setError(true);
      }
    });
  };

  const chooseAttending = (yes: boolean) => {
    setAttending(yes);
    if (!yes) {
      setStep('message');
    } else if (maxPartySize > 1) {
      setStep('partySize');
    } else {
      setPartySize(1);
      setMeals([null]);
      setStep('meals');
    }
  };

  const goBack = () => {
    if (step === 'partySize') setStep('attending');
    else if (step === 'meals')
      setStep(maxPartySize > 1 ? 'partySize' : 'attending');
    else if (step === 'song') setStep('meals');
    else if (step === 'message') setStep(attending ? 'song' : 'attending');
  };

  if (!editing) {
    const first = existing[0];
    return (
      <div className="mt-6 space-y-2">
        <p className="font-medium">{t('repliedSummary')}</p>
        {first.attending ? (
          <>
            <p>{t('partyOf', { n: existing.length })}</p>
            <ul className="text-sm text-ink-faded">
              {existing.map((r) => (
                <li key={r.guestName}>
                  {r.guestName}
                  {r.meal ? ` — ${r.meal}` : ''}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>{t('notComing')}</p>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 underline decoration-gold underline-offset-4"
        >
          {t('editReply')}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <motion.div
        key={step}
        {...(reduced ? {} : stepMotion)}
        transition={{ duration: 0.35 }}
      >
          {step !== 'attending' && step !== 'done' && (
            <button
              type="button"
              onClick={goBack}
              className="mb-3 text-sm text-ink-faded underline"
            >
              {tc('back')}
            </button>
          )}

          {step === 'attending' && (
            <fieldset>
              <legend className="mb-3 font-medium">{t('qAttending')}</legend>
              <div className="flex flex-wrap gap-2">
                <Chip onClick={() => chooseAttending(true)}>{t('aYes')}</Chip>
                <Chip onClick={() => chooseAttending(false)}>{t('aNo')}</Chip>
              </div>
            </fieldset>
          )}

          {step === 'partySize' && (
            <fieldset>
              <legend className="mb-3 font-medium">{t('qParty')}</legend>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: maxPartySize }, (_, i) => i + 1).map(
                  (n) => (
                    <Chip
                      key={n}
                      selected={partySize === n}
                      onClick={() => {
                        setPartySize(n);
                        setMeals(Array(n).fill(null));
                        setStep('meals');
                      }}
                    >
                      {n}
                    </Chip>
                  ),
                )}
              </div>
            </fieldset>
          )}

          {step === 'meals' && (
            <fieldset>
              <legend className="mb-3 font-medium">{t('qMeal')}</legend>
              <div className="space-y-4">
                {Array.from({ length: partySize }, (_, i) => (
                  <div key={i}>
                    <p className="mb-1 text-sm text-ink-faded">
                      {guestLabel(i)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mealOptions.map((opt) => (
                        <Chip
                          key={opt}
                          selected={meals[i] === opt}
                          onClick={() =>
                            setMeals((m) => {
                              const next = [...m];
                              next[i] = opt;
                              return next;
                            })
                          }
                        >
                          {opt}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={meals.some((m) => m === null)}
                onClick={() => setStep('song')}
                className="mt-4 rounded-full bg-wax px-5 py-2 text-paper disabled:opacity-40"
              >
                {tc('continue')}
              </button>
            </fieldset>
          )}

          {step === 'song' && (
            <div>
              <label htmlFor="rsvp-song" className="mb-3 block font-medium">
                {t('qSong')}
              </label>
              <input
                id="rsvp-song"
                value={song}
                onChange={(e) => setSong(e.target.value)}
                maxLength={500}
                placeholder={t('songPlaceholder')}
                className="w-full rounded-md border border-ink-faded/40 bg-paper px-3 py-2"
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('message')}
                  className="rounded-full bg-wax px-5 py-2 text-paper"
                >
                  {tc('continue')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSong('');
                    setStep('message');
                  }}
                  className="text-sm text-ink-faded underline"
                >
                  {t('skip')}
                </button>
              </div>
            </div>
          )}

          {step === 'message' && (
            <div>
              <label htmlFor="rsvp-message" className="mb-3 block font-medium">
                {t('qMessage')}
              </label>
              <textarea
                id="rsvp-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder={t('messagePlaceholder')}
                className="w-full rounded-md border border-ink-faded/40 bg-paper px-3 py-2"
              />
              {error && (
                <p role="alert" className="mt-2 text-sm text-wax">
                  {t('errorGeneric')}
                </p>
              )}
              <button
                type="button"
                disabled={isPending || attending === null}
                onClick={send}
                className="mt-3 rounded-full bg-wax px-5 py-2 text-paper disabled:opacity-40"
              >
                {isPending ? '…' : tc('send')}
              </button>
            </div>
          )}

          {step === 'done' && (
            <p className="font-medium">
              {attending ? t('thanksYes') : t('thanksNo')}
            </p>
          )}
      </motion.div>
    </div>
  );
}
