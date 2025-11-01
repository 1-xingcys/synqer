'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function Example() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('hello')}</p>
      
      {/* 語言切換連結 */}
      <div>
        <Link href="/" locale="zh-TW">繁體中文</Link>
        <Link href="/" locale="en">English</Link>
      </div>
    </div>
  );
}

