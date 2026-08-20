/**
 * @fileoverview NavLinks — navigation link configuration
 * @description Centralized link definitions for the navbar: authenticated user links,
 *              admin dropdown items, and public visitor links.
 *              Definiciones centralizadas de links para la navbar.
 * @module components/layout/nav/NavLinks
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  TreeDeciduous,
  Users,
  User,
  FileText,
  DollarSign,
  Wallet,
  Receipt,
  Building2,
  MapPin,
  CalendarCheck,
  CalendarDays,
  Trophy,
  Medal,
} from 'lucide-react';

// ============================================
// Types / Tipos
// ============================================

export interface NavLinkItem {
  /** Route path / Ruta de navegación */
  path: string;
  /** i18n translation key / Clave de traducción i18n */
  labelKey: string;
  /** Lucide icon component / Componente icono Lucide */
  icon: LucideIcon;
}

// ============================================
// Navigation Data / Datos de navegación
// ============================================

/**
 * Navigation items shown to authenticated users
 * Ítems de navegación para usuarios autenticados
 */
export const NAV_ITEMS: NavLinkItem[] = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/tree', labelKey: 'nav.tree', icon: TreeDeciduous },
  { path: '/crm', labelKey: 'nav.crm', icon: Users },
  { path: '/leaderboard', labelKey: 'nav.leaderboard', icon: Trophy },
  { path: '/achievements', labelKey: 'nav.achievements', icon: Medal },
  { path: '/landing-pages', labelKey: 'nav.landingPages', icon: FileText },
  { path: '/wallet', labelKey: 'nav.wallet', icon: Wallet },
  { path: '/orders', labelKey: 'nav.orders', icon: Receipt },
  { path: '/profile', labelKey: 'nav.profile', icon: User },
];

/**
 * Admin dropdown items (shown in dropdown on desktop, collapsible on mobile)
 * Ítems del dropdown de administración
 */
export const ADMIN_NAV_ITEMS: NavLinkItem[] = [
  { path: '/admin', labelKey: 'nav.adminUsers', icon: Users },
  { path: '/orders', labelKey: 'nav.orders', icon: Receipt },
  { path: '/admin/commissions', labelKey: 'nav.commissionConfig', icon: DollarSign },
  { path: '/admin/properties', labelKey: 'nav.adminProperties', icon: Building2 },
  { path: '/admin/tours', labelKey: 'nav.adminTours', icon: MapPin },
  { path: '/admin/reservations', labelKey: 'nav.adminReservations', icon: CalendarDays },
];

/**
 * Public navigation items (shown when not logged in)
 * Ítems de navegación públicos (visitantes no autenticados)
 */
export const PUBLIC_NAV_ITEMS: NavLinkItem[] = [
  { path: '/properties', labelKey: 'nav.properties', icon: Building2 },
  { path: '/tours', labelKey: 'nav.tours', icon: MapPin },
  { path: '/mis-reservas', labelKey: 'nav.reservations', icon: CalendarCheck },
];
