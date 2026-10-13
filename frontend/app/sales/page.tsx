'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Receipt,
  Coffee,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  getProducts,
  getSales,
  createSale,
  Product,
  Sale,
} from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const toast = useToast();

  const loadData = async () => {
    try {
      const [p, s] = await Promise.all([getProducts(), getSales()]);
      setProducts(p.filter((x) => x.is_active));
      setRecentSales(s.slice(0, 5));
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

  const inc = (id: number) =>
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = (id: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));
  const clearItem = (id: number) =>
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });

  const { totalItems, totalPrice, cartItems } = useMemo(() => {
    let items = 0;
    let price = 0;
    const list: { product: Product; qty: number }[] = [];
    for (const p of products) {
      const qty = cart[p.id] || 0;
      if (qty > 0) {
        items += qty;
        price += Number(p.price) * qty;
        list.push({ product: p, qty });
      }
    }
    return { totalItems: items, totalPrice: price, cartItems: list };
  }, [cart, products]);

  const submit = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    try {
      for (const item of cartItems) {
        await createSale({
          product_id: item.product.id,
          quantity: item.qty,
        });
      }
      setCart({});
      toast.success(
        `Recorded ${totalItems} item${totalItems > 1 ? 's' : ''}`
      );
      await loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <Loader2
          className="w-5 h-5 animate-spin"
          style={{ color: 'var(--primary)' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Loading products…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in-up">
      {/* Header */}
      <div>
        <div
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] mb-2"
          style={{ color: 'var(--primary)' }}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Point of Sale
        </div>
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          Record Sales
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Tap products to build today&apos;s order.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Products Grid */}
        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'var(--text-muted)' }}
          >
            Menu · {products.length} products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((p) => {
              const qty = cart[p.id] || 0;
              const active = qty > 0;
              return (
                <button
                  key={p.id}
                  onClick={() => inc(p.id)}
                  className="group relative rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    background: 'var(--surface)',
                    border: active
                      ? '2px solid var(--primary)'
                      : '1px solid var(--border)',
                    boxShadow: active
                      ? 'var(--shadow-glow)'
                      : 'var(--shadow-sm)',
                  }}
                >
                  {active && (
                    <div
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg"
                      style={{
                        background:
                          'linear-gradient(135deg, var(--primary) 0%, var(--primary-bright) 100%)',
                      }}
                    >
                      {qty}
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                      style={{
                        background: active
                          ? 'var(--primary-soft)'
                          : 'var(--surface-2)',
                      }}
                    >
                      <Coffee
                        className="w-4 h-4"
                        style={{
                          color: active
                            ? 'var(--primary)'
                            : 'var(--text-muted)',
                        }}
                      />
                    </div>
                  </div>
                  <p
                    className="font-semibold leading-tight"
                    style={{ color: 'var(--text)' }}
                  >
                    {p.name}
                  </p>
                  <p
                    className="text-xs mt-1 tabular"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {Number(p.price).toLocaleString()}{' '}
                    <span style={{ color: 'var(--text-subtle)' }}>IRR</span>
                  </p>

                  {p.recipe_items.length > 0 && (
                    <div
                      className="mt-3 pt-3 space-y-1"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      {p.recipe_items.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between text-[10px]"
                          style={{ color: 'var(--text-subtle)' }}
                        >
                          <span>{r.ingredient_name}</span>
                          <span className="tabular">
                            {Number(r.amount).toFixed(0)} {r.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <Receipt
                  className="w-4 h-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <span
                  className="font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  Order
                </span>
              </div>
              {cartItems.length > 0 && (
                <button
                  onClick={() => setCart({})}
                  className="text-xs flex items-center gap-1 transition-colors"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <ShoppingCart
                    className="w-8 h-8 mx-auto mb-3"
                    style={{ color: 'var(--text-subtle)' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Tap a product to add
                  </p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={item.product.id}
                    className="px-4 py-3 flex items-center gap-3"
                    style={{
                      borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium text-sm truncate"
                        style={{ color: 'var(--text)' }}
                      >
                        {item.product.name}
                      </p>
                      <p
                        className="text-xs tabular mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {(
                          Number(item.product.price) * item.qty
                        ).toLocaleString()}{' '}
                        IRR
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => dec(item.product.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: 'var(--surface-2)' }}
                      >
                        <Minus
                          className="w-3.5 h-3.5"
                          style={{ color: 'var(--text)' }}
                        />
                      </button>
                      <span
                        className="w-7 text-center text-sm font-semibold tabular"
                        style={{ color: 'var(--text)' }}
                      >
                        {item.qty}
                      </span>
                      <button
                        onClick={() => inc(item.product.id)}
                        className="w-7 h-7 rounded-lg text-white flex items-center justify-center"
                        style={{ background: 'var(--text)' }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div
                className="px-5 py-4 space-y-3"
                style={{
                  borderTop: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                <div
                  className="flex items-center justify-between text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>Items</span>
                  <span className="tabular">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--text)' }}
                  >
                    Total
                  </span>
                  <span
                    className="text-xl font-bold tabular"
                    style={{ color: 'var(--text)' }}
                  >
                    {totalPrice.toLocaleString()}{' '}
                    <span
                      className="text-xs"
                      style={{ color: 'var(--text-subtle)' }}
                    >
                      IRR
                    </span>
                  </span>
                </div>
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full mt-2 px-4 py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01]"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--primary) 0%, var(--primary-bright) 100%)',
                    boxShadow: 'var(--shadow-glow)',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm Sale
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {recentSales.length > 0 && (
            <div
              className="mt-4 rounded-2xl p-4"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-muted)' }}
              >
                Recent
              </p>
              <div className="space-y-2">
                {recentSales.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span
                      className="truncate"
                      style={{ color: 'var(--text)' }}
                    >
                      {s.quantity}× {s.product_name}
                    </span>
                    <span
                      className="tabular text-xs shrink-0 ml-2"
                      style={{ color: 'var(--text-subtle)' }}
                    >
                      {new Date(s.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}