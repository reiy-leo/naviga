import { useEffect } from 'react';

interface ThemeHookResult {
  setTheme: (appearance: string) => void;
}

export function useTheme(): ThemeHookResult {
  useEffect(() => {
    const savedAppearance = localStorage.getItem('appearance') || 'system';
    const effective =
      savedAppearance === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : savedAppearance;

    document.documentElement.setAttribute('data-theme', effective);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (savedAppearance === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (appearance: string) => {
    localStorage.setItem('appearance', appearance);
    const effective =
      appearance === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : appearance;
    document.documentElement.setAttribute('data-theme', effective);
  };

  return { setTheme };
}
