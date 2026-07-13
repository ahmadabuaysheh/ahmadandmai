'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export default function LanguageToggle() {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === 'en' ? 'ar' : 'en';

  return (
    <Link
      href={pathname}
      locale={other}
      className="fixed top-4 z-50 rounded-full border border-current/30 bg-paper/80 px-3 py-1 text-sm backdrop-blur-sm"
      style={{ insetInlineEnd: '1rem' }}
      aria-label={t('languageToggle')}
    >
      {t('languageToggle')}
    </Link>
  );
}
