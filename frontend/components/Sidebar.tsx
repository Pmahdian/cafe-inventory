'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Coffee, LayoutDashboard, ShoppingCart,
  PackagePlus, BarChart3, Boxes, CupSoda, Receipt
} from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

const sections = [
  {
    title: t('overview'),
    items: [{ href: '/', label: t('dashboard'), icon: LayoutDashboard }],
  },
  {
    title: t('operations'),
    items: [
      { href: '/sales', label: t('sales'), icon: ShoppingCart },
      { href: '/invoices', label: t('invoices'), icon: Receipt },
      { href: '/stock', label: t('stock_in'), icon: PackagePlus },
    ],
  },
  {
    title: t('analytics'),
    items: [{ href: '/report', label: t('daily_report'), icon: BarChart3 }],
  },
  {
    title: t('catalog'),
    items: [
      { href: '/ingredients', label: t('ingredients'), icon: Boxes },
      { href: '/products', label: t('products'), icon: CupSoda },
    ],
  },
];

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 flex flex-col z-40 bg-[var(--surface)] border-r border-[var(--border)] transition-colors duration-300">
      <div className="h-16 px-6 flex items-center gap-3 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
          <Coffee className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold text-[var(--text)]">Cafe Inv.</span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">v1.0</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {sections.map((section, idx) => (
          <div key={idx}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 shadow-sm'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="px-4 py-3 rounded-xl bg-[var(--surface-2)] flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-[var(--text-muted)]">{t('system_online')}</span>
        </div>
      </div>
    </aside>
  );
}