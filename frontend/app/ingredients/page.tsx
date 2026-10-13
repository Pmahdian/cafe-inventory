'use client';

import { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { getIngredients, Ingredient, api } from '@/lib/api';

const UNITS = [
  { value: 'ml', label: 'Milliliter' },
  { value: 'gr', label: 'Gram' },
  { value: 'count', label: 'Count' },
];

export default function IngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    unit: 'ml',
    initial_stock: '',
    min_stock: '',
  });

  const load = async () => {
    try {
      setItems(await getIngredients());
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
      await api.post('/ingredients/', {
        name: form.name,
        unit: form.unit,
        initial_stock: parseFloat(form.initial_stock) || 0,
        current_stock: parseFloat(form.initial_stock) || 0,
        min_stock: parseFloat(form.min_stock) || 0,
      });
      setForm({ name: '', unit: 'ml', initial_stock: '', min_stock: '' });
      setMessage({ type: 'success', text: 'Ingredient created' });
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
          <Boxes className="w-3.5 h-3.5" />
          Inventory
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">
          Ingredients
        </h1>
        <p className="text-sm text-stone-500 mt-2">
          Raw materials tracked in your inventory.
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Oat Milk"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Unit
            </label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Initial
            </label>
            <input
              type="number"
              value={form.initial_stock}
              onChange={(e) => setForm({ ...form, initial_stock: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all tabular"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Min
            </label>
            <input
              type="number"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all tabular"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 px-5 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Ingredient
        </button>
      </form>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i) => {
          const low = Number(i.current_stock) < Number(i.min_stock);
          return (
            <div
              key={i.id}
              className={`relative rounded-2xl border bg-white p-5 shadow-sm ${
                low ? 'border-red-200/60' : 'border-stone-200/60'
              }`}
            >
              {low && (
                <div className="absolute top-4 right-4">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
              )}
              <p className="font-semibold text-stone-900">{i.name}</p>
              <p className="text-xs text-stone-500 mt-0.5 uppercase tracking-wider">
                {i.unit}
              </p>
              <div className="mt-4 flex items-baseline gap-1.5 tabular">
                <span
                  className={`text-3xl font-bold ${
                    low ? 'text-red-600' : 'text-stone-900'
                  }`}
                >
                  {Number(i.current_stock).toFixed(0)}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-stone-400 uppercase tracking-wider">Initial</p>
                  <p className="font-semibold text-stone-700 tabular">
                    {Number(i.initial_stock).toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase tracking-wider">Min</p>
                  <p className="font-semibold text-stone-700 tabular">
                    {Number(i.min_stock).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}