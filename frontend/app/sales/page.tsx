'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ShoppingCart, Plus, Minus, Check, Receipt,
  Trash2, Loader2, Search, Printer, ChefHat, User, X, Truck, ShoppingBag, Store, UserPlus, Percent, Banknote
} from 'lucide-react';
import {
  getProducts, getCategories, createSale,
  Product, Category
} from '@/lib/api';
import { useToast } from '@/components/Toast';

// ─── Constants ─────────────────────────────
const TAX_RATE = 0.10;
const CAFE_NAME = 'کافه باقلوا علی‌حان';
const BRANCH_NAME = 'شعبه شریعتی';

export default function SalesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  
  // ─── New POS States ────────────────────────
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [customerName, setCustomerName] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [packagingFee, setPackagingFee] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptTab, setReceiptTab] = useState<'customer' | 'kitchen'>('customer');
  const [lastSaleData, setLastSaleData] = useState<any>(null);

  const toast = useToast();

  const loadData = async () => {
    try {
      const [c, p] = await Promise.all([getCategories(), getProducts()]);
      setCategories(c);
      setProducts(p.filter((x) => x.is_active));
    } catch (e: any) {
      toast.error(e.message || 'خطا در بارگذاری');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inc = (id: number) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = (id: number) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));

  // ─── Computed (New Logic) ──────────────────
  const { totalItems, subtotal, discountAmount, tax, grandTotal, cartItems } = useMemo(() => {
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

    // محاسبه تخفیف
    let calcDiscount = 0;
    if (discountType === 'percent') {
      calcDiscount = Math.round((price * discountValue) / 100);
    } else {
      calcDiscount = discountValue;
    }
    
    // جلوگیری از منفی شدن مبلغ
    calcDiscount = Math.min(calcDiscount, price);
    const afterDiscount = Math.max(0, price - calcDiscount);

    const calcTax = Math.round(afterDiscount * TAX_RATE);
    
    // هزینه‌های اضافه
    const totalFees = packagingFee + (orderType === 'delivery' ? deliveryFee : 0);
    const finalTotal = afterDiscount + calcTax + totalFees;

    return {
      totalItems: items,
      subtotal: price,
      discountAmount: calcDiscount,
      tax: calcTax,
      grandTotal: finalTotal,
      cartItems: list,
    };
  }, [cart, products, discountType, discountValue, packagingFee, deliveryFee, orderType]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory ? p.category === activeCategory : true;
    const matchesSearch = p.name.includes(search);
    return matchesCategory && matchesSearch;
  });

  // ─── Submit ────────────────────────────────
  const submit = async (mode: 'save' | 'print') => {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    try {
      for (const item of cartItems) {
        await createSale({ product_id: item.product.id, quantity: item.qty });
      }
      
      const saleSnapshot = {
        items: [...cartItems],
        subtotal,
        discountAmount,
        tax,
        packagingFee,
        deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
        total: grandTotal,
        orderType,
        customerName: customerName || 'مشتری',
        date: new Date().toLocaleString('fa-IR'),
      };
      
      setLastSaleData(saleSnapshot);
      setCart({});
      // ریست کردن فرم‌ها
      setCustomerName('');
      setDiscountValue(0);
      setPackagingFee(0);
      setDeliveryFee(0);
      setOrderType('dine_in');

      toast.success(`فروش ${totalItems} آیتم ثبت شد`);
      
      if (mode === 'print') {
        setReceiptTab('customer');
        setShowReceipt(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message || 'خطا در ثبت');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Print Receipt (Including all new data) ──
  const printReceipt = (type: 'customer' | 'kitchen') => {
    if (!lastSaleData) return;
    
    const printWindow = window.open('', '', 'width=450,height=700');
    if (!printWindow) return toast.error('مرورگر اجازه چاپ نمی‌دهد');
    
    const orderTypeLabels = { dine_in: 'سالن', takeaway: 'بیرون بر', delivery: 'پیک' };
    const items = lastSaleData.items;
    
    const itemsHTML = type === 'customer'
      ? items.map((item: any) => `
          <tr>
            <td class="qty">${item.qty}×</td>
            <td class="name">${item.product.name}</td>
            <td class="price">${(Number(item.product.price) * item.qty).toLocaleString('fa-IR')}</td>
          </tr>
        `).join('')
      : items.map((item: any) => `
          <tr>
            <td class="qty-kitchen">${item.qty}×</td>
            <td class="name-kitchen">${item.product.name}</td>
          </tr>
        `).join('');
    
    const totalsHTML = type === 'customer' ? `
      <div class="divider"></div>
      <div class="row">
        <span>جمع کل:</span>
        <span>${lastSaleData.subtotal.toLocaleString('fa-IR')}</span>
      </div>
      ${lastSaleData.discountAmount > 0 ? `
        <div class="row discount">
          <span>تخفیف:</span>
          <span>-${lastSaleData.discountAmount.toLocaleString('fa-IR')}</span>
        </div>
      ` : ''}
      <div class="row">
        <span>مالیات (۱۰٪):</span>
        <span>${lastSaleData.tax.toLocaleString('fa-IR')}</span>
      </div>
      ${lastSaleData.packagingFee > 0 ? `
        <div class="row">
          <span>هزینه بسته‌بندی:</span>
          <span>${lastSaleData.packagingFee.toLocaleString('fa-IR')}</span>
        </div>
      ` : ''}
      ${lastSaleData.deliveryFee > 0 ? `
        <div class="row">
          <span>هزینه پیک:</span>
          <span>${lastSaleData.deliveryFee.toLocaleString('fa-IR')}</span>
        </div>
      ` : ''}
      <div class="divider"></div>
      <div class="row grand-total">
        <span>مبلغ قابل پرداخت:</span>
        <span>${lastSaleData.total.toLocaleString('fa-IR')} تومان</span>
      </div>
    ` : '';
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>${type === 'customer' ? 'فیش مشتری' : 'فیش آشپزخانه'}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Tahoma', sans-serif; font-size: 13px; padding: 15px 20px; color: #000; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 12px; }
          .header h1 { font-size: 18px; font-weight: 800; margin-bottom: 3px; }
          .header .branch { font-size: 12px; color: #555; margin-bottom: 8px; }
          .header .order-info { font-size: 11px; font-weight: bold; background: #eee; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-bottom: 4px; }
          .header .type { display: inline-block; padding: 2px 10px; border: 1px solid #000; border-radius: 4px; font-size: 10px; font-weight: bold; margin-bottom: 6px; }
          .header .date { font-size: 10px; color: #777; }
          .divider { border-top: 1px dashed #999; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 6px 0; font-size: 12.5px; }
          td.qty { width: 30px; color: #555; }
          td.name { font-weight: 500; }
          td.price { width: 90px; text-align: left; }
          td.qty-kitchen { width: 40px; font-size: 16px; font-weight: 800; }
          td.name-kitchen { font-size: 15px; font-weight: 700; padding: 10px 0; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
          .discount { color: #d32f2f; }
          .grand-total { font-weight: 800; font-size: 15px; padding-top: 8px; }
          .footer { text-align: center; font-size: 11px; margin-top: 20px; padding-top: 12px; border-top: 1px dashed #999; color: #555; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${CAFE_NAME}</h1>
          <div class="branch">${BRANCH_NAME}</div>
          <div class="order-info">
            نوع سفارش: ${orderTypeLabels[lastSaleData.orderType]} | نام: ${lastSaleData.customerName}
          </div>
          <div class="date">${lastSaleData.date}</div>
        </div>
        <div class="divider"></div>
        <table>${itemsHTML}</table>
        ${totalsHTML}
        <div class="footer">
          <div>از حضور شما سپاسگزاریم</div>
          <div>${CAFE_NAME} - ${BRANCH_NAME}</div>
        </div>
        <script>window.onload = () => setTimeout(() => window.print(), 200);</script>
      </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32 gap-3 dark:text-stone-300"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /><p>در حال بارگذاری...</p></div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] fade-in-up" dir="rtl">
      
      {/* ═══ RIGHT: Products ═══ */}
      <div className="flex-1 flex flex-col min-h-0 bg-stone-50 dark:bg-stone-900/40 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div className="relative">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="text" placeholder="جستجوی محصول..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>
        </div>
        <div className="flex overflow-x-auto p-3 gap-2 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 scrollbar-hide">
          <button onClick={() => setActiveCategory(null)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === null ? 'bg-amber-500 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'}`}>همه</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === c.id ? 'bg-amber-500 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'}`}>{c.name}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 content-start">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(p => {
              const qty = cart[p.id] || 0;
              return (
                <button key={p.id} onClick={() => inc(p.id)}
                  className={`relative flex flex-col items-start p-3 rounded-2xl border transition-all duration-200 hover:-translate-y-1 text-right ${qty > 0 ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 shadow-lg' : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:shadow-md'}`}>
                  {qty > 0 && <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-md">{qty}</div>}
                  <span className="text-[10px] text-stone-400 mb-1">{p.category_name}</span>
                  <span className="font-bold text-stone-800 dark:text-stone-100 leading-tight mb-2">{p.name}</span>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-500 mt-auto">{Number(p.price).toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-stone-500">تومان</span></span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ LEFT: Cart & Details ═══ */}
      <aside className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden shrink-0">
        
        {/* Order Type Tabs */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-stone-100 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
          <button onClick={() => setOrderType('dine_in')} className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${orderType === 'dine_in' ? 'bg-white dark:bg-stone-900 text-amber-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}><Store className="w-4 h-4"/> سالن</button>
          <button onClick={() => setOrderType('takeaway')} className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${orderType === 'takeaway' ? 'bg-white dark:bg-stone-900 text-amber-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}><ShoppingBag className="w-4 h-4"/> بیرون بر</button>
          <button onClick={() => setOrderType('delivery')} className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${orderType === 'delivery' ? 'bg-white dark:bg-stone-900 text-amber-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}><Truck className="w-4 h-4"/> پیک</button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-3">
              <Receipt className="w-12 h-12 opacity-20" /><p>فاکتور خالی است</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-stone-800 dark:text-stone-100 truncate">{item.product.name}</p>
                    <p className="text-xs text-amber-600 font-medium mt-1">{(Number(item.product.price) * item.qty).toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-stone-900 rounded-lg p-1 border border-stone-200 dark:border-stone-700 shadow-sm">
                    <button onClick={() => dec(item.product.id)} className="w-7 h-7 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                    <button onClick={() => inc(item.product.id)} className="w-7 h-7 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors text-amber-600"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Form */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/30 space-y-3">
          
          <div className="relative">
            <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="text" placeholder="نام مشتری (اختیاری)" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pr-9 pl-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>

          <div className="flex gap-2">
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percent'|'fixed')} className="w-20 px-2 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs focus:outline-none">
              <option value="percent">درصد</option>
              <option value="fixed">تومان</option>
            </select>
            <input type="number" placeholder="تخفیف" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>

          <div className="flex gap-2">
            <input type="number" placeholder="هزینه بسته‌بندی" value={packagingFee || ''} onChange={(e) => setPackagingFee(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs focus:outline-none" />
            {orderType === 'delivery' && (
              <input type="number" placeholder="هزینه پیک" value={deliveryFee || ''} onChange={(e) => setDeliveryFee(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs focus:outline-none" />
            )}
          </div>

          <div className="border-t border-stone-200 dark:border-stone-800 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>جمع کل</span><span>{subtotal.toLocaleString('fa-IR')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>تخفیف</span><span>-{discountAmount.toLocaleString('fa-IR')}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>مالیات (۱۰٪)</span><span>{tax.toLocaleString('fa-IR')}</span>
            </div>
            {packagingFee > 0 && (
              <div className="flex justify-between text-stone-500 dark:text-stone-400">
                <span>بسته‌بندی</span><span>{packagingFee.toLocaleString('fa-IR')}</span>
              </div>
            )}
            {orderType === 'delivery' && deliveryFee > 0 && (
              <div className="flex justify-between text-stone-500 dark:text-stone-400">
                <span>پیک</span><span>{deliveryFee.toLocaleString('fa-IR')}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-stone-200 dark:border-stone-800 font-bold text-lg">
              <span className="text-stone-800 dark:text-stone-200">قابل پرداخت</span>
              <span className="text-amber-600 dark:text-amber-500">{grandTotal.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={() => submit('save')} disabled={submitting || cartItems.length === 0} className="py-3 rounded-xl bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-white dark:text-stone-900 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} ذخیره
            </button>
            <button onClick={() => submit('print')} disabled={submitting || cartItems.length === 0} className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} ذخیره و چاپ
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ RECEIPT MODAL ═══ */}
      {showReceipt && lastSaleData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="font-bold text-stone-800 dark:text-stone-100">فاکتور ثبت شد</h2>
              <button onClick={() => setShowReceipt(false)} className="w-8 h-8 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center"><X className="w-5 h-5 text-stone-500" /></button>
            </div>
            <div className="grid grid-cols-2 gap-1 p-2 bg-stone-100 dark:bg-stone-800/50">
              <button onClick={() => setReceiptTab('customer')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${receiptTab === 'customer' ? 'bg-white dark:bg-stone-900 text-amber-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}><User className="w-4 h-4"/> فیش مشتری</button>
              <button onClick={() => setReceiptTab('kitchen')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${receiptTab === 'kitchen' ? 'bg-white dark:bg-stone-900 text-amber-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}><ChefHat className="w-4 h-4"/> فیش آشپزخانه</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto bg-stone-50 dark:bg-stone-950/30">
              <div className="bg-white dark:bg-stone-900 rounded-lg p-4 shadow-sm text-stone-800 dark:text-stone-100" style={{ fontFamily: 'Tahoma, sans-serif' }}>
                <div className="text-center pb-3 border-b border-dashed border-stone-300 dark:border-stone-700">
                  <h3 className="font-black text-base mb-0.5">{CAFE_NAME}</h3>
                  <p className="text-[11px] text-stone-500">{BRANCH_NAME}</p>
                  <div className="text-[10px] bg-stone-100 dark:bg-stone-800 inline-block px-2 py-1 rounded mt-2">
                    نوع: {lastSaleData.orderType === 'dine_in' ? 'سالن' : lastSaleData.orderType === 'takeaway' ? 'بیرون بر' : 'پیک'} | نام: {lastSaleData.customerName}
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">{lastSaleData.date}</p>
                </div>
                <div className="py-3 space-y-1.5 border-b border-dashed border-stone-300 dark:border-stone-700">
                  {lastSaleData.items.map((item: any) => (
                    <div key={item.product.id} className="flex justify-between text-xs">
                      <span className="font-medium"><span className="text-stone-500 ml-1">{item.qty}×</span>{item.product.name}</span>
                      {receiptTab === 'customer' && <span className="font-semibold">{(Number(item.product.price) * item.qty).toLocaleString('fa-IR')}</span>}
                    </div>
                  ))}
                </div>
                {receiptTab === 'customer' && (
                  <div className="py-2 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-stone-500">جمع کل:</span><span>{lastSaleData.subtotal.toLocaleString('fa-IR')}</span></div>
                    {lastSaleData.discountAmount > 0 && <div className="flex justify-between text-red-500"><span>تخفیف:</span><span>-{lastSaleData.discountAmount.toLocaleString('fa-IR')}</span></div>}
                    <div className="flex justify-between"><span className="text-stone-500">مالیات (۱۰٪):</span><span>{lastSaleData.tax.toLocaleString('fa-IR')}</span></div>
                    {lastSaleData.packagingFee > 0 && <div className="flex justify-between"><span className="text-stone-500">بسته‌بندی:</span><span>{lastSaleData.packagingFee.toLocaleString('fa-IR')}</span></div>}
                    {lastSaleData.deliveryFee > 0 && <div className="flex justify-between"><span className="text-stone-500">پیک:</span><span>{lastSaleData.deliveryFee.toLocaleString('fa-IR')}</span></div>}
                    <div className="flex justify-between pt-2 border-t border-dashed border-stone-300 dark:border-stone-700 font-black text-sm"><span>قابل پرداخت:</span><span>{lastSaleData.total.toLocaleString('fa-IR')} تومان</span></div>
                  </div>
                )}
                <div className="text-center pt-3 border-t border-dashed border-stone-300 dark:border-stone-700">
                  <p className="text-[11px] font-bold mb-0.5">از حضور شما سپاسگزاریم</p>
                  <p className="text-[9px] text-stone-500">{CAFE_NAME} - {BRANCH_NAME}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex gap-2">
              <button onClick={() => printReceipt(receiptTab)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"><Printer className="w-4 h-4"/> چاپ این فیش</button>
              <button onClick={() => setShowReceipt(false)} className="px-5 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 font-bold text-sm transition-colors">بستن</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}