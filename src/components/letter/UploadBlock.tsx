'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  createPhotoUpload,
  finalizePhotoUpload,
  type UploadAuth,
} from '@/app/[locale]/gallery-actions';

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;

export default function UploadBlock({
  auth,
  guestNames,
}: {
  auth: UploadAuth;
  guestNames?: string[];
}) {
  const t = useTranslations('gallery');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(guestNames?.[0] ?? '');
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [state, setState] = useState<'idle' | 'ok' | 'error'>('idle');

  const upload = (files: FileList) => {
    const list = [...files]
      .slice(0, MAX_FILES)
      .filter((f) => f.size <= MAX_BYTES);
    if (list.length === 0 || name.trim() === '') return;
    setState('idle');
    setProgress({ done: 0, total: list.length });
    startTransition(async () => {
      let failed = 0;
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const grant = await createPhotoUpload(auth, file.name);
        if ('error' in grant) {
          failed++;
        } else {
          const put = await fetch(grant.signedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });
          if (put.ok) {
            const fin = await finalizePhotoUpload(auth, grant.path, name);
            if (fin.status !== 'ok') failed++;
          } else {
            failed++;
          }
        }
        setProgress({ done: i + 1, total: list.length });
      }
      setProgress(null);
      setState(failed > 0 ? 'error' : 'ok');
      if (failed < list.length) router.refresh();
    });
  };

  return (
    <div className="mt-8 border-t border-gold/30 pt-6">
      {guestNames && guestNames.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-2">
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
      ) : !guestNames ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder={t('uploadName')}
          aria-label={t('uploadName')}
          className="mb-3 w-full rounded-md border border-ink-faded/40 bg-paper px-3 py-2"
        />
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => e.target.files && upload(e.target.files)}
      />
      <button
        type="button"
        disabled={isPending || name.trim() === ''}
        onClick={() => inputRef.current?.click()}
        className="rounded-full bg-wax px-5 py-2 text-paper disabled:opacity-40"
      >
        {progress
          ? t('uploading', { done: progress.done, total: progress.total })
          : t('upload')}
      </button>
      {state === 'ok' && <p className="mt-2 text-sm">{t('uploadThanks')}</p>}
      {state === 'error' && (
        <p role="alert" className="mt-2 text-sm text-wax">
          {t('uploadError')}
        </p>
      )}
    </div>
  );
}
