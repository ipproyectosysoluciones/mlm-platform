/**
 * Navbar - Barra de navegación superior
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
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { UserMenu } from './UserMenu';

// Navigation items
const NAV_ITEMS = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/tree', labelKey: 'nav.tree', icon: TreeDeciduous },
  { path: '/crm', labelKey: 'nav.crm', icon: Users },
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
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <TreeDeciduous className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 hidden sm:block">MLM Pro</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Language selector (desktop) */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>

            {/* User menu (desktop) */}
            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
