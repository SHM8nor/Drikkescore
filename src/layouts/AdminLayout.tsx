import type { ReactNode } from 'react';
import BurgerMenu from '../components/navigation/BurgerMenu/BurgerMenu';
import '../styles/layouts.css';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * AdminLayout component for admin pages
 * Provides a consistent layout with header and navigation
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="protected-layout">
      <BurgerMenu />

      {/* Admin Header */}
      <header className="admin-header">
        <h1>Adminpanel</h1>
      </header>

      {/* Main Content */}
      <main className="admin-layout__content">
        {children}
      </main>
    </div>
  );
}
