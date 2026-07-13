'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { submitGuestbookNote } from '@/app/[locale]/guestbook-actions';

export default function GuestbookForm({
  guestNames,
}: {
  guestNames: string[];
}) {
  const t = useTranslations('guestbook');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(guestNames[0] ?? '');
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'ok' | 'error'>('idle');

  const send = () => {
    setState('idle');
    startTransition(async () => {
      const res = await submitGuestbookNote({ name, note });
      if (res.status === 'ok') {
        setState('ok');
        setNote('');
        router.refresh(); // new note appears on the board
      } else {
        setState('error');
      }
    });
  };

  return (
    <div className="mt-8 border-t border-gold/30 pt-6">
      {guestNames.length > 1 && (
        <div className="mb-3">
          <p className="mb-1 text-sm text-ink-faded">{t('signAs')}</p>
          <div className="flex flex-wrap gap-2">
            {guestNames.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setName(n)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  name === n
                    ? 'border-wax bg-wax text-paper'
                    : 'border-ink-faded/40 bg-paper hover:border-wax'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={t('placeholder')}
        aria-label={t('placeholder')}
        className="w-full rounded-md border border-ink-faded/40 bg-paper px-3 py-2"
      />
      {state === 'error' && (
        <p role="alert" className="mt-1 text-sm text-wax">
          {t('errorGeneric')}
        </p>
      )}
      {state === 'ok' && <p className="mt-1 text-sm">{t('thanks')}</p>}
      <button
        type="button"
        disabled={isPending || note.trim() === '' || name === ''}
        onClick={send}
        className="mt-2 rounded-full bg-wax px-5 py-2 text-paper disabled:opacity-40"
      >
        {isPending ? '…' : t('submit')}
      </button>
    </div>
  );
}
