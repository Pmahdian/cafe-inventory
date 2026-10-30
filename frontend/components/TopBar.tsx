'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Languages } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from './LanguageProvider';

export default function TopBar() {
  const pathname = usePathname();
  const { lang, toggleLang, t } = useLanguage();

  const paths: Record<string, string> = {
    '/': 'dashboard',
    '/sales': 'sales',
    '/invoices': 'invoices', 
    '/stock': 'stock_in',
    '/report': 'daily_report',
    '/ingredients': 'ingredients',
    '/products': 'products',
  };
  
  const title = t(paths[pathname] || 'dashboard');

  return (
    <header className="h-16 sticky top-0 z-30 flex items-center px-6 md:px-8 gap-4 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)] transition-colors duration-300">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[var(--text-muted)]">Cafe Inventory</span>
        <span className="text-[var(--text-muted)]">/</span>
        <span className="font-semibold text-[var(--text)]">{title}</span>
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs w-64 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer hover:border-[var(--text-muted)] transition-colors">
        <Search className="w-4 h-4" />
        <span>{lang === 'fa' ? 'جستجو...' : 'Search...'}</span>
        <div className="flex-1" />
        <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-2)] border border-[var(--border)]">⌘K</kbd>
      </div>

      {/* Language Toggle Button */}
      <button onClick={toggleLang} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-bold text-xs">
        {lang === 'en' ? 'FA' : 'EN'}
      </button>

      <button className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
        <Bell className="w-4 h-4" />
      </button>

      <ThemeToggle />
    </header>
  );
}