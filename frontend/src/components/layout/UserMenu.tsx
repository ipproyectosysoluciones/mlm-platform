/**
 * UserMenu - Menú dropdown de usuario
 *
 * @module/components/layout/UserMenu
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, User, LogOut, ShieldCheck } from 'lucide-react';

export function UserMenu() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="relative">
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm text-slate-700 max-w-32 truncate">
          {user?.email?.split('@')[0]}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {userMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
              <p className="text-xs text-slate-500 capitalize">{(user as any)?.role || 'user'}</p>
            </div>
            <Link
              to="/profile"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <User className="w-4 h-4" />
              {t('nav.myProfile')}
            </Link>
            <Link
              to="/profile/2fa"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {t('nav.twoFactor')}
            </Link>
            <button
              onClick={() => {
                setUserMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
