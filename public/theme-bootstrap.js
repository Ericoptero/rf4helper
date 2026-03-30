(() => {
  const storedTheme = localStorage.getItem('rf4-theme');
  const resolvedTheme =
    storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.style.colorScheme = resolvedTheme;
})();
