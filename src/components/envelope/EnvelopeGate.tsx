'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import WaxSeal from './WaxSeal';
import InviteCodeForm from './InviteCodeForm';
import type { Tier } from '@/lib/data/types';

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
  const [opened, setOpened] = useState<boolean | null>(null);

  useEffect(() => {
    setOpened(sessionStorage.getItem('seal-broken') === '1');
  }, []);

  const open = () => {
    setBroken(true);
    sessionStorage.setItem('seal-broken', '1');
    setTimeout(() => setOpened(true), reduced ? 0 : 700);
  };

  if (opened === null) return null; // avoid flash before sessionStorage read
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
