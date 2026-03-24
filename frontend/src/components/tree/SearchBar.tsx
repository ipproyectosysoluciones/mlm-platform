/**
 * SearchBar - Componente de búsqueda de usuarios en el árbol
 * SearchBar - User search component for the tree
 *
 * Busca usuarios por email o referral code con debounce y dropdown de resultados.
 * Searches users by email or referral code with debounce and results dropdown.
 *
 * Phase 3: Feature de búsqueda en tiempo real para Visual Tree UI.
 * Phase 3: Real-time search feature for Visual Tree UI.
 *
 * @module components/tree/SearchBar
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/api';
import type { User as UserType } from '../../types';

interface SearchBarProps {
  /** Callback cuando se selecciona un usuario */
  onSelect: (userId: string) => void;
  /** Placeholder personalizado */
  placeholder?: string;
}

export default function SearchBar({ onSelect, placeholder }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await userService.searchUsers(query);
        setResults(data);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, selectedIndex]
  );

  const handleSelect = (user: UserType) => {
    onSelect(user.id);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const defaultPlaceholder = t('tree.search.placeholder');

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder || defaultPlaceholder}
          className="
            w-full pl-10 pr-10 py-2.5
            border border-gray-300 rounded-lg
            bg-white text-gray-900
            placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            transition-all duration-200
          "
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-activedescendant={selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
          autoComplete="off"
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label={t('tree.search.clear')}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div
          id="search-results"
          role="listbox"
          className="
            absolute z-50 top-full left-0 right-0 mt-1
            bg-white border border-gray-200 rounded-lg shadow-lg
            max-h-72 overflow-auto
          "
        >
          {results.length > 0 ? (
            <ul>
              {results.map((user, index) => (
                <li
                  key={user.id}
                  id={`result-${index}`}
                  role="option"
                  aria-selected={selectedIndex === index}
                  onClick={() => handleSelect(user)}
                  className={`
                    px-4 py-3 cursor-pointer flex items-center gap-3
                    ${selectedIndex === index ? 'bg-indigo-50' : 'hover:bg-gray-50'}
                    ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}
                  `}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      {t('tree.details.level')} {user.level} • {user.referralCode}
                    </p>
                  </div>
                  <User className="w-4 h-4 text-gray-400" />
                </li>
              ))}
            </ul>
          ) : query.length >= 2 && !isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">{t('tree.search.noResults')}</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Helper text */}
      {query.length > 0 && query.length < 2 && (
        <p className="absolute -bottom-6 left-0 text-xs text-gray-400">
          {t('tree.search.minChars')}
        </p>
      )}
    </div>
  );
}
