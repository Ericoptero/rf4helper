import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import RootLayout from './layout';

describe('RootLayout', () => {
  it('injects the theme bootstrap script before the app content', () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <main id="app-content">Rune Factory 4 Helper</main>
      </RootLayout>,
    );

    expect(markup).toContain('id="theme-bootstrap"');
    expect(markup).toContain('localStorage.getItem("rf4-theme")');
    expect(markup).toContain('window.matchMedia("(prefers-color-scheme: dark)")');
    expect(markup.indexOf('id="theme-bootstrap"')).toBeLessThan(markup.indexOf('id="app-content"'));
  });
});
