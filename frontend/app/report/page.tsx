'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3, Loader2, Calendar, AlertTriangle,
  ArrowDownToLine, ArrowUpFromLine, Package,
  Lock, CheckCircle2, X
} from 'lucide-react';
import { getDailyReport, DailyReport, api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/components/LanguageProvider';

export default function ReportPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [systemTotal, setSystemTotal] = useState(0);
  const [actualCash, setActualCash] = useState<string>('');
  const [isSubmittingShift, setIsSubmittingShift] = useState(false);
  const [shiftSuccess, setShiftSuccess] = useState<{difference: number} | null>(null);

  const toast = useToast();
  const { lang, t, formatDate } = useLanguage();

  useEffect(() => {
    setLoading(true);
    getDailyReport(date)
      .then(setReport)
      .catch((e) => toast.error(e.message || 'Failed to load report'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const openShiftModal = async () => {
    try {
      const res = await api.get('/shift/');
      setSystemTotal(res.data.system_total);
      setIsShiftModalOpen(true);
    } catch (e: any) {
      toast.error('خطا در دریافت اطلاعات صندوق');
    }
  };

  const handleCloseShift = async () => {
    setIsSubmittingShift(true);
    try {
      const res = await api.post('/shift/', { actual_cash: Number(actualCash) || 0 });
      setShiftSuccess({ difference: res.data.difference });
      toast.success(t('shift_closed'));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmittingShift(false);
    }
  };

  const lowStock = report?.items.filter((i) => i.below_min) || [];
  const moved = report?.items.filter((i) => i.used > 0 || i.entered > 0) || [];

  return (
    <div className="space-y-6 fade-in max-w-6xl pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
            <BarChart3 className="w-4 h-4" />
            {t('analytics')}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">
            {t('daily_report')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('report_desc')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pr-10 pl-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] tabular"
            />
          </div>

          <button
            onClick={openShiftModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all"
          >
            <Lock className="w-4 h-4" />
            {t('close_shift')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm text-[var(--text-muted)]">{t('loading')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard icon={Package} label={t('total_items')} value={report?.items.length || 0} tone="stone" />
            <SummaryCard icon={ArrowUpFromLine} label={t('moved_items_report')} value={moved.length} tone="blue" />
            <SummaryCard icon={AlertTriangle} label={t('low_stock')} value={lowStock.length} tone={lowStock.length > 0 ? 'red' : 'emerald'} />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/50">
                    <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('item')}</th>
                    <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('opening') || 'Opening'}</th>
                    <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>
                      <span className="flex items-center gap-1.5"><ArrowDownToLine className="w-3 h-3" /> {t('received')}</span>
                    </th>
                    <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>
                      <span className="flex items-center gap-1.5"><ArrowUpFromLine className="w-3 h-3" /> {t('used')}</span>
                    </th>
                    <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('remaining')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {report?.items.map((item) => (
                    <tr key={item.ingredient_id} className={`transition-colors hover:bg-[var(--surface-2)]/50 ${item.below_min ? 'bg-red-50/50 dark:bg-red-500/5' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.below_min ? 'bg-red-100 dark:bg-red-500/20' : 'bg-[var(--surface-2)]'}`}>
                            <Package className={`w-4 h-4 ${item.below_min ? 'text-red-600 dark:text-red-400' : 'text-[var(--text-muted)]'}`} />
                          </div>
                          <span className="font-semibold text-[var(--text)]">{item.name}</span>
                          {item.below_min && <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-md">LOW</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 tabular text-[var(--text-muted)]">{item.opening.toFixed(0)}</td>
                      <td className="px-6 py-4 tabular">
                        {item.entered > 0 ? <span className="font-bold text-emerald-600 dark:text-emerald-400">+{item.entered.toFixed(0)}</span> : <span className="text-[var(--text-subtle)]">—</span>}
                      </td>
                      <td className="px-6 py-4 tabular">
                        {item.used > 0 ? <span className="font-bold text-red-600 dark:text-red-400">−{item.used.toFixed(0)}</span> : <span className="text-[var(--text-subtle)]">—</span>}
                      </td>
                      <td className="px-6 py-4 tabular">
                        <span className={`font-bold ${item.below_min ? 'text-red-600' : 'text-[var(--text)]'}`}>{item.remaining.toFixed(0)}</span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase ml-1">{item.unit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══ CLOSE SHIFT MODAL ═══ */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-2)]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text)]">{t('close_shift')}</h2>
              </div>
              <button onClick={() => { setIsShiftModalOpen(false); setShiftSuccess(null); setActualCash(''); }} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!shiftSuccess ? (
                <>
                  <div className="text-center p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)] mb-1">{t('system_total_sales')}</p>
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-500 tabular">
                      {systemTotal.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')} <span className="text-sm font-normal">{lang === 'fa' ? 'تومان' : 'Toman'}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--text)] mb-2">{t('actual_cash')}</label>
                    <input
                      type="number"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-lg font-bold tabular focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  <button
                    onClick={handleCloseShift}
                    disabled={isSubmittingShift || !actualCash}
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingShift ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                    {t('confirm_close')}
                  </button>
                </>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text)]">{t('shift_closed')}</h3>
                  
                  <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] inline-block">
                    <p className="text-xs text-[var(--text-muted)] mb-1">{t('difference')}</p>
                    <p className={`text-2xl font-black tabular ${shiftSuccess.difference === 0 ? 'text-emerald-500' : shiftSuccess.difference < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                      {shiftSuccess.difference > 0 ? '+' : ''}{shiftSuccess.difference.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] px-6">
                    {shiftSuccess.difference === 0 ? t('balance_ok') : t('balance_diff')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: any) {
  const toneStyles: any = {
    stone: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="rounded-2xl p-5 border border-[var(--border)] bg-[var(--surface)] shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-all">
      <div>
        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-3xl font-black tabular ${tone === 'red' ? 'text-red-500' : 'text-[var(--text)]'}`}>{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${toneStyles[tone]} group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" strokeWidth={2.5} />
      </div>
    </div>
  );
}