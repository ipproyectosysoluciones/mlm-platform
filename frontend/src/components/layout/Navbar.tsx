/**
 * Navbar - Barra de navegación principal de Nexo Real con glass morphism.
 * Muestra ítems diferenciados para usuarios autenticados vs. visitantes.
 * Los links de admin se agrupan en un dropdown (desktop) o sección colapsada (mobile).
 *
 * Navbar - Main Nexo Real navigation bar with glass morphism.
 * Shows different items for authenticated users vs. public visitors.
 * Admin links are grouped into a dropdown (desktop) or collapsible section (mobile).
 *
 * @module components/layout/Navbar
 */
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';
import {
  LayoutDashboard,
  TreeDeciduous,
  Users,
  User,
  Shield,
  FileText,
  DollarSign,
  Wallet,
  Menu,
  X,
  LogIn,
  Building2,
  MapPin,
  CalendarCheck,
  CalendarDays,
  Trophy,
  Medal,
  ChevronDown,
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { UserMenu } from './UserMenu';
import { featureFlags } from '../../utils/featureFlags';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';

/** Navigation items shown to authenticated users / Ítems de navegación para usuarios autenticados */
const NAV_ITEMS = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/tree', labelKey: 'nav.tree', icon: TreeDeciduous },
  { path: '/crm', labelKey: 'nav.crm', icon: Users },
  { path: '/leaderboard', labelKey: 'nav.leaderboard', icon: Trophy },
  { path: '/achievements', labelKey: 'nav.achievements', icon: Medal },
  { path: '/landing-pages', labelKey: 'nav.landingPages', icon: FileText },
  { path: '/wallet', labelKey: 'nav.wallet', icon: Wallet },
  { path: '/profile', labelKey: 'nav.profile', icon: User },
];

/** Admin dropdown items / Ítems del dropdown de administración */
const ADMIN_DROPDOWN_ITEMS = [
  { path: '/admin', labelKey: 'nav.adminUsers', icon: Users },
  { path: '/admin/commissions', labelKey: 'nav.commissionConfig', icon: DollarSign },
  { path: '/admin/properties', labelKey: 'nav.adminProperties', icon: Building2 },
  { path: '/admin/tours', labelKey: 'nav.adminTours', icon: MapPin },
  { path: '/admin/reservations', labelKey: 'nav.adminReservations', icon: CalendarDays },
];

/** Public navigation items (not logged in) / Ítems públicos (visitantes no autenticados) */
const PUBLIC_NAV_ITEMS = [
  { path: '/properties', labelKey: 'nav.properties', icon: Building2 },
  { path: '/tours', labelKey: 'nav.tours', icon: MapPin },
  { path: '/mis-reservas', labelKey: 'nav.reservations', icon: CalendarCheck },
];

interface NavbarProps {
  /** Callback to toggle mobile menu / Callback para abrir/cerrar menú mobile */
  onMobileMenuToggle: () => void;
  /** Whether mobile menu is currently open / Si el menú mobile está abierto */
  mobileMenuOpen: boolean;
}

/**
 * Navbar component with responsive layout, glass morphism and Nexo Real brand colors.
 * Adapts navigation items based on authentication state and user role.
 *
 * Componente Navbar con layout responsive, glass morphism y colores de marca Nexo Real.
 * Adapta los ítems de navegación según el estado de autenticación y rol del usuario.
 */
export function Navbar({ onMobileMenuToggle, mobileMenuOpen }: NavbarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const isAdmin = (user as { role?: string })?.role === 'admin';

  /** Regular nav items with wallet feature flag filter */
  const filteredNavItems = NAV_ITEMS.filter(
    (item) => item.path !== '/wallet' || featureFlags.cryptoWallet
  );

  /** Whether any admin route is currently active */
  const isAdminRouteActive = location.pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300 group-hover:scale-110">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Nexo Real
              </span>
              <div className="text-xs text-emerald-400 -mt-1">Inmobiliaria & Turismo</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              // Logged in: show regular nav items + admin dropdown
              <>
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                        ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30" />
                      )}
                      <Icon
                        className={`w-4 h-4 relative z-10 ${isActive ? 'text-emerald-400' : ''}`}
                      />
                      <span className="relative z-10">{t(item.labelKey)}</span>
                    </Link>
                  );
                })}

                {/* Admin dropdown — only for admin users */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`
                            relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 outline-none
                            ${
                              isAdminRouteActive
                                ? 'text-white'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }
                          `}
                      >
                        {isAdminRouteActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30" />
                        )}
                        <Shield
                          className={`w-4 h-4 relative z-10 ${isAdminRouteActive ? 'text-emerald-400' : ''}`}
                        />
                        <span className="relative z-10">{t('nav.admin')}</span>
                        <ChevronDown className="w-3 h-3 relative z-10" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 min-w-[200px]"
                    >
                      <DropdownMenuLabel className="text-slate-400 text-xs uppercase tracking-wider">
                        {t('nav.administration')}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-700/50" />
                      {ADMIN_DROPDOWN_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <DropdownMenuItem
                            key={item.path}
                            asChild
                            className={`
                                cursor-pointer rounded-md
                                ${
                                  isActive
                                    ? 'text-emerald-400'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50 focus:bg-slate-700/50 focus:text-white'
                                }
                              `}
                          >
                            <Link to={item.path} className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {t(item.labelKey)}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            ) : (
              // Not logged in: show public property/tour links
              PUBLIC_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                      ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30" />
                    )}
                    <Icon
                      className={`w-4 h-4 relative z-10 ${isActive ? 'text-emerald-400' : ''}`}
                    />
                    <span className="relative z-10">{t(item.labelKey)}</span>
                  </Link>
                );
              })
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Language selector (desktop) */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>

            {/* Auth buttons */}
            {user ? (
              <>
                {/* User menu (desktop) */}
                <div className="hidden md:block">
                  <UserMenu />
                </div>
              </>
            ) : (
              <>
                {/* Login button (desktop) */}
                <Link
                  to="/login"
                  className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
                >
                  <LogIn className="w-4 h-4" />
                  {t('nav.signIn')}
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50">
          <div className="px-4 py-6 space-y-4">
            {/* Mobile navigation items */}
            {user ? (
              <>
                {/* Regular nav items */}
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onMobileMenuToggle}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}

                {/* Admin section — only for admin users */}
                {isAdmin && (
                  <div className="pt-3 border-t border-slate-700/50">
                    <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      {t('nav.administration')}
                    </p>
                    {ADMIN_DROPDOWN_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onMobileMenuToggle}
                          className={`
                              flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300
                              ${
                                isActive
                                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                              }
                            `}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                          {t(item.labelKey)}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              PUBLIC_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onMobileMenuToggle}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                    {t(item.labelKey)}
                  </Link>
                );
              })
            )}

            {/* Mobile auth buttons */}
            <div className="pt-4 border-t border-slate-700/50">
              {user ? (
                <div className="px-4">
                  <UserMenu />
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={onMobileMenuToggle}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-emerald-500/25"
                >
                  <LogIn className="w-5 h-5" />
                  {t('nav.signIn')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
