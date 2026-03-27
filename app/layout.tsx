import type { Metadata } from 'next';

import './globals.css';

import { AppProviders } from '@/components/AppProviders';
import { AppShell } from '@/components/AppShell';

const themeBootstrapScript = `
  (() => {
    const storedTheme = localStorage.getItem("rf4-theme");
    const resolvedTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.style.colorScheme = resolvedTheme;
  })();
`;

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
        <script
          id="theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
