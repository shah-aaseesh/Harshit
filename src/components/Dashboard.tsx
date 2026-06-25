import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, TrendingDown, Layers, AlertCircle, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, Users, PlusCircle, CreditCard, 
  Receipt, DollarSign, HelpCircle, Eye, RefreshCw, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, BarChart, Bar, Cell 
} from 'recharts';
import { formatBSDate, getTodayBS, getFiscalYear, FISCAL_YEAR_OPTIONS } from '../utils/nepaliCalendar';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  openQuickBill: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, openQuickBill }) => {
  const { 
    products, customers, suppliers, expenses, invoices, purchases, 
    businessConfig, notifications, resetToDefault, currentUserRole
  } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('All');

  // Calculating basic metrics on the fly
  const todayStr = new Date().toISOString().split('T')[0];
  const lastWeekTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const lastMonthTime = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const currentFilterTime = () => {
    if (dateFilter === 'today') return new Date(todayStr).getTime();
    if (dateFilter === 'week') return lastWeekTime;
    return lastMonthTime; // month default
  };

  const matchesFY = (bsDate: string) => {
    if (fiscalYearFilter === 'All') return true;
    return getFiscalYear(bsDate) === fiscalYearFilter;
  };

  const getFilterLabel = () => {
    if (fiscalYearFilter !== 'All') {
      if (dateFilter === 'all') return `FY ${fiscalYearFilter}`;
      return `${dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'Weekly' : 'Monthly'} (${fiscalYearFilter})`;
    }
    return dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'Weekly' : 'Monthly';
  };

  // 1. Calculations: Total Sales
  const filteredInvoices = invoices.filter(inv => {
    if (!matchesFY(inv.bsDate)) return false;
    if (dateFilter === 'all') return true;
    
    const invTime = new Date(inv.date).getTime();
    if (dateFilter === 'today') return inv.date === todayStr;
    return invTime >= currentFilterTime();
  });

  const totalSales = filteredInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const paidSales = filteredInvoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const dueSales = filteredInvoices.reduce((acc, inv) => acc + inv.dueAmount, 0);

  // 2. Calculations: Total Purchases
  const filteredPurchases = purchases.filter(p => {
    if (!matchesFY(p.bsDate)) return false;
    if (dateFilter === 'all') return true;
    
    const pTime = new Date(p.date).getTime();
    if (dateFilter === 'today') return p.date === todayStr;
    return pTime >= currentFilterTime();
  });
  const totalPurchasesCost = filteredPurchases.reduce((acc, p) => acc + p.grandTotal, 0);

  // 3. Calculations: Total Expenses
  const filteredExpenses = expenses.filter(exp => {
    if (!matchesFY(exp.bsDate)) return false;
    if (dateFilter === 'all') return true;
    
    const expTime = new Date(exp.date).getTime();
    if (dateFilter === 'today') return exp.date === todayStr;
    return expTime >= currentFilterTime();
  });
  const totalExpensesAmt = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);


  // 4. Calculations: Dues / Receivables & Payables
  const totalOutstandingReceivables = customers.reduce((acc, c) => acc + c.outstandingDue, 0);
  const totalOutstandingPayables = suppliers.reduce((acc, s) => acc + s.outstandingDue, 0);

  // 5. Total Inventory Valuation
  const totalInventoryValuation = products.reduce((acc, p) => acc + (p.stockQty * p.purchasePrice), 0);

  // Low stock products count
  const lowStockCount = products.filter(p => p.stockQty <= p.minStockAlert).length;

  // Modern Chart representation (7 Days trend mock-up or real entries mapped)
  // Let's build real chronological charts from invoices logged!
  const getChartData = () => {
    if (fiscalYearFilter !== 'All') {
      const orderedNepMonths = [
        { num: 4, name: 'Shrawan' },
        { num: 5, name: 'Bhadra' },
        { num: 6, name: 'Ashwin' },
        { num: 7, name: 'Kartik' },
        { num: 8, name: 'Mangsir' },
        { num: 9, name: 'Poush' },
        { num: 10, name: 'Magh' },
        { num: 11, name: 'Falgun' },
        { num: 12, name: 'Chaitra' },
        { num: 1, name: 'Baisakh' },
        { num: 2, name: 'Jestha' },
        { num: 3, name: 'Ashadh' }
      ];

      const monthsData = orderedNepMonths.map(m => ({
        dateLabel: m.name,
        Sales: 0,
        Expenses: 0,
        Purchases: 0
      }));

      invoices.forEach(inv => {
        if (getFiscalYear(inv.bsDate) === fiscalYearFilter) {
          const mNum = parseInt(inv.bsDate.split('-')[1]);
          const targetIndex = orderedNepMonths.findIndex(m => m.num === mNum);
          if (targetIndex !== -1) {
            monthsData[targetIndex].Sales += inv.grandTotal;
          }
        }
      });

      expenses.forEach(exp => {
        if (getFiscalYear(exp.bsDate) === fiscalYearFilter) {
          const mNum = parseInt(exp.bsDate.split('-')[1]);
          const targetIndex = orderedNepMonths.findIndex(m => m.num === mNum);
          if (targetIndex !== -1) {
            monthsData[targetIndex].Expenses += exp.amount;
          }
        }
      });

      purchases.forEach(p => {
        if (getFiscalYear(p.bsDate) === fiscalYearFilter) {
          const mNum = parseInt(p.bsDate.split('-')[1]);
          const targetIndex = orderedNepMonths.findIndex(m => m.num === mNum);
          if (targetIndex !== -1) {
            monthsData[targetIndex].Purchases += p.grandTotal;
          }
        }
      });

      return monthsData;
    }

    const days: { [key: string]: { dateLabel: string, Sales: number, Expenses: number, Purchases: number } } = {};
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Pre-populate last 7 days so chart is never blank
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * oneDay);
      const key = d.toISOString().split('T')[0];
      const bsString = formatBSDate(formatBSDate(key)).split(',')[0]; // e.g. "Jestha 5"
      days[key] = {
        dateLabel: bsString,
        Sales: 0,
        Expenses: 0,
        Purchases: 0
      };
    }

    // Populate actuals
    invoices.forEach(inv => {
      if (days[inv.date]) {
        days[inv.date].Sales += inv.grandTotal;
      }
    });

    expenses.forEach(exp => {
      if (days[exp.date]) {
        days[exp.date].Expenses += exp.amount;
      }
    });

    purchases.forEach(p => {
      if (days[p.date]) {
        days[p.date].Purchases += p.grandTotal;
      }
    });

    return Object.values(days);
  };

  const chartData = getChartData();

  // Top Selling Products calculations
  const productSalesMap: { [key: string]: { name: string, qty: number, total: number } } = {};
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, qty: 0, total: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].total += item.subtotal;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4);

  // Expense distribution by categories for a compact bar/pie chart view
  const expenseCatDistribution = expenses.reduce((acc: { category: string, value: number }[], item) => {
    const index = acc.findIndex(c => c.category === item.category);
    if (index !== -1) {
      acc[index].value += item.amount;
    } else {
      acc.push({ category: item.category, value: item.amount });
    }
    return acc;
  }, []);

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="dashboard-module-container">
      {/* Top Welcome Title & Role Indicators */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5" id="welcome-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-950 font-display" id="dashboard-main-title">
            नमस्ते, {currentUserRole === 'Owner' ? 'Owner Lounge' : currentUserRole === 'Manager' ? 'Manager Desk' : 'Cashier Portal'}
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-medium" id="dashboard-sub-slug">
            Welcome to {businessConfig.name} • Today is <span className="font-bold text-gray-700">{formatBSDate(getTodayBS())}</span>
          </p>
        </div>

        {/* Action Toggle controls */}
        <div className="flex flex-wrap items-center gap-3" id="dashboard-quick-actions-bar">
          {/* Fiscal Year Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-150 rounded-xl px-2.5 py-1.5 text-xs" id="dashboard-fy-wrapper">
            <span className="text-gray-400 font-bold select-none">Fiscal Year:</span>
            <select
              id="select-dashboard-fy"
              value={fiscalYearFilter}
              onChange={(e) => {
                const val = e.target.value;
                setFiscalYearFilter(val);
                if (val !== 'All') {
                  setDateFilter('all');
                } else {
                  setDateFilter('month');
                }
              }}
              className="bg-transparent font-extrabold text-gray-800 outline-none cursor-pointer"
            >
              {FISCAL_YEAR_OPTIONS.map(fy => (
                <option key={fy} value={fy}>{fy === 'All' ? 'All Fiscal Years' : `FY ${fy}`}</option>
              ))}
            </select>
          </div>

          <div className="inline-flex rounded-xl border border-gray-150 bg-gray-50 p-1 text-xs" id="date-range-segment">
            {(fiscalYearFilter === 'All' 
              ? (['today', 'week', 'month'] as const) 
              : (['today', 'week', 'month', 'all'] as const)
            ).map((filter) => (
              <button
                key={filter}
                id={`btn-filter-${filter}`}
                onClick={() => setDateFilter(filter)}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all duration-150 ${
                  dateFilter === filter 
                    ? 'bg-white text-gray-900 shadow-xs border border-gray-100' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {filter === 'all' ? 'Full FY' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <button
            id="quick-billing-action-btn"
            onClick={openQuickBill}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer font-display"
          >
            <PlusCircle className="h-4 w-4" />
            Quick Bill (F2)
          </button>
        </div>
      </div>

      {/* Notifications Sub-banner alerts */}
      {notifications.filter(n => !n.isRead).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="live-issues-banner-grid">
          {notifications.filter(n => !n.isRead).slice(0, 2).map((notif) => (
            <div 
              key={notif.id} 
              id={`banner-notif-${notif.id}`}
              className={`flex items-start justify-between p-3.5 rounded-xl border text-xs leading-relaxed ${
                notif.type === 'danger' 
                  ? 'bg-rose-50 border-rose-100/70 text-rose-800' 
                  : 'bg-amber-50 border-amber-100/70 text-amber-800'
              }`}
            >
              <div className="flex gap-2.5">
                <AlertCircle className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${notif.type === 'danger' ? 'text-rose-600' : 'text-amber-600'}`} />
                <div>
                  <span className="font-semibold block mb-0.5">{notif.title}</span>
                  <span className="text-gray-600">{notif.message}</span>
                </div>
              </div>
              <span className="text-gray-400 font-mono text-[10px] whitespace-nowrap pt-0.5 ml-2">
                {notif.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Core KPI metrics grid with premium SaaS visual card designs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        {/* KPI Card 1: Today/Weekly Sales */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden custom-card-shadow" id="kpi-card-sales">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-display">
              {getFilterLabel()} Sales
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              Rs. {totalSales.toLocaleString()}
            </h3>
            <p className="mt-1 text-[11px] text-gray-500 flex items-center gap-1.5 font-medium">
              <span className="text-emerald-600 font-bold inline-flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md text-[10px]">
                <ArrowUpRight className="h-3 w-3" />
                {((totalSales / (totalSales + totalExpensesAmt + 1)) * 100).toFixed(0)}%
              </span>
              ratio of business inward
            </p>
          </div>
        </div>

        {/* KPI Card 2: Receivables / Dues from customers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden custom-card-shadow" id="kpi-card-receivables">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-display">Customer Credit Dues</span>
            <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              Rs. {totalOutstandingReceivables.toLocaleString()}
            </h3>
            <p className="mt-1 text-[11px] text-gray-500 font-medium">
              Awaiting collects from <span className="font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md text-[10px]">{customers.filter(c => c.outstandingDue > 0).length} clients</span>
            </p>
          </div>
        </div>

        {/* KPI Card 3: Inventory Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden custom-card-shadow" id="kpi-card-inventory">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-display">Stock Valuation</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              Rs. {totalInventoryValuation.toLocaleString()}
            </h3>
            <p className="mt-1 text-[11px] text-gray-500 flex items-center gap-1 font-medium">
              <span className={`font-bold px-1.5 py-0.5 rounded-md text-[10px] ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {lowStockCount} items
              </span>
              configured at low alert qty
            </p>
          </div>
        </div>

        {/* KPI Card 4: Operating Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden custom-card-shadow" id="kpi-card-profit">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-display">Est. Net Cash Flow</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              Rs. {(paidSales - totalExpensesAmt).toLocaleString()}
            </h3>
            <p className="mt-1 text-[11px] text-gray-500 font-medium">
              Sales receipts minus operational expenditures
            </p>
          </div>
        </div>
      </div>

      {/* Graphs & Trends sections using elegant bento-grid layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-visuals-grid">
        
        {/* Sales Inflows Graph Panel */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 custom-card-shadow" id="graphic-sales-trends">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 font-display">
                {fiscalYearFilter !== 'All' ? `FY ${fiscalYearFilter} Operations Analysis` : 'Weekly Transaction Inflow Analysis'}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Total volume logged over consecutive operational days</p>
            </div>
            {/* Legend indicators */}
            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div> Sales
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-rose-500"></div> Expenses
              </div>
            </div>
          </div>

          <div className="h-68 w-full" id="responsive-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E4E4E7', fontSize: '11px', outline: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  labelStyle={{ fontWeight: '700', color: '#18181B', marginBottom: '4px', fontFamily: 'var(--font-display)' }}
                />
                <Area type="monotone" dataKey="Sales" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Sales (Rs)" />
                <Area type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorExpenses)" name="Expenses (Rs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Distribution Tabular/Graphic Panel */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between custom-card-shadow" id="graphic-expense-distribution">
          <div>
            <h2 className="text-sm font-bold text-gray-950 font-display">Expense Allocations</h2>
            <p className="text-[11px] text-gray-400 mb-4 mt-0.5">Allocation weights by sector for search filters</p>
            
            {expenseCatDistribution.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10" id="empty-expense-state">
                <TrendingDown className="h-10 w-10 text-gray-200 mb-2" />
                <p className="text-xs text-gray-405">No expenses recorded in this index yet.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-1" id="expense-bars-list">
                {expenseCatDistribution.map((item, index) => {
                  const maxVal = Math.max(...expenseCatDistribution.map(e => e.value));
                  const percent = (item.value / maxVal) * 100;
                  return (
                    <div key={item.category} className="space-y-1" id={`expense-bar-item-${item.category}`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-700">{item.category}</span>
                        <span className="font-mono text-gray-500 font-bold">Rs. {item.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percent}%`,
                            backgroundColor: COLORS[index % COLORS.length] 
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between" id="expenses-aggregates-footer">
            <span className="text-xs text-gray-400 font-medium">Total Outward Spend:</span>
            <span className="text-sm font-bold text-rose-600 font-mono">
              Rs. {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom sections: Top Selling Products and Recent Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-items-and-history-grid">
        {/* Column Left: Top Products & Fast Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4 custom-card-shadow" id="top-selling-products-card">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3.5">
            <h3 className="text-sm font-bold text-gray-950 font-display">Popular Trade Products</h3>
            <span className="text-[11px] font-bold text-blue-600 cursor-pointer hover:underline transition font-display" onClick={() => setActiveTab('inventory')}>View All Products</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center" id="empty-top-products">
              <DollarSign className="h-8 w-8 text-gray-200 mb-1" />
              <p className="text-xs text-gray-404">Submit billing invoices to populate selling metrics.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100" id="top-products-list">
              {topProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between py-2.5 text-xs" id={`top-product-item-${idx}`}>
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] border border-blue-100">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-gray-800 block">{p.name}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">{p.qty} sales logged</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-gray-800 text-right">Rs. {p.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column Right: Recent Invoices & Movements logs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4 custom-card-shadow" id="recent-invoices-card">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3.5">
            <h3 className="text-sm font-bold text-gray-950 font-display">Recent Customer Invoices</h3>
            <span className="text-[11px] font-bold text-blue-600 cursor-pointer hover:underline transition font-display" onClick={() => setActiveTab('billing')}>Create Invoices</span>
          </div>

          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center" id="empty-recent-invoices">
              <Receipt className="h-8 w-8 text-gray-200 mb-1" />
              <p className="text-xs text-gray-404">No invoices drafted yet in current shift.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100" id="recent-invoices-list">
              {invoices.slice(0, 4).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2.5 text-xs text-gray-600" id={`recent-invoice-item-${inv.id}`}>
                  <div>
                    <span className="font-bold text-gray-800 block">{inv.customerName}</span>
                    <span className="text-[10px] text-gray-400 block font-mono mt-0.5">{inv.invoiceNo} • {inv.bsDate}</span>
                  </div>
                  
                  <div className="flex items-center gap-3.5">
                    <div className="text-right">
                      <span className="font-mono font-bold text-gray-950 block">Rs. {inv.grandTotal.toLocaleString()}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                        inv.status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : inv.status === 'Partial' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    {/* Tiny visual check btn */}
                    <button 
                      id={`btn-view-invoice-${inv.id}`}
                      onClick={() => {
                        // Switch active tab and select standard viewing trigger
                        setActiveTab('billing');
                      }} 
                      className="p-1 px-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-md active:scale-95 transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
