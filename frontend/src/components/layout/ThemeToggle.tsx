/**
 * ThemeToggle - Light/Dark theme toggle button
 * Botón para alternar entre tema claro y oscuro.
 * Shown at all breakpoints in the navbar.
 *
 * @module components/layout/ThemeToggle
 */

import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={t('nav.toggleTheme')}
      title={t('nav.toggleTheme')}
      className="flex items-center justify-center p-2.5 rounded-xl text-foreground-muted hover:text-foreground hover:bg-secondary transition-all duration-300"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

export default ThemeToggle;
