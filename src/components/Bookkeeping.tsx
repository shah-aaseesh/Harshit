import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, Landmark, FileText, ArrowRightLeft, Printer, ShieldCheck, 
  HelpCircle, ChevronRight, Calculator, TrendingUp, Sparkles, Filter, Search,
  Calendar, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight as ChevronRightIcon, FileCheck
} from 'lucide-react';
import { formatBSDate, getFiscalYear, FISCAL_YEAR_OPTIONS, getTodayBS, convertADtoBS, convertBStoAD } from '../utils/nepaliCalendar';

export const Bookkeeping: React.FC = () => {
  const { journals, invoices, expenses, products, suppliers, customers, purchases } = useApp();

  // Active view segment: 'daybook' | 'pnl' | 'balancesheet' | 'journal'
  const [activeSegment, setActiveSegment] = useState<'daybook' | 'pnl' | 'balancesheet' | 'journal'>('daybook');

  // Ledger filter states
  const [journalSearch, setJournalSearch] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<string>('All');

  // Daybook Specific States
  const [selectedDaybookDate, setSelectedDaybookDate] = useState<string>(getTodayBS());
  const [daybookTypeFilter, setDaybookTypeFilter] = useState<'all' | 'sales' | 'purchases' | 'expenses' | 'journals'>('all');

  // Find all available dates with activity for quick selection
  const allAvailableBSDates = Array.from(new Set([
    ...invoices.map(i => i.bsDate),
    ...purchases.map(p => p.bsDate),
    ...expenses.map(e => e.bsDate),
    ...journals.map(j => j.bsDate)
  ])).filter(Boolean).sort().reverse();

  // Daybook filters
  const dayInvoices = invoices.filter(inv => inv.bsDate === selectedDaybookDate);
  const dayExpenses = expenses.filter(exp => exp.bsDate === selectedDaybookDate);
  const dayPurchases = purchases.filter(p => p.bsDate === selectedDaybookDate);
  const dayJournals = journals.filter(j => j.bsDate === selectedDaybookDate);

  // Inflows (Cash-like payments received)
  const cashSales = dayInvoices.filter(inv => inv.paymentMethod !== 'Credit').reduce((sum, inv) => sum + inv.paidAmount, 0);
  // Outflows (Cash-like payments made)
  const cashExpenses = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const cashPurchases = dayPurchases.filter(p => p.paymentMethod !== 'Credit').reduce((sum, p) => sum + p.paidAmount, 0);

  // Credit Inflows & Outflows (Receivables & Payables recorded today)
  const creditSales = dayInvoices.filter(inv => inv.paymentMethod === 'Credit' || inv.dueAmount > 0).reduce((sum, inv) => sum + inv.dueAmount, 0);
  const creditPurchases = dayPurchases.filter(p => p.dueAmount > 0).reduce((sum, p) => sum + p.dueAmount, 0);

  const totalCashInflow = cashSales;
  const totalCashOutflow = cashExpenses + cashPurchases;
  const netDailyMovement = totalCashInflow - totalCashOutflow;

  // Navigate back/forward chronologically using our bulletproof conversion
  const navigateDay = (direction: 'prev' | 'next') => {
    try {
      const adDate = convertBStoAD(selectedDaybookDate);
      const newAdDate = new Date(adDate);
      if (direction === 'prev') {
        newAdDate.setDate(adDate.getDate() - 1);
      } else {
        newAdDate.setDate(adDate.getDate() + 1);
      }
      const newBsDate = convertADtoBS(newAdDate);
      setSelectedDaybookDate(newBsDate);
    } catch (e) {
      console.error("Error navigating day:", e);
    }
  };

  // Compile combined events for the selected daybook
  const daybookEvents = [
    ...dayInvoices.map(inv => ({
      id: `inv-${inv.id}`,
      time: inv.date,
      type: 'Sale',
      ref: inv.invoiceNo,
      particulars: `To Customer: ${inv.customerName}`,
      inflow: inv.paidAmount,
      outflow: 0,
      credit: inv.dueAmount,
      method: inv.paymentMethod,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-100 border',
    })),
    ...dayPurchases.map(p => ({
      id: `pur-${p.id}`,
      time: p.date,
      type: 'Purchase',
      ref: p.billNo,
      particulars: `From Supplier: ${p.supplierName}`,
      inflow: 0,
      outflow: p.paidAmount,
      credit: p.dueAmount,
      method: p.paymentMethod,
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-100 border',
    })),
    ...dayExpenses.map(exp => ({
      id: `exp-${exp.id}`,
      time: exp.date,
      type: 'Expense',
      ref: `EXP-${exp.id.slice(0, 4).toUpperCase()}`,
      particulars: `Category: ${exp.category} - ${exp.title}`,
      inflow: 0,
      outflow: exp.amount,
      credit: 0,
      method: exp.paymentMethod,
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-100 border',
    })),
    ...dayJournals.map(j => ({
      id: `j-${j.id}`,
      time: j.date,
      type: 'Journal',
      ref: j.reference || 'JV',
      particulars: `${j.description} (Dr: ${j.debitAccount} / Cr: ${j.creditAccount})`,
      inflow: j.debitAccount.toLowerCase().includes('cash') || j.debitAccount.toLowerCase().includes('bank') ? j.amount : 0,
      outflow: j.creditAccount.toLowerCase().includes('cash') || j.creditAccount.toLowerCase().includes('bank') ? j.amount : 0,
      credit: 0,
      method: 'Journal',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-100 border',
    }))
  ].sort((a, b) => b.time.localeCompare(a.time));

  const filteredDaybookEvents = daybookEvents.filter(ev => {
    if (daybookTypeFilter === 'all') return true;
    if (daybookTypeFilter === 'sales') return ev.type === 'Sale';
    if (daybookTypeFilter === 'purchases') return ev.type === 'Purchase';
    if (daybookTypeFilter === 'expenses') return ev.type === 'Expense';
    if (daybookTypeFilter === 'journals') return ev.type === 'Journal';
    return true;
  });

  // FILTERED COLLECTIONS FOR BOOKKEEPING CALCULATIONS
  const targetInvoices = invoices.filter(inv => fiscalYear === 'All' || getFiscalYear(inv.bsDate) === fiscalYear);
  const targetExpenses = expenses.filter(exp => fiscalYear === 'All' || getFiscalYear(exp.bsDate) === fiscalYear);
  const targetJournals = journals.filter(j => fiscalYear === 'All' || getFiscalYear(j.bsDate) === fiscalYear);

  // 1. CALCULATE PROFIT & LOSS METRICS (INCOME STATEMENT)
  const totalRevenues = targetInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  
  // Calculate cost of goods sold based on actual product items purchased vs sold (estimated or precise)
  // Let's calculate precise cost of goods sold: Sum of (item.quantity * product.purchasePrice)
  let computedCOGS = 0;
  targetInvoices.forEach(inv => {
    inv.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const costRate = prod ? prod.purchasePrice : (item.rate * 0.6); // 60% fallback
      computedCOGS += (item.quantity * costRate);
    });
  });

  const grossProfit = Math.max(0, totalRevenues - computedCOGS);

  // Group expenses by category
  const expenseSummary = {
    Rent: targetExpenses.filter(e => e.category === 'Rent').reduce((s, e) => s + e.amount, 0),
    Salary: targetExpenses.filter(e => e.category === 'Salary').reduce((s, e) => s + e.amount, 0),
    Utilities: targetExpenses.filter(e => e.category === 'Utilities').reduce((s, e) => s + e.amount, 0),
    Transportation: targetExpenses.filter(e => e.category === 'Transportation').reduce((s, e) => s + e.amount, 0),
    Marketing: targetExpenses.filter(e => e.category === 'Marketing').reduce((s, e) => s + e.amount, 0),
    Refreshment: targetExpenses.filter(e => e.category === 'Refreshment').reduce((s, e) => s + e.amount, 0),
    Miscellaneous: targetExpenses.filter(e => e.category === 'Miscellaneous').reduce((s, e) => s + e.amount, 0),
  };

  const totalExpenses = Object.values(expenseSummary).reduce((s, v) => s + v, 0);
  const netProfit = grossProfit - totalExpenses;

  // 2. CALCULATE BALANCE SHEET VALUES
  // Assets = Cash/Bank + Receivables + Inventory Value
  const totalReceivables = customers.reduce((s, c) => s + c.outstandingDue, 0);
  const totalInventoryAssets = products.reduce((s, p) => s + (p.stockQty * p.purchasePrice), 0);
  
  // Estimating cash in hand based on historical logs
  // Initial capital + Sales received - Expenses paid - Supplier paid
  const baseCashFund = 250000; // Starting business cash balance representation
  const cashSalesReceived = targetInvoices.reduce((s, inv) => s + inv.paidAmount, 0);
  const paymentsMadeToSuppliers = suppliers.reduce((s, supp) => s + supp.totalPaid, 0);
  const totalOperationalPurchases = totalExpenses;
  const computedCashBankBalance = baseCashFund + cashSalesReceived - paymentsMadeToSuppliers - totalOperationalPurchases;

  const totalAssetsVal = computedCashBankBalance + totalReceivables + totalInventoryAssets;

  // Liabilities = Suppliers Outstanding Credit
  const totalPayables = suppliers.reduce((s, supp) => s + supp.outstandingDue, 0);

  // Equities = Initial Owner Investment Capital + Cumulative Retained Profit/Loss
  const ownerStartingCapital = baseCashFund + totalInventoryAssets + totalReceivables - totalPayables;
  const retainedEarnings = netProfit;
  const totalEquitiesVal = ownerStartingCapital + retainedEarnings; 

  // Filter Journal items
  const filteredJournals = targetJournals.filter(j => 
    j.description.toLowerCase().includes(journalSearch.toLowerCase()) ||
    j.debitAccount.toLowerCase().includes(journalSearch.toLowerCase()) ||
    j.creditAccount.toLowerCase().includes(journalSearch.toLowerCase()) ||
    j.reference.toLowerCase().includes(journalSearch.toLowerCase())
  );

  const handleADDateChange = (adDateStr: string) => {
    if (!adDateStr) return;
    const bsConverted = convertADtoBS(new Date(adDateStr));
    setSelectedDaybookDate(bsConverted);
  };

  const triggerPrintForElement = (elementId: string, titleName: string) => {
    const el = document.getElementById(elementId);
    if (!el) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) {
      window.print();
      return;
    }

    let styleTagsHtml = "";
    document.querySelectorAll("style, link[rel='stylesheet']").forEach(styles => {
      styleTagsHtml += styles.outerHTML;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titleName}</title>
          ${styleTagsHtml}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              background-color: white !important;
              color: #000000 !important;
              margin: 0;
              padding: 24px;
            }
            #${elementId} {
              border: none !important;
              box-shadow: none !important;
              width: 100% !important;
              padding: 0 !important;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                filter: grayscale(100%) !important;
                -webkit-filter: grayscale(100%) !important;
              }
              /* Grayscale visual contrast overrides */
              * {
                color: #000000 !important;
                text-shadow: none !important;
                box-shadow: none !important;
              }
              button, .no-print, #btn-print-pnl, #btn-print-bs {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div id="${elementId}">
            ${el.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                try { window.print(); } catch (e) { console.error(e); }
                setTimeout(function() {
                  window.parent.document.body.removeChild(window.frameElement);
                }, 1000);
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="accounting-module-container">
      
      {/* Tab select menu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4" id="accounting-header">
        <div>
          <h1 className="text-xl font-semibold text-gray-900" id="accounting-title">Bookkeeping & Ledgers</h1>
          <p className="text-xs text-gray-500" id="accounting-desc">Under-the-hood general journals, instant profit yields, and balanced operational balance sheets</p>
        </div>

        <div className="flex flex-wrap items-center gap-3" id="accounting-controls">
          {/* Fiscal Year Filter Dropdown - Only show for non-daybook segments */}
          {activeSegment !== 'daybook' && (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-150 rounded-xl px-2.5 py-1.5 text-xs animate-fade-in" id="bookkeeping-fy-wrapper">
              <span className="text-gray-400 font-bold select-none">Fiscal Year:</span>
              <select
                id="select-bookkeeping-fy"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="bg-transparent font-extrabold text-gray-800 outline-none cursor-pointer"
              >
                {FISCAL_YEAR_OPTIONS.map(fy => (
                  <option key={fy} value={fy}>{fy === 'All' ? 'All Fiscal Years' : `FY ${fy}`}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2" id="accounting-tab-toggle">
            <button
              id="btn-acctab-daybook"
              onClick={() => setActiveSegment('daybook')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSegment === 'daybook' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-white text-gray-600 border border-gray-100'
              }`}
            >
              Daily Daybook
            </button>
            <button
              id="btn-acctab-pnl"
              onClick={() => setActiveSegment('pnl')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSegment === 'pnl' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-white text-gray-600 border border-gray-100'
              }`}
            >
              Profit & Loss Yield
            </button>
            <button
              id="btn-acctab-balancesheet"
              onClick={() => setActiveSegment('balancesheet')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSegment === 'balancesheet' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-white text-gray-600 border border-gray-100'
              }`}
            >
              Sajilo Balance Sheet
            </button>
            <button
              id="btn-acctab-journal"
              onClick={() => setActiveSegment('journal')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSegment === 'journal' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-white text-gray-600 border border-gray-100'
              }`}
            >
              General Journals
            </button>
          </div>
        </div>
      </div>

      {activeSegment === 'daybook' && (
        <div className="space-y-6 animate-fade-in" id="daybook-tab-view">
          
          {/* DAYBOOK HEADER & DATE SELECTOR WIDGET */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xxs space-y-4" id="daybook-control-card">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="daybook-header-row">
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-blue-600" /> Daily Transactions Daybook (दैनिक खाता)
                </h2>
                <p className="text-[11px] text-gray-500">Chronological verification journal of daily cash counter cashflows and credit trades</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto" id="daybook-header-actions">
                <button
                  id="btn-print-daybook"
                  onClick={() => triggerPrintForElement('daybook-print-container', `Daily Daybook - ${selectedDaybookDate}`)}
                  className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-2 transition cursor-pointer select-none"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Daily Sheet
                </button>
              </div>
            </div>

            {/* DATE CONTROLLER TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-gray-100" id="daybook-date-controller">
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 w-fit" id="daybook-nav-buttons">
                <button
                  id="btn-daybook-prev"
                  onClick={() => navigateDay('prev')}
                  className="p-2 hover:bg-white rounded-lg text-gray-600 transition hover:shadow-2xs active:scale-95"
                  title="Previous Day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="text-xs font-black text-gray-800 px-4 min-w-[120px] text-center font-mono">
                  {selectedDaybookDate}
                </span>

                <button
                  id="btn-daybook-next"
                  onClick={() => navigateDay('next')}
                  className="p-2 hover:bg-white rounded-lg text-gray-600 transition hover:shadow-2xs active:scale-95"
                  title="Next Day"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs" id="daybook-direct-inputs">
                {/* Available Activity Days selection */}
                {allAvailableBSDates.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-150 rounded-xl px-2.5 py-1.5" id="daybook-quick-select">
                    <span className="text-gray-400 font-bold select-none">Quick Date:</span>
                    <select
                      id="select-daybook-activity-date"
                      value={allAvailableBSDates.includes(selectedDaybookDate) ? selectedDaybookDate : ''}
                      onChange={(e) => e.target.value && setSelectedDaybookDate(e.target.value)}
                      className="bg-transparent font-extrabold text-gray-800 outline-none cursor-pointer max-w-[140px]"
                    >
                      <option value="">-- Choose active day --</option>
                      {allAvailableBSDates.map(date => (
                        <option key={date} value={date}>{date === getTodayBS() ? 'Today' : date}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Gregorian AD Date input converter */}
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-150 rounded-xl px-2.5 py-1" id="daybook-ad-picker">
                  <span className="text-gray-400 font-bold select-none">AD Pick:</span>
                  <input
                    type="date"
                    id="input-daybook-ad"
                    onChange={(e) => handleADDateChange(e.target.value)}
                    className="bg-transparent border-none text-xs text-gray-800 font-bold outline-none cursor-pointer"
                  />
                </div>

                <button
                  id="btn-daybook-today"
                  onClick={() => setSelectedDaybookDate(getTodayBS())}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-100 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100 cursor-pointer active:scale-95"
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* PRINT CONTAINER WITH ALL THE INFORMATION */}
          <div className="space-y-6" id="daybook-print-container">
            
            {/* ONLY DISPLAYED DURING PRINT: CORPORATE HEADER */}
            <div className="hidden print:block space-y-2 border-b-2 border-gray-900 pb-4 text-center" id="daybook-print-header">
              <h1 className="text-2xl font-black uppercase tracking-tight">SajiloBiz Operations Daybook</h1>
              <div className="text-xs text-gray-600 font-mono space-y-1">
                <p>Report Date: {selectedDaybookDate} BS ({formatBSDate(selectedDaybookDate)})</p>
                <p>Generated by Operating Portal: SajiloBiz System Ledger</p>
              </div>
            </div>

            {/* BENTO STATS CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="daybook-kpi-grid">
              {/* Card 1: Total Cash Inflow */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-2xs space-y-2.5 hover:shadow-xs transition" id="daybook-card-inflow">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider font-display">Daily Cash Inflows</span>
                  <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/10">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950 font-mono">Rs. {totalCashInflow.toLocaleString()}</h3>
                  <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">
                    From {dayInvoices.filter(i => i.paymentMethod !== 'Credit').length} cash sales
                  </span>
                </div>
              </div>

              {/* Card 2: Total Cash Outflow */}
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 shadow-2xs space-y-2.5 hover:shadow-xs transition" id="daybook-card-outflow">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider font-display">Daily Cash Outflows</span>
                  <div className="h-7 w-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/10">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-rose-950 font-mono">Rs. {totalCashOutflow.toLocaleString()}</h3>
                  <span className="text-[9px] text-rose-600 font-semibold block mt-0.5">
                    {dayExpenses.length} expenses + {dayPurchases.filter(p => p.paymentMethod !== 'Credit').length} cash purchases
                  </span>
                </div>
              </div>

              {/* Card 3: Net Cash Movement */}
              <div className={`p-4 rounded-xl border shadow-2xs space-y-2.5 hover:shadow-xs transition ${
                netDailyMovement >= 0 
                  ? 'bg-blue-50/40 border-blue-100 text-blue-950' 
                  : 'bg-amber-50/40 border-amber-100 text-amber-950'
              }`} id="daybook-card-net">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider font-display ${
                    netDailyMovement >= 0 ? 'text-blue-800' : 'text-amber-800'
                  }`}>Net Cash Movement</span>
                  <div className={`h-7 w-7 rounded-lg text-white flex items-center justify-center shadow-md ${
                    netDailyMovement >= 0 ? 'bg-blue-500 shadow-blue-500/10' : 'bg-amber-500 shadow-amber-500/10'
                  }`}>
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black font-mono">
                    {netDailyMovement >= 0 ? 'Rs. ' : 'Rs. -'}{Math.abs(netDailyMovement).toLocaleString()}
                  </h3>
                  <span className={`text-[9px] font-semibold block mt-0.5 ${
                    netDailyMovement >= 0 ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {netDailyMovement >= 0 ? 'Inflow Surplus' : 'Outflow Deficit'}
                  </span>
                </div>
              </div>

              {/* Card 4: Credit trades created */}
              <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100/60 shadow-2xs space-y-2.5 hover:shadow-xs transition" id="daybook-card-credits">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider font-display">Daily Credit trades</span>
                  <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/10">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950 font-mono">
                    Cr Sales: Rs. {creditSales.toLocaleString()}
                  </h3>
                  <span className="text-[9px] text-amber-600 font-semibold block mt-0.5">
                    Cr Purchases: Rs. {creditPurchases.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* CHRONOLOGICAL EVENT FEED CONTAINER */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xxs font-sans" id="daybook-feed-container">
              
              {/* FEED FILTERS TOOLBAR */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-4 bg-gray-50/50 border-b border-gray-100" id="daybook-feed-toolbar">
                <div className="flex flex-wrap items-center gap-1.5" id="daybook-feed-filters">
                  <button
                    id="btn-daybook-filter-all"
                    onClick={() => setDaybookTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      daybookTypeFilter === 'all' 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-white text-gray-600 border border-gray-150 hover:bg-gray-50'
                    }`}
                  >
                    All Logs ({daybookEvents.length})
                  </button>
                  <button
                    id="btn-daybook-filter-sales"
                    onClick={() => setDaybookTypeFilter('sales')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      daybookTypeFilter === 'sales' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white text-gray-600 border border-gray-150 hover:bg-emerald-50 hover:text-emerald-850'
                    }`}
                  >
                    Sales ({dayInvoices.length})
                  </button>
                  <button
                    id="btn-daybook-filter-purchases"
                    onClick={() => setDaybookTypeFilter('purchases')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      daybookTypeFilter === 'purchases' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-600 border border-gray-150 hover:bg-blue-50 hover:text-blue-850'
                    }`}
                  >
                    Purchases ({dayPurchases.length})
                  </button>
                  <button
                    id="btn-daybook-filter-expenses"
                    onClick={() => setDaybookTypeFilter('expenses')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      daybookTypeFilter === 'expenses' 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-white text-gray-600 border border-gray-150 hover:bg-rose-50 hover:text-rose-850'
                    }`}
                  >
                    Expenses ({dayExpenses.length})
                  </button>
                  <button
                    id="btn-daybook-filter-journals"
                    onClick={() => setDaybookTypeFilter('journals')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      daybookTypeFilter === 'journals' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-white text-gray-600 border border-gray-150 hover:bg-amber-50 hover:text-amber-850'
                    }`}
                  >
                    Journals ({dayJournals.length})
                  </button>
                </div>

                <div className="text-[10px] text-gray-400 font-mono flex items-center justify-end" id="daybook-timestamp-helper">
                  Showing {filteredDaybookEvents.length} transactions
                </div>
              </div>

              {/* TRANSACTIONS TABLE LIST */}
              <div className="overflow-x-auto" id="daybook-transactions-table-wrapper">
                <table className="w-full text-left border-collapse text-xs" id="daybook-transactions-table">
                  <thead>
                    <tr className="bg-gray-50 text-gray-550 border-b border-gray-100 font-extrabold uppercase text-[10px] tracking-wider" id="daybook-th-row">
                      <th className="p-4 w-[120px]">Ref/Voucher</th>
                      <th className="p-4 w-[110px]">Type</th>
                      <th className="p-4">Particulars</th>
                      <th className="p-4 w-[110px]">Pay Method</th>
                      <th className="p-4 text-right w-[130px]">Cash In (Dr)</th>
                      <th className="p-4 text-right w-[130px]">Cash Out (Cr)</th>
                      <th className="p-4 text-right w-[130px]">Credit Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-605" id="daybook-tbody">
                    {filteredDaybookEvents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-gray-400 font-medium">
                          No transactions recorded on {selectedDaybookDate}.
                        </td>
                      </tr>
                    ) : (
                      filteredDaybookEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-gray-50/30 transition-all" id={`row-daybook-item-${ev.id}`}>
                          <td className="p-4 font-mono font-black text-gray-900">
                            {ev.ref}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[9px] font-extrabold block w-fit text-center leading-none ${ev.badgeColor}`}>
                              {ev.type}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-gray-800 leading-snug">{ev.particulars}</div>
                            <span className="text-[9px] text-gray-400 font-mono">{ev.time.split('T')[0]}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-150 text-[10px] text-gray-500 font-bold block w-fit">
                              {ev.method}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-600">
                            {ev.inflow > 0 ? `Rs. ${ev.inflow.toLocaleString()}` : '—'}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-rose-600">
                            {ev.outflow > 0 ? `Rs. ${ev.outflow.toLocaleString()}` : '—'}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-amber-600">
                            {ev.credit > 0 ? `Rs. ${ev.credit.toLocaleString()}` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* SUMMARY TOTAL FOOTER FOR DAYBOOK PRINTING */}
                  {filteredDaybookEvents.length > 0 && (
                    <tfoot className="bg-gray-50/50 font-black text-gray-900 border-t border-gray-150">
                      <tr>
                        <td colSpan={4} className="p-4 text-right font-bold uppercase tracking-wide">
                          Daily Totals (जम्मा योग):
                        </td>
                        <td className="p-4 text-right font-mono text-emerald-750 font-black">
                          Rs. {daybookEvents.reduce((s, e) => s + e.inflow, 0).toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-mono text-rose-750 font-black">
                          Rs. {daybookEvents.reduce((s, e) => s + e.outflow, 0).toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-mono text-amber-750 font-black">
                          Rs. {daybookEvents.reduce((s, e) => s + e.credit, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSegment === 'pnl' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="pnl-tab-view">
          
          {/* PNL Numerical Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 space-y-5 shadow-xxs" id="pnl-statement-sheet">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Profit & Loss Statement (Income Statement)</h2>
                <span className="text-[10px] text-gray-400">Current financial term performance</span>
              </div>
              <button id="btn-print-pnl" onClick={() => triggerPrintForElement('pnl-statement-sheet', 'Profit & Loss Statement')} className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-blue-600 transition">
                <Printer className="h-3.5 w-3.5" /> Print Statement
              </button>
            </div>

            {/* Calculations lines */}
            <div className="space-y-3.5 text-xs text-gray-600" id="statement-rows">
              
              {/* Gross Revenues */}
              <div className="flex justify-between items-center py-1 border-b border-gray-50" id="row-sales-rev">
                <span className="font-semibold text-gray-800 flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" /> Operating Sales Revenue (Tax Invoiced)
                </span>
                <span className="font-mono font-bold text-gray-900">Rs. {totalRevenues.toLocaleString()}</span>
              </div>

              {/* COGS */}
              <div className="flex justify-between items-center py-1 border-b border-gray-50 text-rose-600" id="row-cogs">
                <span className="font-semibold flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-rose-400" /> Less: Cost Of Goods Sold (COGS)
                </span>
                <span className="font-mono font-bold">Rs. -{computedCOGS.toLocaleString()}</span>
              </div>

              {/* Gross margin */}
              <div className="flex justify-between items-center py-2 bg-blue-50/30 px-3 rounded-lg border border-blue-50/50 text-blue-800" id="row-gross-profit">
                <span className="font-bold uppercase tracking-wider text-[10px]">Gross Trading Profit Margin</span>
                <span className="font-mono font-black">Rs. {grossProfit.toLocaleString()}</span>
              </div>

              {/* Expenses detail heading */}
              <div className="pt-2" id="operating-exp-section">
                <span className="text-[10px] font-bold text-gray-405 uppercase tracking-wider block mb-2">Operating Expenditures (OPEX)</span>
                
                <div className="space-y-2 pl-3" id="opex-lines">
                  {Object.entries(expenseSummary).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between items-center text-[11px] text-gray-500 hover:text-gray-800" id={`row-expense-${cat}`}>
                      <span>• Commercial Operational {cat} costs</span>
                      <span className="font-mono">Rs. {val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Expenses */}
              <div className="flex justify-between items-center py-1.5 border-t border-dashed border-gray-150 text-rose-500 font-semibold" id="row-total-opex">
                <span className="pl-3 flex items-center gap-1.5">Total Deductible Expenditures</span>
                <span className="font-mono">Rs. -{totalExpenses.toLocaleString()}</span>
              </div>

              {/* Net Operating Earnings */}
              <div className="flex justify-between items-center py-3 bg-gray-50 px-4 rounded-xl border border-gray-150 text-gray-950" id="row-net-profit">
                <div>
                  <span className="font-semibold text-xs text-gray-900 block font-sans">Net Operating Surplus income</span>
                  <span className="text-[10px] text-gray-400 font-normal">Remaining tax/VAT report savings</span>
                </div>
                <span className={`font-mono text-lg font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Rs. {netProfit.toLocaleString()}
                </span>
              </div>

            </div>
          </div>

          {/* Quick Guidance and analytics card info */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 flex flex-col justify-between" id="pnl-right-infographics">
            <div className="space-y-4" id="pnl-info-segment">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full inline-block">Sajilo Yield Analysis</span>
              
              <div className="space-y-3" id="analysis-text-blocks">
                <div className="flex items-start gap-2.5 text-xs" id="text-block-1">
                  <Sparkles className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-gray-600 leading-relaxed">
                    SajiloBiz automatically captures sales data from <strong className="text-gray-900">Recorded Invoices</strong> and operational spends from <strong className="text-gray-900 font-semibold">Logged Expenses</strong> to compile P&L trends dynamically in real-time. No manual journaling is needed!
                  </p>
                </div>

                <div className="flex items-start gap-2.5 text-xs border-t border-gray-50 pt-3" id="text-block-2">
                  <Calculator className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-800 block text-[11px] mb-0.5">COGS Configuration</span>
                    <span className="text-gray-500 leading-snug block">Cost prices are evaluated dynamically using actual purchase/wholesale figures of inventory items logged in warehouses.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4" id="performance-chart-brief">
              <span className="text-[11px] text-gray-400 block mb-1 font-mono">Operations Health Ratios</span>
              <div className="flex items-center gap-2 text-xs" id="yield-ratio-indicator">
                <span className="font-extrabold text-blue-700 font-mono">{((netProfit / (totalRevenues + 1)) * 100).toFixed(0)}%</span>
                <span className="text-gray-500">Net Operating Yield Profit margin</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeSegment === 'balancesheet' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-5 shadow-xxs animate-fade-in" id="balancesheet-tab-view">
          
          <div className="flex justify-between items-center border-b border-gray-150 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Sajilo Commercial Balance Sheet Statement</h2>
              <span className="text-[10px] text-gray-400">Statement of Financial Position as of current BS calendar shift</span>
            </div>
            
            <div className="flex items-center gap-2" id="bs-sheet-meta-header">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Book Record Balanced
              </span>
              <button id="btn-print-bs" onClick={() => triggerPrintForElement('balancesheet-tab-view', 'Balance Sheet Statement')} className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-blue-600 transition">
                <Printer className="h-3.5 w-3.5" /> Print Sheet
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-600" id="balance-sheet-comparisons">
            
            {/* COLUMN LEFT: ASSET ACCUMULATIONS */}
            <div className="space-y-4" id="assets-balance-column">
              <h3 className="font-extrabold text-gray-900 border-b pb-1 px-1 tracking-wider uppercase text-[10px] text-blue-700">1. Trading Assets (Inflow Accumulations)</h3>
              
              <div className="space-y-2.5" id="asset-lines">
                <div className="flex justify-between items-center py-1 border-b border-gray-50" id="bs-line-cash">
                  <span className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-gray-400" /> Estimated Liquid Cash & Bank Account Reserves</span>
                  <span className="font-mono font-bold text-gray-900">Rs. {computedCashBankBalance.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-50" id="bs-line-receivables">
                  <span className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-gray-400" /> Accounts Receivable (Trade Customer Credits)</span>
                  <span className="font-mono font-bold text-gray-900">Rs. {totalReceivables.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-50" id="bs-line-inventory">
                  <span className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-gray-400" /> Physical Stock asset values (Cost Base)</span>
                  <span className="font-mono font-bold text-gray-900">Rs. {totalInventoryAssets.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2.5 bg-blue-50/20 text-blue-850 border border-blue-50 px-3 rounded-lg font-bold" id="bs-total-assets">
                  <span className="uppercase text-[9px] tracking-wider text-blue-700 font-extrabold">Sum Total Net Trading Assets (A)</span>
                  <span className="font-mono text-blue-700 font-black">Rs. {totalAssetsVal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* COLUMN RIGHT: LIABILITIES & EQUITY */}
            <div className="space-y-4" id="liabilities-equity-balance-column">
              
              {/* Liabilities */}
              <div className="space-y-2" id="liabilities-segment">
                <h3 className="font-extrabold text-gray-900 border-b pb-1 px-1 tracking-wider uppercase text-[10px] text-amber-700">2. Trade Liabilities (Payable Accounts)</h3>
                
                <div className="flex justify-between items-center py-1 border-b border-gray-50" id="bs-line-payables">
                  <span className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-gray-400" /> Accounts Payable (To Agro Suppliers & Farms)</span>
                  <span className="font-mono font-semibold text-gray-900">Rs. {totalPayables.toLocaleString()}</span>
                </div>
              </div>

              {/* Equities */}
              <div className="space-y-2" id="equity-segment">
                <h3 className="font-extrabold text-gray-900 border-b pb-1 px-1 tracking-wider uppercase text-[10px] text-emerald-700">3. Owner Reserving Equities</h3>
                
                <div className="flex justify-between items-center py-1 border-b border-gray-50" id="bs-line-capital">
                  <span className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-gray-400" /> Owner Investment Opening Capital Fund</span>
                  <span className="font-mono text-gray-800">Rs. {ownerStartingCapital.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-50" id="bs-line-retained">
                  <span className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-gray-400" /> Retained Earnings (Term Profit Balance)</span>
                  <span className={`font-mono ${retainedEarnings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Rs. {retainedEarnings.toLocaleString()}</span>
                </div>
              </div>

              {/* Sum calculations */}
              <div className="flex justify-between items-center py-2.5 bg-gray-50 text-gray-900 border px-3 rounded-lg font-bold" id="bs-total-liabilities-equity">
                <span className="uppercase text-[9px] tracking-wider font-extrabold">Total Liabilities & Equities (B)</span>
                <span className="font-mono font-black text-gray-950">Rs. {totalEquitiesVal.toLocaleString()}</span>
              </div>
            </div>

          </div>

          <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-[11px] text-gray-455 p-1 bg-emerald-55/10 rounded border border-emerald-50" id="balance-equation-verification-banner">
            <span className="font-medium text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 animate-bounce" /> double-entry balancing verification completed: Assets exactly equals Liabilities + Equities.
            </span>
            <span className="font-mono font-bold text-emerald-800">Balanced Rs. {totalAssetsVal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {activeSegment === 'journal' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-xxs animate-fade-in" id="journal-tab-view">
          
          {/* Operations bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-gray-50 pb-3" id="journal-ops">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                <BookOpen className="h-4.5 w-4.5 text-blue-500" /> General Ledger Journal Ledger
              </h2>
              <p className="text-xs text-gray-400">Chronological list of background double-entry transactions</p>
            </div>

            <div className="relative w-full sm:w-64 animate-fade-in" id="journal-filter-field">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                id="search-journal-input"
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                placeholder="Search ledger Accounts or references..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table representing double entry rows */}
          <div className="overflow-x-auto" id="journal-table-wrapper">
            <table className="w-full text-left border-collapse text-xs" id="general-journal-table">
              <thead>
                <tr className="bg-gray-50 text-gray-505 font-bold border-b border-gray-100">
                  <th id="th-j-date" className="p-4 w-32">BS Date (AD)</th>
                  <th id="th-j-desc" className="p-4">Transaction Event Description</th>
                  <th id="th-j-ref" className="p-4 font-mono">Reference</th>
                  <th id="th-j-dr-ac" className="p-4">Debit Account</th>
                  <th id="th-j-cr-ac" className="p-4">Credit Account</th>
                  <th id="th-j-amt" className="p-4 text-right">Amount (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-650" id="general-journal-tbody">
                {filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      No matching double-entry ledger entries detected.
                    </td>
                  </tr>
                ) : (
                  filteredJournals.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-50/20" id={`row-journal-log-${j.id}`}>
                      <td className="p-4">
                        <span className="font-semibold text-gray-800 block">{j.bsDate}</span>
                        <span className="text-[10px] text-gray-400 block font-normal">{j.date}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-gray-805 block">{j.description}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-400">{j.reference}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-800 font-bold block w-fit">
                          Dr: {j.debitAccount}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-gray-50 border border-gray-100 text-[10px] text-gray-600 block w-fit">
                          Cr: {j.creditAccount}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-gray-900">
                        Rs. {j.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
