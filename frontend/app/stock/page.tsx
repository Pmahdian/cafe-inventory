'use client';

import { useEffect, useState } from 'react';
import {
  PackagePlus,
  Loader2,
  Check,
  History,
  Boxes,
} from 'lucide-react';
import {
  getIngredients,
  createStockEntry,
  getStockEntries,
  Ingredient,
  StockEntry,
} from '@/lib/api';

export default function StockPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recent, setRecent] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    ingredient_id: 0,
    amount: '',
    note: '',
  });

  const loadData = async () => {
    try {
      const [i, s] = await Promise.all([getIngredients(), getStockEntries()]);
      setIngredients(i);
      setRecent(s.slice(0, 8));
      if (i.length > 0 && form.ingredient_id === 0) {
        setForm((f) => ({ ...f, ingredient_id: i[0].id }));
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to load' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selected = ingredients.find((i) => i.id === form.ingredient_id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.ingredient_id || !amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Please select an ingredient and enter a valid amount' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await createStockEntry({
        ingredient_id: form.ingredient_id,
        amount,
        note: form.note || undefined,
      });
      setMessage({
        type: 'success',
        text: `Added ${amount} ${selected?.unit} of ${selected?.name}`,
      });
      setForm((f) => ({ ...f, amount: '', note: '' }));
      await loadData();
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage({
        type: 'error',
        text: e.response?.data?.detail || e.message || 'Failed to save',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
        <p className="text-sm text-stone-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in-up max-w-3xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-700 mb-2">
          <PackagePlus className="w-3.5 h-3.5" />
          Incoming Stock
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">
          Stock In
        </h1>
        <p className="text-sm text-stone-500 mt-2">
          Record new deliveries. Stock is added to inventory automatically.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-4 flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={submit}
        className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm space-y-5"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Ingredient
          </label>
          <select
            value={form.ingredient_id}
            onChange={(e) => setForm({ ...form, ingredient_id: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          >
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — current: {Number(i.current_stock).toFixed(0)} {i.unit}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Amount {selected && <span className="text-stone-400">({selected.unit})</span>}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all tabular"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Note <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="e.g. Morning delivery"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <PackagePlus className="w-4 h-4" />
              Add to Inventory
            </>
          )}
        </button>
      </form>

      {/* Recent */}
      {recent.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-semibold text-stone-700">Recent entries</h2>
          </div>
          <div className="rounded-2xl border border-stone-200/60 bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-stone-100">
              {recent.map((e) => (
                <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-stone-900">{e.ingredient_name}</p>
                    {e.note && (
                      <p className="text-xs text-stone-500 mt-0.5 truncate">{e.note}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-emerald-700 tabular">
                      +{Number(e.amount).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-stone-400 tabular">{e.date}</p>
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