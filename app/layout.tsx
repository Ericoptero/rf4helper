import type { Metadata } from 'next';

import './globals.css';

import { AppShell } from '@/components/AppShell';
import { TooltipProvider } from '@/components/ui/tooltip';

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
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
