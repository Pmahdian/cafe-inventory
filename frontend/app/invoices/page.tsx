'use client';

import { useEffect, useState } from 'react';
import { ReceiptText, Trash2, Edit, Loader2, X, AlertTriangle } from 'lucide-react';
import { getSales, api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/components/LanguageProvider';

export default function InvoicesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Modals
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editSale, setEditSale] = useState<any | null>(null);
  const [editQty, setEditQty] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();
  const { lang, t, formatDate } = useLanguage();

  const loadSales = async () => {
    try {
      const data = await getSales();
      // مرتب‌سازی بر اساس جدیدترین
      setSales(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSales(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      await api.delete(`/sales/${deleteId}/`);
      toast.success(lang === 'fa' ? 'فاکتور حذف و موجودی برگشت داده شد' : 'Invoice deleted and stock restored');
      setDeleteId(null);
      await loadSales();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSave = async () => {
    if (!editSale) return;
    setSubmitting(true);
    try {
      await api.patch(`/sales/${editSale.id}/`, { quantity: editQty });
      toast.success(lang === 'fa' ? 'فاکتور با موفقیت ویرایش شد' : 'Invoice updated successfully');
      setEditSale(null);
      await loadSales();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-6 fade-in max-w-6xl pb-10">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
          <ReceiptText className="w-4 h-4" /> {t('operations')}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">
          {t('invoice_list')}
        </h1>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/50">
              <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('date')}</th>
              <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('product')}</th>
              <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('qty')}</th>
              <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('total_price')}</th>
              <th className={`px-6 py-4 text-xs font-bold text-[var(--text-muted)] ${lang === 'fa' ? 'text-left' : 'text-right'}`}>{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                <td className="px-6 py-4 text-[var(--text-muted)]">{formatDate(sale.date)}</td>
                <td className="px-6 py-4 font-bold text-[var(--text)]">{sale.product_name}</td>
                <td className="px-6 py-4 font-bold text-[var(--text)]">{sale.quantity}</td>
                <td className="px-6 py-4 font-bold text-amber-600 dark:text-amber-500 tabular">
                  {sale.total_price.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')} <span className="text-[10px]">{lang === 'fa' ? 'تومان' : 'Toman'}</span>
                </td>
                <td className={`px-6 py-4 ${lang === 'fa' ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => { setEditSale(sale); setEditQty(sale.quantity); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(sale.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-[var(--text-muted)]">{t('no_data')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-2">{t('delete')}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">{t('confirm_delete')}</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl bg-[var(--surface-2)] font-bold text-sm">{t('cancel')}</button>
              <button onClick={handleDelete} disabled={submitting} className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold text-sm flex justify-center items-center">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text)]">{t('edit')}</h3>
              <button onClick={() => setEditSale(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">{t('product')}</label>
                <input disabled value={editSale.product_name} className="w-full px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] opacity-70" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">{t('qty')}</label>
                <input type="number" min="1" value={editQty} onChange={e => setEditQty(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)]" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditSale(null)} className="flex-1 py-2 rounded-xl bg-[var(--surface-2)] font-bold text-sm">{t('cancel')}</button>
              <button onClick={handleEditSave} disabled={submitting || editQty < 1} className="flex-1 py-2 rounded-xl bg-amber-500 text-white font-bold text-sm flex justify-center items-center">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}