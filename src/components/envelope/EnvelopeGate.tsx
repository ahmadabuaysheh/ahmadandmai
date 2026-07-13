'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import WaxSeal from './WaxSeal';
import InviteCodeForm from './InviteCodeForm';
import type { Tier } from '@/lib/data/types';
import { playSealCrack, setSoundEnabled, soundEnabled } from '@/lib/sound';

// The "seal broken" flag lives in sessionStorage so the envelope doesn't
// replay on every soft navigation, exposed as a tiny external store so the
// component can read it hydration-safely.
const SEAL_KEY = 'seal-broken';
let listeners: (() => void)[] = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function isSealBroken() {
  return sessionStorage.getItem(SEAL_KEY) === '1';
}

function markSealBroken() {
  sessionStorage.setItem(SEAL_KEY, '1');
  listeners.forEach((l) => l());
}

function markSealed() {
  sessionStorage.removeItem(SEAL_KEY);
  listeners.forEach((l) => l());
}

const IDLE_MS = 10 * 60 * 1000;

export default function EnvelopeGate({
  tier,
  children,
}: {
  tier: Tier;
  children?: React.ReactNode;
}) {
  const t = useTranslations('envelope');
  const tc = useTranslations('common');
  const monogram = tc.raw('monogram') as [string, string];
  const reduced = useReducedMotion();
  const isGuest = tier !== 'public';
  const [broken, setBroken] = useState(false);
  const [sound, setSound] = useState(false);
  const opened = useSyncExternalStore(subscribe, isSealBroken, () => false);

  useEffect(() => {
    setSound(soundEnabled());
  }, []);

  // The letter gently re-seals after a long idle; reopening is one tap.
  useEffect(() => {
    if (!opened || !isGuest) return;
    let timer = window.setTimeout(markSealed, IDLE_MS);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(markSealed, IDLE_MS);
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [opened, isGuest]);

  useEffect(() => {
    if (!opened) setBroken(false);
  }, [opened]);

  const open = () => {
    if (sound) playSealCrack();
    setBroken(true);
    setTimeout(markSealBroken, reduced ? 0 : 700);
  };

  if (opened && isGuest) return <>{children}</>;

  return (
    <AnimatePresence>
      <motion.div
        key="envelope"
        className="fixed inset-0 z-40 grid place-items-center bg-paper-deep p-6"
        exit={{ opacity: 0 }}
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-lg border border-gold/40 bg-paper p-8 text-center shadow-xl">
          {isGuest ? (
            <>
              <p className="text-sm text-ink-faded">{t('openPrompt')}</p>
              <WaxSeal
                letters={monogram}
                broken={broken}
                onBreak={open}
                label={t('openPrompt')}
              />
              <button
                type="button"
                onClick={() => {
                  setSound(!sound);
                  setSoundEnabled(!sound);
                }}
                className="text-xs text-ink-faded underline"
              >
                {sound ? t('soundOff') : t('soundOn')}
              </button>
            </>
          ) : (
            <>
              <p className="italic text-ink-faded">{t('publicTeaser')}</p>
              <WaxSeal
                letters={monogram}
                broken={false}
                onBreak={() => {}}
                label={tc('initials')}
              />
              <InviteCodeForm />
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
