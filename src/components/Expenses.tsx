import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { 
  DollarSign, Plus, Eye, Calendar, Tag, CreditCard, HelpCircle, 
  Trash2, Filter, Receipt, ChevronRight, TrendingDown, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { formatBSDate, getTodayBS, getFiscalYear, FISCAL_YEAR_OPTIONS, NEP_MONTHS_EN, numberToWords } from '../utils/nepaliCalendar';

export const Expenses: React.FC = () => {
  const { expenses, submitExpense, currentUserRole, setExpenses, businessConfig } = useApp();

  // Search/Filters states
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterFiscalYear, setFilterFiscalYear] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Utilities');
  const [expenseMethod, setExpenseMethod] = useState<Expense['paymentMethod']>('Fonepay');
  const [expenseNotes, setExpenseNotes] = useState<string>('');
  
  // Modal toggle
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Printing states
  const [selectedExpenseForPrint, setSelectedExpenseForPrint] = useState<Expense | null>(null);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Group of Categories
  const CATEGORIES: Expense['category'][] = [
    'Rent', 'Salary', 'Utilities', 'Transportation', 'Marketing', 'Refreshment', 'Miscellaneous'
  ];

  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
    const matchesFY = filterFiscalYear === 'All' || getFiscalYear(exp.bsDate) === filterFiscalYear;
    const matchesMonth = filterMonth === 'All' || (() => {
      if (!exp.bsDate || !exp.bsDate.includes('-')) return false;
      const m = parseInt(exp.bsDate.split('-')[1]);
      return m === (NEP_MONTHS_EN.indexOf(filterMonth) + 1);
    })();
    return matchesCategory && matchesFY && matchesMonth;
  });

  const totalFilteredSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || expenseAmount <= 0) return;

    submitExpense({
      title: expenseTitle,
      amount: expenseAmount,
      category: expenseCategory,
      paymentMethod: expenseMethod,
      notes: expenseNotes || undefined
    });

    // Reset states
    setExpenseTitle('');
    setExpenseAmount(0);
    setExpenseCategory('Utilities');
    setExpenseMethod('Fonepay');
    setExpenseNotes('');
    setShowAddModal(false);
  };

  const deleteExpenseLog = (id: string) => {
    if (currentUserRole !== 'Owner') {
      toast.error('Permission Denied: Only owners can delete finalized expense entries.');
      return;
    }
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localStorage.setItem('sb_expenses', JSON.stringify(updated));
    toast.success('Expense entry voided successfully.');
  };

  const triggerPrintForElement = (elementId: string, titleName: string, orientation: 'portrait' | 'landscape' = 'portrait') => {
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
              size: A4 ${orientation};
              margin: 15mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                filter: grayscale(100%) !important;
                -webkit-filter: grayscale(100%) !important;
              }
              * {
                color: #000000 !important;
                text-shadow: none !important;
                box-shadow: none !important;
              }
              button, .no-print {
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
                try {
                  window.print();
                } catch(e) {
                  console.error(e);
                }
                setTimeout(function() {
                  window.frameElement.remove();
                }, 100);
              }, 300);
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
    <div className="space-y-6 max-w-7xl mx-auto" id="expenses-module-container">
      
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4" id="expenses-header">
        <div>
          <h1 className="text-xl font-semibold text-gray-900" id="expenses-title">Operating Workplace Expenses</h1>
          <p className="text-xs text-gray-500" id="expenses-desc">Log utility fiber internet invoices, grocery chiya snacks, rent payouts, and salary sheets</p>
        </div>

        <button
          id="btn-add-expense-modal"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <Plus className="h-4 w-4" /> Log Expense Voucher
        </button>
      </div>

      {/* Aggregate metrics box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="expenses-summary-cards">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xxs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Total Accumulated Spends</span>
          <span className="text-lg font-bold text-gray-900 block font-mono mt-1">Rs. {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Sum total registered in active term</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xxs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Filtered Spends Index</span>
          <span className="text-lg font-bold text-blue-700 block font-mono mt-1">Rs. {totalFilteredSum.toLocaleString()}</span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Allocations for selected categories</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xxs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Active Category Count</span>
          <span className="text-lg font-bold text-gray-900 block font-mono mt-1">
            {new Set(expenses.map(e => e.category)).size} Categories
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Representing different operational sectors</span>
        </div>
      </div>

      {/* Categories operations bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xxs" id="expenses-ops">
        <div className="flex flex-wrap items-center gap-4" id="expenses-category-picker">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-650">Sector Category Filter:</span>
            <select
              id="filter-expense-category-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg p-2 outline-none bg-white font-medium text-gray-700"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-650">Fiscal Year:</span>
            <select
              id="filter-expense-fy-select"
              value={filterFiscalYear}
              onChange={(e) => setFilterFiscalYear(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg p-2 outline-none bg-white font-extrabold text-gray-800"
            >
              {FISCAL_YEAR_OPTIONS.map(fy => (
                <option key={fy} value={fy}>{fy === 'All' ? 'All Fiscal Years' : `FY ${fy}`}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-650">Month:</span>
            <select
              id="filter-expense-month-select"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg p-2 outline-none bg-white font-extrabold text-gray-800"
            >
              <option value="All">All Months</option>
              {NEP_MONTHS_EN.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Log Table */}
      <div className="bg-white rounded-xl border border-gray-105 shadow-xxs overflow-hidden" id="expenses-table-card">
        <div className="overflow-x-auto" id="expenses-table-wrapper">
          <table className="w-full text-left border-collapse text-xs" id="expenses-roster-table">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <th id="th-exp-date" className="p-4">BS Date (AD)</th>
                <th id="th-exp-heading" className="p-4">Voucher Title Particulars</th>
                <th id="th-exp-cat" className="p-4">Sector Category</th>
                <th id="th-exp-meta" className="p-4">Payment Method</th>
                <th id="th-exp-amt" className="p-4 text-right">Debit out (Rs)</th>
                <th id="th-exp-actions" className="p-4 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600 animate-fade-in" id="expenses-roster-tbody">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 shadow-xxs">
                    No operating expense vouchers found matching filter category.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/20" id={`row-expense-log-${exp.id}`}>
                    <td className="p-4">
                      <span className="font-semibold text-gray-800 block">{exp.bsDate}</span>
                      <span className="text-[10px] text-gray-450 block font-normal">{exp.date}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-gray-900 block">{exp.title}</span>
                      {exp.notes && <span className="text-[10px] text-gray-400 block font-normal mt-0.5 italic">"{exp.notes}"</span>}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-150 text-[10px] text-gray-500 font-semibold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 text-blue-600 font-medium">
                      {exp.paymentMethod}
                    </td>
                    <td className="p-4 text-right font-mono font-black text-rose-600">
                      Rs. {exp.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" id={`manage-expense-grp-${exp.id}`}>
                        <button
                          id={`btn-print-expense-${exp.id}`}
                          onClick={() => {
                            setSelectedExpenseForPrint(exp);
                            setPrintOrientation('portrait');
                          }}
                          className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition"
                          title="Print Expense Voucher (खर्च भौचर)"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-delete-expense-${exp.id}`}
                          onClick={() => deleteExpenseLog(exp.id)}
                          disabled={currentUserRole !== 'Owner'}
                          className="p-1.5 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTER NEW VOUCHER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-log-expense">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-150 animate-fade-in" id="log-expense-inner">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-950 text-xs uppercase tracking-wider">Log Expense Voucher</span>
              <button 
                id="btn-close-expense-modal"
                onClick={() => setShowAddModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-3.5 text-xs animate-fade-in" id="log-expense-form">
              <div className="space-y-1">
                <label className="text-gray-600 block">Voucher Title Particular *</label>
                <input
                  type="text"
                  id="input-expense-title"
                  required
                  placeholder="e.g. Subisu fiber wifi bill"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3" id="expense-financial-col">
                <div className="space-y-1">
                  <label className="text-gray-600 block font-semibold text-rose-600">Amount (Rs) *</label>
                  <input
                    type="number"
                    id="input-expense-amt"
                    required
                    min="1"
                    placeholder="Enter value"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500 font-extrabold text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-600 block">Category sector *</label>
                  <select
                    id="select-expense-category"
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full border border-gray-200 rounded-lg p-2 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Payout Channel *</label>
                <select
                  id="select-expense-method"
                  value={expenseMethod}
                  onChange={(e) => setExpenseMethod(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg p-2 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Cash">Cash Hand</option>
                  <option value="Fonepay">Instant Fonepay</option>
                  <option value="Bank Transfer">Bank Mobile Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Auditing Notes / Particulars</label>
                <input
                  type="text"
                  id="input-expense-notes"
                  placeholder="e.g. Paid to cashier Ram Lal"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                id="btn-confirm-save-expense"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition active:scale-97"
              >
                Log Operational spend
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEPAL EXPENSE VOUCHER (खर्च भौचर) PRINT HUB */}
      {selectedExpenseForPrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="modal-expense-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-4 border text-left" id="expense-print-container">
            
            {/* Action Bar */}
            <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-3" id="expense-print-action-bar">
              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Nepal Expense Payment Voucher (खर्च भौचर)</h3>
                <p className="text-[10px] text-gray-450 font-medium">Standardized payment dispatch voucher for Nepalese auditing compliance</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500">Orientation:</span>
                <button 
                  onClick={() => setPrintOrientation('portrait')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md border transition ${
                    printOrientation === 'portrait' 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                      : 'bg-white text-gray-700 border-gray-250 hover:bg-gray-50'
                  }`}
                >
                  Portrait (ठाडो) - Best
                </button>
                <button 
                  onClick={() => setPrintOrientation('landscape')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md border transition ${
                    printOrientation === 'landscape' 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                      : 'bg-white text-gray-700 border-gray-250 hover:bg-gray-50'
                  }`}
                >
                  Landscape (तेर्सो)
                </button>
                <button
                  id="btn-trigger-expense-print"
                  onClick={() => triggerPrintForElement('expense-voucher-print-content', 'Expense Voucher', printOrientation)}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Voucher
                </button>
                <button 
                  onClick={() => setSelectedExpenseForPrint(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs px-2"
                >
                  Close ✕
                </button>
              </div>
            </div>

            {/* Print Sheet Area */}
            <div className="bg-gray-50 border p-4 rounded-xl max-h-[60vh] overflow-y-auto" id="expense-preview-viewport">
              <div 
                id="expense-voucher-print-content" 
                className="bg-white border p-6 mx-auto shadow-sm text-gray-900 text-xs leading-relaxed" 
                style={{ width: '100%', maxWidth: printOrientation === 'portrait' ? '650px' : '100%', minHeight: '400px' }}
              >
                
                {/* Header Information */}
                <div className="text-center space-y-1.5 border-b-2 border-double border-gray-800 pb-3" id="exp-sheet-header">
                  {businessConfig.logo && (
                    <img src={businessConfig.logo} alt="Company Logo" className="h-10 mx-auto object-contain mb-1" referrerPolicy="no-referrer" />
                  )}
                  <h1 className="text-sm font-black text-gray-950 uppercase">{businessConfig.nepaliName || businessConfig.name}</h1>
                  <p className="text-[10px] text-gray-500 font-semibold">{businessConfig.address}</p>
                  <p className="text-[10px] text-gray-500 font-mono">फोन नं: {businessConfig.phone} | PAN/VAT No: {businessConfig.panVat || 'N/A'}</p>
                  
                  <div className="pt-2">
                    <span className="inline-block px-4 py-1 border border-gray-900 text-[11px] font-black tracking-widest uppercase rounded">
                      खर्च भुक्तानी भौचर (EXPENSE PAYMENT VOUCHER)
                    </span>
                  </div>
                </div>

                {/* Meta Rows */}
                <div className="grid grid-cols-2 justify-between items-center text-[10px] py-3 font-semibold border-b border-gray-200" id="exp-sheet-meta">
                  <div className="space-y-1 text-left">
                    <p><span className="text-gray-500">भौचर नं. (Voucher No):</span> <span className="font-mono font-bold text-gray-900">EXP-{selectedExpenseForPrint.id.slice(0, 8).toUpperCase()}</span></p>
                    <p><span className="text-gray-500">आन्तरिक संकेत (ID):</span> <span className="font-mono text-gray-800">{selectedExpenseForPrint.id}</span></p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p><span className="text-gray-500">मिति (BS Date):</span> <span className="font-mono text-gray-900">{selectedExpenseForPrint.bsDate}</span></p>
                    <p><span className="text-gray-500">मिति (AD Date):</span> <span className="font-mono text-gray-900">{selectedExpenseForPrint.date}</span></p>
                  </div>
                </div>

                {/* Main Payment Details Form */}
                <div className="mt-4 border border-gray-800 rounded-lg p-4 space-y-3.5 text-[10px]" id="exp-body-details">
                  <div className="flex border-b border-gray-200 pb-2">
                    <span className="w-48 text-gray-500 font-extrabold uppercase">भुक्तानी विधि (Payment Mode):</span>
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{selectedExpenseForPrint.paymentMethod}</span>
                  </div>

                  <div className="flex border-b border-gray-200 pb-2">
                    <span className="w-48 text-gray-500 font-extrabold uppercase">खर्च शीर्षक (Sector Heading):</span>
                    <span className="font-bold text-gray-900">{selectedExpenseForPrint.category} (परिचालन शीर्षक)</span>
                  </div>

                  <div className="flex border-b border-gray-200 pb-2">
                    <span className="w-48 text-gray-500 font-extrabold uppercase">विवरण विवरण (Particulars Description):</span>
                    <span className="font-bold text-gray-900">{selectedExpenseForPrint.title}</span>
                  </div>

                  {selectedExpenseForPrint.notes && (
                    <div className="flex border-b border-gray-200 pb-2">
                      <span className="w-48 text-gray-500 font-extrabold uppercase">विशेष कैफियत (Auditing Notes):</span>
                      <span className="italic text-gray-650">"{selectedExpenseForPrint.notes}"</span>
                    </div>
                  )}

                  <div className="flex items-center pt-2 text-xs">
                    <span className="w-48 text-gray-500 font-extrabold uppercase">कुल भुक्तानी रकम (Debit Total Amount):</span>
                    <span className="font-mono font-black text-rose-600 text-sm bg-rose-50 px-3 py-1 rounded border border-rose-100">
                      Rs. {selectedExpenseForPrint.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Amount in words */}
                <div className="mt-4 p-2 bg-gray-50 border border-dashed rounded font-mono text-[9px] text-gray-600" id="exp-amount-words">
                  <span className="font-extrabold uppercase text-gray-550 block">अक्षरेपी (Amount in words):</span>
                  <span className="text-gray-900 font-bold block mt-0.5">{numberToWords(selectedExpenseForPrint.amount)}</span>
                </div>

                {/* Sign-off signatures block */}
                <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-dashed text-[9px] text-center font-bold text-gray-600" id="exp-signatures">
                  <div className="space-y-6">
                    <div className="h-6"></div>
                    <p className="border-t border-gray-400 pt-1.5">पेश गर्ने<br/><span className="text-[8px] font-normal text-gray-400">Prepared / Logged By</span></p>
                  </div>
                  <div className="space-y-6">
                    <div className="h-6"></div>
                    <p className="border-t border-gray-400 pt-1.5">स्वीकृत गर्ने<br/><span className="text-[8px] font-normal text-gray-400">Authorized / Approved By</span></p>
                  </div>
                  <div className="space-y-6">
                    <div className="h-6"></div>
                    <p className="border-t border-gray-400 pt-1.5">बुझिलिने<br/><span className="text-[8px] font-normal text-gray-400">Recipient / Paid To Sign</span></p>
                  </div>
                </div>

              </div>
            </div>

            {/* Hint box */}
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] text-blue-800 flex items-center gap-1.5 font-medium leading-relaxed" id="exp-print-help">
              <span>💡 Operating receipts and cash expense vouchers are printed in <strong>Portrait</strong> to match internal audit registry files in standard filing cabinets.</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
