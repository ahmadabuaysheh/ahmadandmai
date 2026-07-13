import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Admin — Ahmad & Mai',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="mx-auto max-w-3xl px-4 py-8">{children}</body>
    </html>
  );
}
