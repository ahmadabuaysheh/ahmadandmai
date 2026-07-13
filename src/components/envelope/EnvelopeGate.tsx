'use client';

import { useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import WaxSeal from './WaxSeal';
import InviteCodeForm from './InviteCodeForm';
import type { Tier } from '@/lib/data/types';

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

export default function EnvelopeGate({
  tier,
  children,
}: {
  tier: Tier;
  children?: React.ReactNode;
}) {
  const t = useTranslations('envelope');
  const tc = useTranslations('common');
  const reduced = useReducedMotion();
  const isGuest = tier !== 'public';
  const [broken, setBroken] = useState(false);
  const opened = useSyncExternalStore(subscribe, isSealBroken, () => false);

  const open = () => {
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
                initials={tc('initials')}
                broken={broken}
                onBreak={open}
                label={t('openPrompt')}
              />
            </>
          ) : (
            <>
              <p className="italic text-ink-faded">{t('publicTeaser')}</p>
              <WaxSeal
                initials={tc('initials')}
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
