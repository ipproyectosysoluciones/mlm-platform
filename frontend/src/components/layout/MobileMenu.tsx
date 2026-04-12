/**
 * MobileMenu - Menú móvil para navegación responsive.
 * Los links de admin se muestran en una sección separada con label.
 *
 * MobileMenu - Mobile menu for responsive navigation.
 * Admin links are shown in a separate labeled section.
 *
 * @module components/layout/MobileMenu
 */
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, supportedLanguages } from '../../i18n';
import { useAuth } from '../../context/useAuth';
import {
  LayoutDashboard,
  TreeDeciduous,
  Users,
  User,
  Shield,
  FileText,
  DollarSign,
  LogOut,
  Wallet,
  Building2,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import { featureFlags } from '../../utils/featureFlags';

/** Regular navigation items / Ítems de navegación regulares */
const NAV_ITEMS = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/tree', labelKey: 'nav.tree', icon: TreeDeciduous },
  { path: '/crm', labelKey: 'nav.crm', icon: Users },
  { path: '/landing-pages', labelKey: 'nav.landingPages', icon: FileText },
  { path: '/wallet', labelKey: 'nav.wallet', icon: Wallet },
  { path: '/profile', labelKey: 'nav.profile', icon: User },
];

/** Admin-only navigation items / Ítems exclusivos para administradores */
const ADMIN_ITEMS = [
  { path: '/admin', labelKey: 'nav.adminUsers', icon: Users },
  { path: '/admin/commissions', labelKey: 'nav.commissionConfig', icon: DollarSign },
  { path: '/admin/properties', labelKey: 'nav.adminProperties', icon: Building2 },
  { path: '/admin/tours', labelKey: 'nav.adminTours', icon: MapPin },
  { path: '/admin/reservations', labelKey: 'nav.adminReservations', icon: CalendarDays },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const isAdmin = (user as { role?: string })?.role === 'admin';

  /** Regular nav items with wallet feature flag filter */
  const filteredNavItems = NAV_ITEMS.filter(
    (item) => item.path !== '/wallet' || featureFlags.cryptoWallet
  );

  const currentLang = getCurrentLanguage();

  const handleLanguageChange = (code: 'en' | 'es') => {
    changeLanguage(code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden border-t border-slate-200 bg-white">
      <div className="px-4 py-3 space-y-1">
        {/* Regular navigation items */}
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors
                ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}

        {/* Admin section — only for admin users */}
        {isAdmin && (
          <div className="pt-3 mt-3 border-t border-slate-200">
            <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              {t('nav.administration')}
            </p>
            {ADMIN_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        )}

        {/* Language selector (mobile) */}
        <div className="pt-3 mt-3 border-t border-slate-200">
          <p className="px-4 py-2 text-xs font-medium text-slate-500 uppercase">
            Idioma / Language
          </p>
          <div className="flex gap-2 px-4">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code as 'en' | 'es')}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${currentLang === lang.code ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                `}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile user section */}
        <div className="pt-3 mt-3 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-medium">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
              <p className="text-xs text-slate-500 capitalize">
                {(user as { role?: string })?.role || 'user'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileMenu;
