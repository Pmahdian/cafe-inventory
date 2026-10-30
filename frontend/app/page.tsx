'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Boxes, CupSoda, AlertTriangle, Activity,
  TrendingUp, ArrowUpFromLine, Package, Sparkles, DollarSign, ReceiptText
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  getDailyReport, getIngredients, getProducts, getSales,
  DailyReport, Ingredient, Product, Sale
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/components/LanguageProvider';

// رنگ‌های اختصاصی برای نمودار دایره‌ای
const COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

export default function DashboardPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  
  const toast = useToast();
  const { lang, t, formatDate } = useLanguage();

  useEffect(() => {
    Promise.all([getDailyReport(), getIngredients(), getProducts(), getSales()])
      .then(([r, i, p, s]) => {
        setReport(r);
        setIngredients(i);
        setProducts(p);
        setSales(s);
      })
      .catch((e) => toast.error(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Data Processing ───────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = useMemo(() => sales.filter(s => s.date === todayStr), [sales, todayStr]);
  
  const todayRevenue = useMemo(() => todaySales.reduce((sum, s) => sum + s.total_price, 0), [todaySales]);
  const todayItemsCount = useMemo(() => todaySales.reduce((sum, s) => sum + s.quantity, 0), [todaySales]);

  const categorySalesData = useMemo(() => {
    const catMap: Record<string, number> = {};
    sales.forEach(sale => {
      const product = products.find(p => p.id === sale.product);
      if (product && product.category_name) {
        catMap[product.category_name] = (catMap[product.category_name] || 0) + sale.total_price;
      }
    });
    return Object.keys(catMap)
      .map(name => ({ name, value: catMap[name] }))
      .sort((a, b) => b.value - a.value)
      .filter(d => d.value > 0);
  }, [sales, products]);

  const topProductsData = useMemo(() => {
    const prodMap: Record<number, { name: string; quantity: number }> = {};
    sales.forEach(sale => {
      if (!prodMap[sale.product]) {
        prodMap[sale.product] = { name: sale.product_name, quantity: 0 };
      }
      prodMap[sale.product].quantity += sale.quantity;
    });
    return Object.values(prodMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // ۵ محصول برتر
  }, [sales]);

  const maxProdQty = topProductsData.length > 0 ? topProductsData[0].quantity : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-amber-500 animate-spin" />
      </div>
    );
  }

  const lowStock = report?.items.filter((i) => i.below_min) || [];

  return (
    <div className="space-y-8 fade-in pb-10">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
            <Sparkles className="w-4 h-4" /> {t('overview')}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">
            {t('dashboard')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('snapshot_for')} <span className="font-semibold text-[var(--text)]">{formatDate(report?.date)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t('system_online')}</span>
        </div>
      </div>

      {/* Stats Grid (Top Row) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* New KPI Cards */}
        <StatCard label={t('today_revenue' as any) || 'درآمد امروز'} value={`${todayRevenue.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')}`} icon={DollarSign} tone="amber" hint="تومان" isBig />
        <StatCard label={t('today_sales' as any) || 'فروش امروز'} value={todayItemsCount} icon={ReceiptText} tone="blue" hint="آیتم" isBig />
        
        {/* Existing Cards */}
        <StatCard label={t('ingredients')} value={ingredients.length} icon={Boxes} tone="violet" hint={t('tracked_items')} />
        <StatCard label={t('products')} value={products.length} icon={CupSoda} tone="emerald" hint={t('on_menu')} />
        <StatCard label={t('low_stock')} value={lowStock.length} icon={AlertTriangle} tone={lowStock.length > 0 ? 'red' : 'stone'} hint={lowStock.length > 0 ? 'هشدار' : t('all_good')} />
        <StatCard label={t('active_today')} value={report?.items.filter(i => i.used > 0 || i.entered > 0).length || 0} icon={Activity} tone="stone" hint={t('moved_items')} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Sales Donut Chart */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-500" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)] leading-tight">فروش بر اساس دسته‌بندی</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">کل درآمد به تفکیک منو</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] flex items-center justify-center">
            {categorySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categorySalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => `${value.toLocaleString()} تومان`}
                    contentStyle={{ borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--text)', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">داده‌ای برای نمایش نیست</p>
            )}
          </div>
        </div>

        {/* Top Products List */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
              <CupSoda className="w-5 h-5 text-violet-600 dark:text-violet-500" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)] leading-tight">پرفروش‌ترین محصولات</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">بر اساس تعداد فروش</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            {topProductsData.length > 0 ? (
              topProductsData.map((p, idx) => {
                const percent = (p.quantity / maxProdQty) * 100;
                return (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-[var(--text)] flex items-center gap-2">
                        <span className="text-[10px] font-black text-[var(--text-muted)] w-4">{idx + 1}</span>
                        {p.name}
                      </span>
                      <span className="font-bold tabular text-[var(--text-muted)]">{p.quantity} <span className="text-[10px]">عدد</span></span>
                    </div>
                    <div className="h-2.5 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[var(--text-muted)] text-center">داده‌ای برای نمایش نیست</p>
            )}
          </div>
        </div>

      </div>

      {/* Today's Movement Table */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
            <ArrowUpFromLine className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] leading-tight">{t('todays_movement')}</h2>
          </div>
        </div>
        
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/50">
                  <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('item')}</th>
                  <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('received')}</th>
                  <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('used')}</th>
                  <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('remaining')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {report?.items.map((item) => (
                  <tr key={item.ingredient_id} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                        <span className="font-semibold text-[var(--text)]">{item.name}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 tabular ${lang === 'fa' ? 'text-right' : 'text-left'}`}>
                      {item.entered > 0 ? <span className="inline-flex px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold">+{item.entered.toFixed(0)}</span> : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className={`px-6 py-4 tabular ${lang === 'fa' ? 'text-right' : 'text-left'}`}>
                      {item.used > 0 ? <span className="inline-flex px-2 py-1 rounded-md bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold">−{item.used.toFixed(0)}</span> : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className={`px-6 py-4 tabular ${lang === 'fa' ? 'text-right' : 'text-left'}`}>
                      <span className={`font-bold ${item.below_min ? 'text-red-600 dark:text-red-400' : 'text-[var(--text)]'}`}>{item.remaining.toFixed(0)}</span>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase ml-1">{item.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}



function StatCard({ label, value, icon: Icon, tone, hint, isBig = false }: any) {
  const toneStyles: any = {
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500',
    violet: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
    red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    stone: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400',
  };

  return (
    <div className={`group rounded-2xl p-5 border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${isBig ? 'col-span-1' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-bold text-[var(--text-muted)] truncate pr-2">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toneStyles[tone]} transition-transform group-hover:scale-110 shrink-0`}>
          <Icon className="w-4 h-4" strokeWidth={2.5} />
        </div>
      </div>
      <div className={`${isBig ? 'text-2xl' : 'text-2xl'} font-black tabular text-[var(--text)] leading-none truncate`}>{value}</div>
      <p className="text-[10px] text-[var(--text-muted)] mt-2">{hint}</p>
    </div>
  );
}