/**
 * @fileoverview NavItemLink — reusable navigation link component
 * @description Single nav link with icon, label, active state, and hover effects.
 *              Supports desktop and mobile variants with different styling.
 *              Componente de link de navegación reutilizable.
 * @module components/layout/nav/NavItemLink
 */

import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils/cn';
import type { NavLinkItem } from './NavLinks';

// ============================================
// Types / Tipos
// ============================================

interface NavItemLinkProps {
  /** Link configuration / Configuración del link */
  item: NavLinkItem;
  /** Whether this link matches the current route / Si el link coincide con la ruta actual */
  isActive: boolean;
  /** Visual variant / Variante visual */
  variant: 'desktop' | 'mobile';
  /** Optional click handler (mobile: close menu) / Handler opcional (mobile: cerrar menú) */
  onClick?: () => void;
}

// ============================================
// Styles / Estilos
// ============================================

const desktopStyles = {
  link: cn(
    'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
    'transition-all duration-300'
  ),
  linkInactive:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50',
  linkActive: 'text-slate-900 dark:text-white',
  activeBg:
    'absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30',
  icon: 'w-4 h-4 relative z-10',
  iconActive: 'text-emerald-600 dark:text-emerald-400',
  iconInactive: '',
  label: 'relative z-10',
};

const mobileStyles = {
  link: cn(
    'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium',
    'transition-all duration-300'
  ),
  linkInactive:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50',
  linkActive:
    'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-slate-900 dark:text-white border border-emerald-500/30',
  activeBg: '',
  icon: 'w-5 h-5',
  iconActive: 'text-emerald-600 dark:text-emerald-400',
  iconInactive: '',
  label: '',
};

// ============================================
// Component / Componente
// ============================================

export function NavItemLink({ item, isActive, variant, onClick }: NavItemLinkProps) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const styles = variant === 'desktop' ? desktopStyles : mobileStyles;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(styles.link, isActive ? styles.linkActive : styles.linkInactive)}
    >
      {/* Desktop variant has an active background layer */}
      {variant === 'desktop' && isActive && <div className={styles.activeBg} />}

      <Icon className={cn(styles.icon, isActive ? styles.iconActive : styles.iconInactive)} />
      <span className={styles.label}>{t(item.labelKey)}</span>
    </Link>
  );
}
