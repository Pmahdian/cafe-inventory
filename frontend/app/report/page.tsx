'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Loader2,
  Calendar,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
} from 'lucide-react';
import { getDailyReport, DailyReport } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function ReportPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    getDailyReport(date)
      .then(setReport)
      .catch((e) => toast.error(e.message || 'Failed to load report'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const lowStock = report?.items.filter((i) => i.below_min) || [];
  const moved = report?.items.filter((i) => i.used > 0 || i.entered > 0) || [];

  return (
    <div className="space-y-8 fade-in-up">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] mb-2"
            style={{ color: 'var(--primary)' }}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Daily Report
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Opening · received · used · closing, for any date.
          </p>
        </div>
        <div className="relative">
          <Calendar
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-subtle)' }}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all tabular"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 gap-3">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: 'var(--primary)' }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading report…
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              icon={Package}
              label="Items Tracked"
              value={report?.items.length || 0}
              tone="neutral"
            />
            <SummaryCard
              icon={ArrowUpFromLine}
              label="Items Moved"
              value={moved.length}
              tone="info"
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Low Stock"
              value={lowStock.length}
              tone={lowStock.length > 0 ? 'danger' : 'success'}
            />
          </div>

          {/* Table */}
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
                    <Th align="left">Item</Th>
                    <Th align="right">Opening</Th>
                    <Th align="right">
                      <span className="inline-flex items-center gap-1.5">
                        <ArrowDownToLine className="w-3 h-3" /> In
                      </span>
                    </Th>
                    <Th align="right">
                      <span className="inline-flex items-center gap-1.5">
                        <ArrowUpFromLine className="w-3 h-3" /> Used
                      </span>
                    </Th>
                    <Th align="right">Closing</Th>
                  </tr>
                </thead>
                <tbody>
                  {report?.items.map((item) => (
                    <tr
                      key={item.ingredient_id}
                      style={{
                        borderTop: '1px solid var(--border)',
                        background: item.below_min
                          ? 'color-mix(in srgb, var(--danger-soft) 60%, transparent)'
                          : 'transparent',
                      }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: item.below_min
                                ? 'var(--danger-soft)'
                                : 'var(--surface-2)',
                            }}
                          >
                            <Package
                              className="w-4 h-4"
                              style={{
                                color: item.below_min
                                  ? 'var(--danger)'
                                  : 'var(--text-muted)',
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-medium"
                              style={{ color: 'var(--text)' }}
                            >
                              {item.name}
                            </span>
                            {item.below_min && (
                              <span
                                className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                                style={{
                                  background: 'var(--danger)',
                                  color: 'white',
                                }}
                              >
                                Low
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-5 py-4 text-right tabular"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {item.opening.toFixed(0)}
                      </td>
                      <td className="px-5 py-4 text-right tabular">
                        {item.entered > 0 ? (
                          <span
                            className="font-medium"
                            style={{ color: 'var(--success)' }}
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
                            className="font-medium"
                            style={{ color: 'var(--danger)' }}
                          >
                            −{item.used.toFixed(0)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right tabular">
                        <span
                          className="font-bold"
                          style={{
                            color: item.below_min
                              ? 'var(--danger)'
                              : 'var(--text)',
                          }}
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
        </>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`px-5 py-3.5 text-${align} text-[11px] font-semibold uppercase tracking-wider`}
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </th>
  );
}

const summaryTone = {
  neutral: { bg: 'var(--surface-2)', fg: 'var(--text-muted)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
  danger: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
} as const;

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  tone: keyof typeof summaryTone;
}) {
  const t = summaryTone[tone];
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: t.bg }}
        >
          <span style={{ color: t.fg }}>
            <Icon className="w-4 h-4" strokeWidth={2.5} />
          </span>
        </div>
      </div>
      <p
        className="text-[32px] font-bold tabular leading-none tracking-tight"
        style={{
          color: tone === 'danger' ? 'var(--danger)' : 'var(--text)',
        }}
      >
        {value}
      </p>
    </div>
  );
}