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
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-sm"
      >
        <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        <span className="text-slate-700 dark:text-slate-200">
          {currentLangInfo.flag} {currentLangInfo.code.toUpperCase()}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </button>

      {langMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 py-2 z-20">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code as 'en' | 'es')}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                  ${currentLang === lang.code ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
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
