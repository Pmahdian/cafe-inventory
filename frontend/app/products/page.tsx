'use client';

import { useEffect, useState } from 'react';
import {
  CupSoda,
  Plus,
  Loader2,
  Check,
  AlertTriangle,
  Coffee,
} from 'lucide-react';
import { getProducts, Product, api } from '@/lib/api';

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ name: '', price: '' });

  const load = async () => {
    try {
      setItems(await getProducts());
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.post('/products/', {
        name: form.name,
        price: parseFloat(form.price),
        is_active: true,
      });
      setForm({ name: '', price: '' });
      setMessage({ type: 'success', text: 'Product created' });
      await load();
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      const err = e.response?.data;
      const text = err ? JSON.stringify(err) : e.message;
      setMessage({ type: 'error', text });
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
    <div className="space-y-8 fade-in-up">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-700 mb-2">
          <CupSoda className="w-3.5 h-3.5" />
          Menu
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">
          Products
        </h1>
        <p className="text-sm text-stone-500 mt-2">
          {items.length} products on the menu. Recipes define stock consumption.
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
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <p className="text-sm font-medium break-all">{message.text}</p>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={submit}
        className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Flat White"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Price (IRR)
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all tabular"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-3 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-3">
          Note: recipe items can be added from Django admin for now.
        </p>
      </form>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Coffee className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400">
                {p.recipe_items.length} items
              </span>
            </div>
            <p className="font-semibold text-stone-900">{p.name}</p>
            <p className="text-lg font-bold text-stone-700 mt-1 tabular">
              {Number(p.price).toLocaleString()}{' '}
              <span className="text-xs text-stone-400 font-medium">IRR</span>
            </p>

            {p.recipe_items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100 space-y-1.5">
                {p.recipe_items.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-stone-500">{r.ingredient_name}</span>
                    <span className="text-stone-700 font-medium tabular">
                      {Number(r.amount).toFixed(0)} {r.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}