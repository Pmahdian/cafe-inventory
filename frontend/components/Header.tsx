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
import ThemeToggle from './ThemeToggle';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/stock', label: 'Stock In', icon: PackagePlus },
  { href: '/report', label: 'Daily Report', icon: BarChart3 },
  { href: '/ingredients', label: 'Ingredients', icon: Boxes },
  { href: '/products', label: 'Products', icon: CupSoda },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-10 h-10 shrink-0">
              <div
                className="absolute inset-0 rounded-xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                style={{
                  background:
                    'linear-gradient(135deg, var(--primary) 0%, var(--primary-bright) 100%)',
                }}
              />
              <div
                className="relative w-full h-full rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, var(--primary) 0%, var(--primary-bright) 100%)',
                }}
              >
                <Coffee className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span
                className="text-[15px] font-bold tracking-tight"
                style={{ color: 'var(--text)' }}
              >
                Cafe Inventory
              </span>
              <span
                className="text-[10px] uppercase tracking-[0.16em] font-semibold mt-1"
                style={{ color: 'var(--text-subtle)' }}
              >
                Management System
              </span>
            </div>
          </Link>

          {/* Nav */}
          <div className="flex items-center gap-2">
            <nav
              className="hidden lg:flex items-center gap-0.5 p-1 rounded-2xl"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200"
                    style={
                      isActive
                        ? {
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            boxShadow: 'var(--shadow-sm)',
                          }
                        : { color: 'var(--text-muted)' }
                    }
                  >
                    <Icon
                      className="w-[15px] h-[15px]"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="lg:hidden flex gap-1.5 overflow-x-auto pb-3 -mx-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
                style={
                  isActive
                    ? {
                        background:
                          'linear-gradient(135deg, var(--primary) 0%, var(--primary-bright) 100%)',
                        color: 'white',
                        boxShadow: 'var(--shadow-sm)',
                      }
                    : {
                        background: 'var(--surface-2)',
                        color: 'var(--text-muted)',
                      }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}