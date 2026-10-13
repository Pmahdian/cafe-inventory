'use client';

import { useEffect, useState } from 'react';
import {
  Boxes,
  CupSoda,
  AlertTriangle,
  Activity,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getDailyReport,
  getIngredients,
  getProducts,
  getSales,
  DailyReport,
  Ingredient,
  Product,
  Sale,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { SkeletonCard, SkeletonTable } from '@/components/Skeleton';

// ═══════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════

export default function DashboardPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      getDailyReport(),
      getIngredients(),
      getProducts(),
      getSales(),
    ])
      .then(([r, i, p, s]) => {
        setReport(r);
        setIngredients(i);
        setProducts(p);
        setSales(s);
      })
      .catch((e) => toast.error(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Loading state ───────────────────────
  if (loading) {
    return (
      <div className="space-y-10">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-10 w-56" />
          <div className="skeleton h-3 w-40" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={6} />
      </div>
    );
  }

  // ─── Derived data ────────────────────────
  const lowStock = report?.items.filter((i) => i.below_min) || [];
  const activeToday =
    report?.items.filter((i) => i.used > 0 || i.entered > 0).length || 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const chartData = products
    .map((p) => {
      const total = sales
        .filter((s) => s.product === p.id)
        .filter((s) => new Date(s.date) >= sevenDaysAgo)
        .reduce((sum, s) => sum + s.quantity, 0);
      return { name: p.name, quantity: total };
    })
    .filter((x) => x.quantity > 0)
    .slice(0, 6);

  // ─── Render ──────────────────────────────
  return (
    <div className="space-y-10 fade-in-up">
      {/* Page Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] mb-2"
            style={{ color: 'var(--primary)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Overview
          </div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Dashboard
          </h1>
          <p
            className="text-sm mt-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Daily snapshot for{' '}
            <span
              className="font-medium tabular"
              style={{ color: 'var(--text)' }}
            >
              {report?.date}
            </span>
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: 'var(--success-soft)',
            border: '1px solid var(--success-border)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'var(--success)' }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--success)' }}
          >
            System Online
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ingredients"
          value={ingredients.length}
          icon={Boxes}
          tone="amber"
          hint="Tracked items"
        />
        <StatCard
          label="Products"
          value={products.length}
          icon={CupSoda}
          tone="violet"
          hint="On menu"
        />
        <StatCard
          label="Low Stock"
          value={lowStock.length}
          icon={AlertTriangle}
          tone={lowStock.length > 0 ? 'red' : 'emerald'}
          hint={lowStock.length > 0 ? 'Needs restock' : 'All good'}
        />
        <StatCard
          label="Active Today"
          value={activeToday}
          icon={Activity}
          tone="blue"
          hint="Moved items"
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            icon={TrendingUp}
            title="Top Products"
            subtitle="Units sold in the last 7 days"
          />
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-md)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: 13,
                    }}
                    cursor={{ fill: 'var(--primary-soft)' }}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="var(--primary)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            icon={AlertTriangle}
            title="Low Stock Alerts"
            subtitle={`${lowStock.length} item${
              lowStock.length > 1 ? 's' : ''
            } below minimum threshold`}
            tone="red"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStock.map((item) => (
              <div
                key={item.ingredient_id}
                className="group relative rounded-2xl p-5 overflow-hidden transition-all duration-200"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--danger-border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-1"
                  style={{
                    background:
                      'linear-gradient(to bottom, var(--danger), color-mix(in srgb, var(--danger) 70%, black))',
                  }}
                />
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'var(--danger)' }}
                    >
                      Critical
                    </p>
                    <p
                      className="font-semibold text-lg leading-tight"
                      style={{ color: 'var(--text)' }}
                    >
                      {item.name}
                    </p>
                  </div>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--danger-soft)' }}
                  >
                    <AlertTriangle
                      className="w-4 h-4"
                      style={{ color: 'var(--danger)' }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5 tabular">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: 'var(--danger)' }}
                  >
                    {item.remaining.toFixed(0)}
                  </span>
                  <span
                    className="text-sm font-medium uppercase"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    {item.unit}
                  </span>
                </div>
                <p
                  className="text-xs mt-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Reorder soon to avoid stockouts
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Movement Table */}
      <section className="space-y-4">
        <SectionHeader
          icon={TrendingUp}
          title="Today's Movement"
          subtitle="Inventory flow across all tracked items"
        />
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <th
                    className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Item
                  </th>
                  <th
                    className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowDownToLine className="w-3 h-3" />
                      Received
                    </span>
                  </th>
                  <th
                    className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowUpFromLine className="w-3 h-3" />
                      Used
                    </span>
                  </th>
                  <th
                    className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Remaining
                  </th>
                </tr>
              </thead>
              <tbody>
                {report?.items.map((item) => (
                  <tr
                    key={item.ingredient_id}
                    className="transition-colors"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'var(--surface-2)' }}
                        >
                          <Package
                            className="w-4 h-4"
                            style={{ color: 'var(--text-muted)' }}
                          />
                        </div>
                        <span
                          className="font-medium"
                          style={{ color: 'var(--text)' }}
                        >
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right tabular">
                      {item.entered > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{
                            background: 'var(--success-soft)',
                            color: 'var(--success)',
                          }}
                        >
                          +{item.entered.toFixed(0)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right tabular">
                      {item.used > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{
                            background: 'var(--danger-soft)',
                            color: 'var(--danger)',
                          }}
                        >
                          −{item.used.toFixed(0)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right tabular">
                      <span
                        className="font-semibold"
                        style={{ color: 'var(--text)' }}
                      >
                        {item.remaining.toFixed(0)}
                      </span>
                      <span
                        className="text-xs uppercase ml-1.5"
                        style={{ color: 'var(--text-subtle)' }}
                      >
                        {item.unit}
                      </span>
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

// ═══════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════

const toneMap = {
  amber: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  violet: { bg: '#f3f0ff', fg: '#6d28d9' },
  red: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  emerald: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  blue: { bg: 'var(--info-soft)', fg: 'var(--info)' },
} as const;

type Tone = keyof typeof toneMap;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: Tone;
  hint?: string;
}) {
  const t = toneMap[tone];
  return (
    <div
      className="group relative rounded-2xl p-5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ background: t.bg }}
        >
          <span style={{ color: t.fg }}>
            <Icon className="w-4 h-4" strokeWidth={2.5} />
          </span>
        </div>
      </div>
      <div
        className="text-[32px] font-bold tabular leading-none tracking-tight"
        style={{ color: tone === 'red' ? 'var(--danger)' : 'var(--text)' }}
      >
        {value}
      </div>
      {hint && (
        <p
          className="text-[11px] mt-2.5"
          style={{ color: 'var(--text-subtle)' }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  tone = 'stone',
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
  tone?: 'red' | 'stone';
}) {
  const accentColor = tone === 'red' ? 'var(--danger)' : 'var(--primary)';
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--surface-2)' }}
      >
        <span style={{ color: accentColor }}>
          <Icon className="w-4 h-4" strokeWidth={2.5} />
        </span>
      </div>
      <div>
        <h2
          className="text-lg font-bold leading-tight"
          style={{ color: 'var(--text)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}