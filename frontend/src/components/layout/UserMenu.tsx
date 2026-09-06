/**
 * UserMenu - Menú dropdown de usuario
 *
 * @module/components/layout/UserMenu
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';
import { ChevronDown, User, LogOut, ShieldCheck } from 'lucide-react';

export function UserMenu() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="relative">
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--color-secondary)] dark:hover:bg-[var(--color-card)]/50 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-foreground-muted)] to-[var(--color-foreground-subtle)] rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm text-[var(--color-foreground)] dark:text-[var(--color-foreground-muted)] max-w-32 truncate">
          {user?.email?.split('@')[0]}
        </span>
        <ChevronDown className="w-4 h-4 text-[var(--color-foreground-muted)] dark:text-[var(--color-foreground-muted)]" />
      </button>

      {userMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-[var(--color-card)] rounded-xl shadow-lg border border-[var(--color-border)] dark:bg-[var(--color-card)] dark:border-[var(--color-border)] py-2 z-20">
            <div className="px-4 py-2 border-b border-[var(--color-border-subtle)] dark:border-[var(--color-border)]/50">
              <p className="text-sm font-medium text-[var(--color-foreground)] dark:text-white truncate">
                {user?.email}
              </p>
              <p className="text-xs text-[var(--color-foreground-muted)] dark:text-[var(--color-foreground-muted)] capitalize">
                {(user as any)?.role || 'user'}
              </p>
            </div>
            <Link
              to="/profile"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-foreground)] dark:text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)] dark:hover:bg-[var(--color-card)]/50"
            >
              <User className="w-4 h-4" />
              {t('nav.myProfile')}
            </Link>
            <Link
              to="/profile/2fa"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-foreground)] dark:text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)] dark:hover:bg-[var(--color-card)]/50"
            >
              <ShieldCheck className="w-4 h-4" />
              {t('nav.twoFactor')}
            </Link>
            <button
              onClick={() => {
                setUserMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              {t('nav.logout')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default UserMenu;
