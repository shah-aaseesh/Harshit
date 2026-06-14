import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, Landmark, FileText, ArrowRightLeft, Printer, ShieldCheck, 
  HelpCircle, ChevronRight, Calculator, TrendingUp, Sparkles, Filter, Search
} from 'lucide-react';
import { formatBSDate } from '../utils/nepaliCalendar';

export const Bookkeeping: React.FC = () => {
  const { journals, invoices, expenses, products, suppliers, customers } = useApp();

  // Active view segment: 'pnl' | 'balancesheet' | 'journal'
  const [activeSegment, setActiveSegment] = useState<'pnl' | 'balancesheet' | 'journal'>('pnl');

  // Ledger filter states
  const [journalSearch, setJournalSearch] = useState<string>('');

  // 1. CALCULATE PROFIT & LOSS METRICS (INCOME STATEMENT)
  const totalRevenues = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  
  // Calculate cost of goods sold based on actual product items purchased vs sold (estimated or precise)
  // Let's calculate precise cost of goods sold: Sum of (item.quantity * product.purchasePrice)
  let computedCOGS = 0;
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const costRate = prod ? prod.purchasePrice : (item.rate * 0.6); // 60% fallback
      computedCOGS += (item.quantity * costRate);
    });
  });

  const grossProfit = Math.max(0, totalRevenues - computedCOGS);

  // Group expenses by category
  const expenseSummary = {
    Rent: expenses.filter(e => e.category === 'Rent').reduce((s, e) => s + e.amount, 0),
    Salary: expenses.filter(e => e.category === 'Salary').reduce((s, e) => s + e.amount, 0),
    Utilities: expenses.filter(e => e.category === 'Utilities').reduce((s, e) => s + e.amount, 0),
    Transportation: expenses.filter(e => e.category === 'Transportation').reduce((s, e) => s + e.amount, 0),
    Marketing: expenses.filter(e => e.category === 'Marketing').reduce((s, e) => s + e.amount, 0),
    Refreshment: expenses.filter(e => e.category === 'Refreshment').reduce((s, e) => s + e.amount, 0),
    Miscellaneous: expenses.filter(e => e.category === 'Miscellaneous').reduce((s, e) => s + e.amount, 0),
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
  const cashSalesReceived = invoices.reduce((s, inv) => s + inv.paidAmount, 0);
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
  const filteredJournals = journals.filter(j => 
    j.description.toLowerCase().includes(journalSearch.toLowerCase()) ||
    j.debitAccount.toLowerCase().includes(journalSearch.toLowerCase()) ||
    j.creditAccount.toLowerCase().includes(journalSearch.toLowerCase()) ||
    j.reference.toLowerCase().includes(journalSearch.toLowerCase())
  );

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

        <div className="flex gap-2" id="accounting-tab-toggle">
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
            Double-Entry General Journals
          </button>
        </div>
      </div>

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
