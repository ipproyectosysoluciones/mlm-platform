/**
 * @fileoverview MobileNav — mobile navigation menu
 * @description Full-screen mobile menu with nav links, admin section, and auth buttons.
 *              Uses the same dark glass theme as the desktop navbar.
 *              Menú móvil completo con links, sección admin y botones de auth.
 * @module components/layout/nav/MobileNav
 */

import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Shield, LogIn } from 'lucide-react';
import { useAuth } from '../../../context/useAuth';
import { featureFlags } from '../../../utils/featureFlags';
import { NavItemLink } from './NavItemLink';
import { NAV_ITEMS, ADMIN_NAV_ITEMS, PUBLIC_NAV_ITEMS } from './NavLinks';
import { UserMenu } from '../UserMenu';

// ============================================
// Types / Tipos
// ============================================

interface MobileNavProps {
  /** Whether the mobile menu is open / Si el menú móvil está abierto */
  isOpen: boolean;
  /** Callback to close the menu / Callback para cerrar el menú */
  onClose: () => void;
}

// ============================================
// Component / Componente
// ============================================

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const isAdmin = (user as { role?: string })?.role === 'admin';

  /** Filter nav items (e.g., wallet hidden by feature flag) */
  const filteredNavItems = NAV_ITEMS.filter(
    (item) => item.path !== '/wallet' || featureFlags.cryptoWallet
  );

  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50">
      <div className="px-4 py-6 space-y-4">
        {user ? (
          <>
            {/* Regular nav items */}
            {filteredNavItems.map((item) => (
              <NavItemLink
                key={item.path}
                item={item}
                isActive={location.pathname === item.path}
                variant="mobile"
                onClick={onClose}
              />
            ))}

            {/* Admin section — only for admin users */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-700/50">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  {t('nav.administration')}
                </p>
                {ADMIN_NAV_ITEMS.map((item) => (
                  <NavItemLink
                    key={item.path}
                    item={item}
                    isActive={location.pathname === item.path}
                    variant="mobile"
                    onClick={onClose}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Public nav items */
          PUBLIC_NAV_ITEMS.map((item) => (
            <NavItemLink
              key={item.path}
              item={item}
              isActive={location.pathname.startsWith(item.path)}
              variant="mobile"
              onClick={onClose}
            />
          ))
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
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-emerald-500/25"
            >
              <LogIn className="w-5 h-5" />
              {t('nav.signIn')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
