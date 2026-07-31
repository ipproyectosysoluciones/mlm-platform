/**
 * Navbar - Barra de navegación principal de Nexo Real con glass morphism.
 * Orquesta subcomponentes: DesktopNav, MobileNav, LanguageSelector, UserMenu.
 *
 * Navbar - Main Nexo Real navigation bar with glass morphism.
 * Orchestrates sub-components: DesktopNav, MobileNav, LanguageSelector, UserMenu.
 *
 * @module components/layout/Navbar
 */

import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';
import { Building2, LogIn, Menu, X } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { UserMenu } from './UserMenu';
import { DesktopNav } from './nav/DesktopNav';
import { MobileNav } from './nav/MobileNav';

// ============================================
// Types / Tipos
// ============================================

interface NavbarProps {
  /** Callback to toggle mobile menu / Callback para abrir/cerrar menú mobile */
  onMobileMenuToggle: () => void;
  /** Whether mobile menu is currently open / Si el menú mobile está abierto */
  mobileMenuOpen: boolean;
}

// ============================================
// Component / Componente
// ============================================

export function Navbar({ onMobileMenuToggle, mobileMenuOpen }: NavbarProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

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
          <DesktopNav />

          {/* Right section: language + auth + mobile toggle */}
          <div className="flex items-center gap-3">
            {/* Language selector (desktop) */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>

            {/* User / Login (desktop) */}
            {user ? (
              <div className="hidden md:block">
                <UserMenu />
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
              >
                <LogIn className="w-4 h-4" />
                {t('nav.signIn')}
              </Link>
            )}

            {/* Mobile menu toggle */}
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
      <MobileNav isOpen={mobileMenuOpen} onClose={onMobileMenuToggle} />
    </nav>
  );
}

export default Navbar;
