'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Coffee,
  LayoutDashboard,
  ShoppingCart,
  PackagePlus,
  BarChart3,
  Boxes,
  CupSoda,
} from 'lucide-react';

const sections = [
  {
    title: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/sales', label: 'Sales', icon: ShoppingCart },
      { href: '/stock', label: 'Stock In', icon: PackagePlus },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/report', label: 'Daily Report', icon: BarChart3 },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { href: '/ingredients', label: 'Ingredients', icon: Boxes },
      { href: '/products', label: 'Products', icon: CupSoda },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-60 flex flex-col z-40"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="h-16 px-5 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background:
              'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
          }}
        >
          <Coffee className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="text-sm font-bold tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Cafe Inv.
          </span>
          <span
            className="text-[10px] uppercase tracking-wider mt-0.5"
            style={{ color: 'var(--text-subtle)' }}
          >
            v1.0
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p
              className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--text-subtle)' }}
            >
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
                    style={
                      isActive
                        ? {
                            background: 'var(--primary-soft)',
                            color: 'var(--primary)',
                          }
                        : { color: 'var(--text-muted)' }
                    }
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div
          className="px-3 py-2 rounded-lg text-[11px]"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text-muted)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'var(--success)' }}
            />
            <span>Backend online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
{/* Footer */}
<div
  className="px-3 py-3 shrink-0"
  style={{ borderTop: '1px solid var(--border)' }}
>
  <div
    className="px-3 py-2 rounded-lg text-[11px] flex items-center gap-2"
    style={{
      background: 'var(--surface-2)',
      color: 'var(--text-muted)',
    }}
  >
    <div
      className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
      style={{ background: 'var(--success)' }}
    />
    <span className="truncate">Backend online</span>
  </div>
</div>