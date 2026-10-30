'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'en' | 'fa';

const translations = {
  en: {
    dashboard: 'Dashboard',
    sales: 'Sales (POS)',
    stock_in: 'Stock In',
    daily_report: 'Daily Report',
    ingredients: 'Ingredients',
    products: 'Products',
    overview: 'Overview',
    operations: 'Operations',
    analytics: 'Analytics',
    catalog: 'Catalog',
    snapshot_for: 'Daily snapshot for',
    system_online: 'System Online',
    tracked_items: 'Tracked items',
    on_menu: 'On menu',
    low_stock: 'Low Stock',
    all_good: 'All good',
    active_today: 'Active Today',
    moved_items: 'Moved items',
    top_products: 'Top Products',
    units_sold_7d: 'Units sold in the last 7 days',
    todays_movement: "Today's Movement",
    item: 'Item',
    received: 'Received',
    used: 'Used',
    remaining: 'Remaining',
    stock_in_title: 'Record Stock In',
    stock_in_desc: 'Add new ingredients to your inventory.',
    select_ingredient: 'Select Ingredient',
    amount: 'Amount',
    note_optional: 'Note (Optional)',
    save_stock: 'Add to Inventory',
    recent_entries: 'Recent Entries',
  },
  fa: {
    dashboard: 'داشبورد',
    sales: 'صندوق فروش',
    stock_in: 'ورود کالا',
    daily_report: 'گزارش روزانه',
    ingredients: 'مواد اولیه',
    products: 'محصولات',
    overview: 'نمای کلی',
    operations: 'عملیات',
    analytics: 'آنالیز',
    catalog: 'کاتالوگ',
    snapshot_for: 'گزارش روزانه برای',
    system_online: 'سیستم آنلاین',
    tracked_items: 'کالاهای ثبت‌شده',
    on_menu: 'در منو',
    low_stock: 'کمبود موجودی',
    all_good: 'اوکی است',
    active_today: 'فعالیت امروز',
    moved_items: 'کالاهای جابجاشده',
    top_products: 'پرفروش‌ترین‌ها',
    units_sold_7d: 'فروش ۷ روز اخیر',
    todays_movement: 'گردش انبار امروز',
    item: 'کالا',
    received: 'ورودی',
    used: 'مصرفی',
    remaining: 'باقیمانده',
    stock_in_title: 'ثبت ورود کالا',
    stock_in_desc: 'مواد اولیه جدید را به انبار اضافه کنید.',
    select_ingredient: 'انتخاب ماده اولیه',
    amount: 'مقدار',
    note_optional: 'یادداشت (اختیاری)',
    save_stock: 'ثبت در انبار',
    recent_entries: 'آخرین ورودی‌ها',
  }
};

interface LanguageContextType {
  lang: Language;
  t: (key: keyof typeof translations['en']) => string;
  toggleLang: () => void;
  isRtl: boolean;
  formatDate: (dateString?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Language;
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === 'en' ? 'fa' : 'en'));
  
  const t = (key: keyof typeof translations['en']) => {
    return translations[lang][key] || key;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(date);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, isRtl: lang === 'fa', formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};