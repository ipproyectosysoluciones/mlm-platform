/**
 * AppLayout - Layout principal con navbar horizontal.
 * El Navbar maneja internamente su propio menú móvil con lógica de auth.
 *
 * AppLayout - Main layout with horizontal navbar.
 * Navbar handles its own mobile menu internally with auth logic.
 *
 * @module components/layout/AppLayout
 */
import { useState } from 'react';
import { Navbar } from './Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}

export { AppLayout };
