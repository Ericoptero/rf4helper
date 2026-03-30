import type { Metadata } from 'next';

import './globals.css';

import { AppProviders } from '@/components/AppProviders';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Rune Factory 4 Helper',
  description: 'A premium searchable reference for Rune Factory 4 systems, items, monsters, and characters.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script id="theme-bootstrap" src="/theme-bootstrap.js" />
      </head>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
