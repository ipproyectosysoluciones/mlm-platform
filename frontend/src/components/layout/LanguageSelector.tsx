/**
 * LanguageSelector - Selector de idioma (ES/EN)
 *
 * @module components/layout/LanguageSelector
 */
import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { changeLanguage, getCurrentLanguage, supportedLanguages } from '../../i18n';

export function LanguageSelector() {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const currentLang = getCurrentLanguage();
  const currentLangInfo =
    supportedLanguages.find((l) => l.code === currentLang) || supportedLanguages[0];

  const handleLanguageChange = (code: 'en' | 'es') => {
    changeLanguage(code);
    setLangMenuOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setLangMenuOpen(!langMenuOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--color-secondary)] dark:hover:bg-[var(--color-card)]/50 transition-colors text-sm"
      >
        <Globe className="w-4 h-4 text-[var(--color-foreground-muted)] dark:text-[var(--color-foreground-muted)]" />
        <span className="text-[var(--color-foreground)] dark:text-[var(--color-foreground-muted)]">
          {currentLangInfo.flag} {currentLangInfo.code.toUpperCase()}
        </span>
        <ChevronDown className="w-4 h-4 text-[var(--color-foreground-muted)] dark:text-[var(--color-foreground-muted)]" />
      </button>

      {langMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 bg-[var(--color-card)] rounded-xl shadow-lg border border-[var(--color-border)] dark:bg-[var(--color-card)] dark:border-[var(--color-border)] py-2 z-20">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code as 'en' | 'es')}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                  ${currentLang === lang.code ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'text-[var(--color-foreground)] dark:text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)] dark:hover:bg-[var(--color-card)]/50'}
                `}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageSelector;
