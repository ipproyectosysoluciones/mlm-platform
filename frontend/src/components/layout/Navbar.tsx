/**
 * Navbar - Modern navigation with glass morphism effect
 *
 * @module components/layout/Navbar
 */
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
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
  Sparkles,
  Trophy,
  Medal,
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { UserMenu } from './UserMenu';

// Navigation items
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

const ADMIN_ITEMS = [
  { path: '/admin', labelKey: 'nav.admin', icon: Shield },
  { path: '/admin/commissions', labelKey: 'nav.commissionConfig', icon: DollarSign },
];

interface NavbarProps {
  onMobileMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

export function Navbar({ onMobileMenuToggle, mobileMenuOpen }: NavbarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const isAdmin = (user as any)?.role === 'admin';
  const allNavItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-110">
                <TreeDeciduous className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Nexo Real
              </span>
              <div className="text-xs text-slate-400 -mt-1">Premium Streaming</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              // Logged in: show navigation items
              allNavItems.map((item) => {
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
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30" />
                    )}
                    <Icon
                      className={`w-4 h-4 relative z-10 ${isActive ? 'text-purple-400' : ''}`}
                    />
                    <span className="relative z-10">{t(item.labelKey)}</span>
                  </Link>
                );
              })
            ) : (
              // Not logged in: show products link
              <Link
                to="/products"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
              >
                <Sparkles className="w-4 h-4" />
                Products
              </Link>
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
                  className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
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
              allNavItems.map((item) => {
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
                          ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
                    {t(item.labelKey)}
                  </Link>
                );
              })
            ) : (
              <Link
                to="/products"
                onClick={onMobileMenuToggle}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
              >
                <Sparkles className="w-5 h-5" />
                Products
              </Link>
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
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-purple-500/25"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
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
