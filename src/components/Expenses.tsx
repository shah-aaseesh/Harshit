import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { 
  DollarSign, Plus, Eye, Calendar, Tag, CreditCard, HelpCircle, 
  Trash2, Filter, Receipt, ChevronRight, TrendingDown
} from 'lucide-react';
import { formatBSDate, getTodayBS, getFiscalYear, FISCAL_YEAR_OPTIONS } from '../utils/nepaliCalendar';

export const Expenses: React.FC = () => {
  const { expenses, submitExpense, currentUserRole, setExpenses } = useApp();

  // Search/Filters states
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterFiscalYear, setFilterFiscalYear] = useState<string>('All');
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Utilities');
  const [expenseMethod, setExpenseMethod] = useState<Expense['paymentMethod']>('Fonepay');
  const [expenseNotes, setExpenseNotes] = useState<string>('');
  
  // Modal toggle
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Group of Categories
  const CATEGORIES: Expense['category'][] = [
    'Rent', 'Salary', 'Utilities', 'Transportation', 'Marketing', 'Refreshment', 'Miscellaneous'
  ];

  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
    const matchesFY = filterFiscalYear === 'All' || getFiscalYear(exp.bsDate) === filterFiscalYear;
    return matchesCategory && matchesFY;
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
      alert("Permission Denied: Only owners can delete finalized expense entries.");
      return;
    }
    if (confirm("Are you sure you want to void this expense voucher? This does not automatically reverse old bank reconciliations.")) {
      const updated = expenses.filter(e => e.id !== id);
      setExpenses(updated);
      localStorage.setItem('sb_expenses', JSON.stringify(updated));
    }
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
                      <button
                        id={`btn-delete-expense-${exp.id}`}
                        onClick={() => deleteExpenseLog(exp.id)}
                        disabled={currentUserRole !== 'Owner'}
                        className="p-1.5 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
    </div>
  );
};
