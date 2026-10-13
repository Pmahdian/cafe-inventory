'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const pathNames: Record<string, string> = {
  '/': 'Dashboard',
  '/sales': 'Sales',
  '/stock': 'Stock In',
  '/report': 'Daily Report',
  '/ingredients': 'Ingredients',
  '/products': 'Products',
};

export default function TopBar() {
  const pathname = usePathname();
  const title = pathNames[pathname] || 'Page';

  return (
    <header
      className="h-16 sticky top-0 z-30 flex items-center px-6 gap-4"
      style={{
        background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span style={{ color: 'var(--text-subtle)' }}>Cafe Inventory</span>
        <span style={{ color: 'var(--text-subtle)' }}>/</span>
        <span className="font-medium" style={{ color: 'var(--text)' }}>
          {title}
        </span>
      </div>

      <div className="flex-1" />

      {/* Search hint */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs w-64"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-subtle)',
        }}
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search…</span>
        <div className="flex-1" />
        <kbd
          className="px-1.5 py-0.5 rounded text-[10px] font-mono"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Notifications */}
      <button
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
      >
        <Bell className="w-4 h-4" />
      </button>

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  );
} 