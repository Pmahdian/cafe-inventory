'use client';

import { useEffect, useState } from 'react';
import {
  PackagePlus, Loader2, Check, History, Boxes
} from 'lucide-react';
import {
  getIngredients, createStockEntry, getStockEntries,
  Ingredient, StockEntry
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/components/LanguageProvider';

export default function StockPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recent, setRecent] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    ingredient_id: 0,
    amount: '',
    note: '',
  });

  const toast = useToast();
  const { t, formatDate } = useLanguage();

  const loadData = async () => {
    try {
      const [i, s] = await Promise.all([getIngredients(), getStockEntries()]);
      setIngredients(i);
      setRecent(s.slice(0, 8));
      if (i.length > 0 && form.ingredient_id === 0) {
        setForm((f) => ({ ...f, ingredient_id: i[0].id }));
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = ingredients.find((i) => i.id === form.ingredient_id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.ingredient_id || !amount || amount <= 0) {
      toast.error('لطفا یک ماده اولیه و مقدار معتبر انتخاب کنید');
      return;
    }
    setSubmitting(true);
    try {
      await createStockEntry({
        ingredient_id: form.ingredient_id,
        amount,
        note: form.note || undefined,
      });
      toast.success('با موفقیت به انبار اضافه شد');
      setForm((f) => ({ ...f, amount: '', note: '' }));
      await loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message || 'خطا در ثبت');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
          <PackagePlus className="w-4 h-4" /> {t('operations')}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">
          {t('stock_in_title')}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {t('stock_in_desc')}
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">{t('select_ingredient')}</label>
            <select
              value={form.ingredient_id}
              onChange={(e) => setForm({ ...form, ingredient_id: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (موجودی: {Number(i.current_stock).toFixed(0)} {i.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
              {t('amount')} {selected && `(${selected.unit})`}
            </label>
            <input
              type="number" step="0.01" min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 tabular"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">{t('note_optional')}</label>
          <input
            type="text"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="مثلاً: خرید صبحگاهی"
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
        <button
          type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
          {t('save_stock')}
        </button>
      </form>

      {recent.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--text-muted)]" />
            <h2 className="text-sm font-bold text-[var(--text)]">{t('recent_entries')}</h2>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {recent.map((e) => (
                <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-[var(--text)]">{e.ingredient_name}</p>
                    {e.note && <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{e.note}</p>}
                  </div>
                  <div className="text-left shrink-0 ml-3">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular">
                      +{Number(e.amount).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] tabular">{formatDate(e.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}