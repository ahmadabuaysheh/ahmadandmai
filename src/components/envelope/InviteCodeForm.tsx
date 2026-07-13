'use client';

import { useActionState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  submitInviteCode,
  type InviteFormState,
} from '@/app/[locale]/actions';

export default function InviteCodeForm() {
  const t = useTranslations('envelope');
  const router = useRouter();
  const [state, action, pending] = useActionState<InviteFormState, FormData>(
    submitInviteCode,
    { status: 'idle' },
  );

  useEffect(() => {
    if (state.status === 'ok') router.refresh();
  }, [state.status, router]);

  return (
    <form action={action} className="flex w-full max-w-xs flex-col gap-2">
      <label htmlFor="invite-code" className="text-sm italic text-ink-faded">
        {t('addressedTo')}
      </label>
      <input
        id="invite-code"
        name="code"
        autoComplete="off"
        placeholder={t('codePlaceholder')}
        className="rounded-md border border-ink-faded/40 bg-paper px-3 py-2 text-center focus:outline-2 focus:outline-gold"
      />
      {state.status === 'invalid' && (
        <p role="alert" className="text-sm text-wax">
          {t('codeInvalid')}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-wax px-4 py-2 text-paper disabled:opacity-50"
      >
        {pending ? '…' : t('openPrompt')}
      </button>
    </form>
  );
}
