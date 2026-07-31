/**
 * @fileoverview DesktopNav — desktop navigation bar section
 * @description Renders nav links for authenticated or public users, plus an admin
 *              dropdown for admin users. Hidden on mobile (md:flex).
 *              Renderiza links de navegación desktop + dropdown admin.
 * @module components/layout/nav/DesktopNav
 */

import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Shield, ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../context/useAuth';
import { featureFlags } from '../../../utils/featureFlags';
import { NavItemLink } from './NavItemLink';
import { NAV_ITEMS, ADMIN_NAV_ITEMS, PUBLIC_NAV_ITEMS } from './NavLinks';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../../ui/dropdown-menu';

// ============================================
// Component / Componente
// ============================================

export function DesktopNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const isAdmin = (user as { role?: string })?.role === 'admin';
  const isAdminRouteActive = location.pathname.startsWith('/admin');

  /** Filter nav items (e.g., wallet hidden by feature flag) */
  const filteredNavItems = NAV_ITEMS.filter(
    (item) => item.path !== '/wallet' || featureFlags.cryptoWallet
  );

  return (
    <div className="hidden md:flex items-center gap-1">
      {user ? (
        <>
          {filteredNavItems.map((item) => (
            <NavItemLink
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              variant="desktop"
            />
          ))}

          {/* Admin dropdown — only for admin users */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 outline-none',
                    isAdminRouteActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  )}
                >
                  {isAdminRouteActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30" />
                  )}
                  <Shield
                    className={cn(
                      'w-4 h-4 relative z-10',
                      isAdminRouteActive && 'text-emerald-400'
                    )}
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
                {ADMIN_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <DropdownMenuItem
                      key={item.path}
                      asChild
                      className={cn(
                        'cursor-pointer rounded-md',
                        isActive
                          ? 'text-emerald-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50 focus:bg-slate-700/50 focus:text-white'
                      )}
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
        /* Public nav items (not logged in) */
        <>
          {PUBLIC_NAV_ITEMS.map((item) => (
            <NavItemLink
              key={item.path}
              item={item}
              isActive={location.pathname.startsWith(item.path)}
              variant="desktop"
            />
          ))}
        </>
      )}
    </div>
  );
}
