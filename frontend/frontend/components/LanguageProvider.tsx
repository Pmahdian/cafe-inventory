'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Lang = 'en' | 'fa';

const dictionaries = {
  en: {
    // Navigation
    overview: 'Overview', operations: 'Operations', analytics: 'Analytics',
    catalog: 'Catalog', dashboard: 'Dashboard', sales: 'Sales (POS)',
    stock_in: 'Stock In', daily_report: 'Daily Report', ingredients: 'Ingredients',
    products: 'Products', invoices: 'Invoices',
    // Common
    system_online: 'System Online', loading: 'Loading...', no_data: 'No data found',
    cancel: 'Cancel', save: 'Save', edit: 'Edit', delete: 'Delete',
    date: 'Date', product: 'Product', qty: 'Qty', total_price: 'Total Price',
    actions: 'Actions', confirm_delete: 'Are you sure? Inventory will be restored.',
    // Dashboard
    snapshot_for: 'Daily snapshot for', tracked_items: 'Tracked items',
    on_menu: 'On menu', low_stock: 'Low Stock', all_good: 'All good',
    active_today: 'Active Today', moved_items: 'Moved items',
    todays_movement: "Today's Movement", item: 'Item', received: 'Received',
    used: 'Used', remaining: 'Remaining', today_revenue: 'Today Revenue',
    today_sales: 'Today Sales', sales_by_category: 'Sales by Category',
    category_sales_subtitle: 'Total revenue by menu category',
    top_products: 'Top Products', top_products_subtitle: 'Based on quantity sold',
    // Report
    report_desc: 'Opening · received · used · closing, for any date.',
    total_items: 'Items Tracked', moved_items_report: 'Items Moved',
    close_shift: 'Close Shift', system_total_sales: 'System Total Sales',
    actual_cash: 'Actual Cash in Drawer', confirm_close: 'Confirm & Close',
    shift_closed: 'Shift Closed!', difference: 'Difference',
    balance_ok: 'Perfectly balanced.', balance_diff: 'There is a discrepancy.',
    opening: 'Opening',
    // Invoices
    invoice_list: 'Invoice List',
  },
  fa: {
    // Navigation
    overview: 'نمای کلی', operations: 'عملیات', analytics: 'آنالیز',
    catalog: 'کاتالوگ', dashboard: 'داشبورد', sales: 'صندوق فروش',
    stock_in: 'ورود کالا', daily_report: 'گزارش روزانه', ingredients: 'مواد اولیه',
    products: 'محصولات', invoices: 'فاکتورها',
    // Common
    system_online: 'سیستم آنلاین', loading: 'در حال بارگذاری...', no_data: 'داده‌ای یافت نشد',
    cancel: 'انصراف', save: 'ذخیره', edit: 'ویرایش', delete: 'حذف',
    date: 'تاریخ', product: 'محصول', qty: 'تعداد', total_price: 'مبلغ کل',
    actions: 'عملیات', confirm_delete: 'آیا از حذف مطمئن هستید؟ موجودی برمی‌گردد.',
    // Dashboard
    snapshot_for: 'گزارش روزانه برای', tracked_items: 'کالاهای ثبت‌شده',
    on_menu: 'در منو', low_stock: 'کمبود موجودی', all_good: 'اوکی است',
    active_today: 'فعالیت امروز', moved_items: 'کالاهای جابجاشده',
    todays_movement: 'گردش انبار امروز', item: 'کالا', received: 'ورودی',
    used: 'مصرفی', remaining: 'باقیمانده', today_revenue: 'درآمد امروز',
    today_sales: 'فروش امروز', sales_by_category: 'فروش بر اساس دسته‌بندی',
    category_sales_subtitle: 'کل درآمد به تفکیک منو',
    top_products: 'پرفروش‌ترین محصولات', top_products_subtitle: 'بر اساس تعداد فروش',
    // Report
    report_desc: 'گزارش گردش انبار و فروش روزانه',
    total_items: 'کل کالاها', moved_items_report: 'کالاهای جابجاشده',
    close_shift: 'بستن صندوق', system_total_sales: 'کل فروش ثبت‌شده در سیستم',
    actual_cash: 'پول نقد شمارش‌شده در صندوق', confirm_close: 'ثبت و بستن صندوق',
    shift_closed: 'صندوق بسته شد!', difference: 'اختلاف صندوق',
    balance_ok: 'صندوق کاملاً بالانس است.', balance_diff: 'اختلاف با سیستم وجود دارد.',
    opening: 'موجودی اولیه',
    // Invoices
    invoice_list: 'لیست فاکتورها',
  }
};

export type TranslationKey = keyof typeof dictionaries['en'];

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  formatDate: (dateString?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  toggleLang: () => {},
  t: (key) => key,
  formatDate: () => '',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved) setLang(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang, mounted]);

  const toggleLang = () => setLang((l) => (l === 'en' ? 'fa' : 'en'));
  
  const t = (key: TranslationKey) => dictionaries[lang][key] || key;
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(date);
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);