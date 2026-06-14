import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, Supplier } from '../types';
import { 
  Users, UserPlus, Phone, MapPin, Hash, Plus, DollarSign, HandCoins, 
  Search, ShieldAlert, Award, FileSpreadsheet, ArrowLeftRight, CheckCircle, Info
} from 'lucide-react';
import { getTodayBS } from '../utils/nepaliCalendar';

export const CustomerContacts: React.FC = () => {
  const { 
    customers, suppliers, submitCustomer, submitSupplier, 
    setCustomers, setSuppliers, journals, setJournals, currentUserRole 
  } = useApp();

  // Selected Sibling Tab: 'customers' | 'suppliers' | 'all'
  const [activeSegment, setActiveSegment] = useState<'customers' | 'suppliers' | 'all'>('customers');
  const [settleEntityType, setSettleEntityType] = useState<'customer' | 'supplier'>('customer');
  
  // Search parameters
  const [query, setQuery] = useState<string>('');

  // Settle Outstanding debt modal state
  const [showSettleModal, setShowSettleModal] = useState<boolean>(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<'Cash' | 'Fonepay' | 'Bank Transfer'>('Cash');
  const [settleNotes, setSettleNotes] = useState<string>('Dues installment cleared');

  // Customer Add form states
  const [showAddCustModal, setShowAddCustModal] = useState<boolean>(false);
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [custAddr, setCustAddr] = useState<string>('');
  const [custVat, setCustVat] = useState<string>('');
  const [custNotes, setCustNotes] = useState<string>('');

  // Supplier Add form states
  const [showAddSuppModal, setShowAddSuppModal] = useState<boolean>(false);
  const [suppName, setSuppName] = useState<string>('');
  const [suppPhone, setSuppPhone] = useState<string>('');
  const [suppAddr, setSuppAddr] = useState<string>('');
  const [suppVat, setSuppVat] = useState<string>('');
  const [suppPerson, setSuppPerson] = useState<string>('');

  // Search filter implementations
  const filteredCustomers = customers.filter(c => 
    c.id !== 'walk-in' && (
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query) ||
      (c.address && c.address.toLowerCase().includes(query.toLowerCase()))
    )
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.phone.includes(query) ||
    (s.contactPerson && s.contactPerson.toLowerCase().includes(query.toLowerCase()))
  );

  // Global aggregate variables
  const globalReceivables = customers.reduce((s, c) => s + c.outstandingDue, 0);
  const globalPayables = suppliers.reduce((s, c) => s + c.outstandingDue, 0);

  // Quick Customer dispatch submit
  const handleAddCustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) return;

    submitCustomer({
      name: custName,
      phone: custPhone,
      address: custAddr || undefined,
      panVat: custVat || undefined,
      notes: custNotes || undefined
    });

    setCustName('');
    setCustPhone('');
    setCustAddr('');
    setCustVat('');
    setCustNotes('');
    setShowAddCustModal(false);
  };

  // Quick Supplier dispatch submit
  const handleAddSuppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppName.trim() || !suppPhone.trim()) return;

    submitSupplier({
      name: suppName,
      phone: suppPhone,
      address: suppAddr || undefined,
      panVat: suppVat || undefined,
      contactPerson: suppPerson || undefined
    });

    setSuppName('');
    setSuppPhone('');
    setSuppAddr('');
    setSuppVat('');
    setSuppPerson('');
    setShowAddSuppModal(false);
  };

  /**
   * Outstanding dues receipt log handler (Automatic double-entry syncs in backend)
   */
  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (settleAmount <= 0) return;

    const adDate = new Date().toISOString().split('T')[0];
    const bsDateStr = getTodayBS();

    if (settleEntityType === 'customer') {
      const clientObj = customers.find(c => c.id === selectedEntityId);
      if (!clientObj) return;

      const updatedDues = Math.max(0, clientObj.outstandingDue - settleAmount);

      // 1. Update Customer outstanding state arrays
      const updatedCustomers = customers.map(c => {
        if (c.id === selectedEntityId) {
          return {
            ...c,
            totalPaid: c.totalPaid + settleAmount,
            outstandingDue: updatedDues
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      localStorage.setItem('sb_customers', JSON.stringify(updatedCustomers));

      // 2. Journal double entry: Debit Cash/Bank accounts, Credit accounts receivable
      const newJournals = [...journals];
      newJournals.unshift({
        id: `journal-settle-${Date.now()}`,
        date: adDate,
        bsDate: bsDateStr,
        description: `Customer dues collected: Receipt from ${clientObj.name} of Rs. ${settleAmount} (${settleMethod})`,
        reference: `REC-${clientObj.id.slice(-4).toUpperCase()}`,
        debitAccount: settleMethod === 'Cash' ? "Cash / Fonepay Receivables" : "Cash / Bank Accounts",
        creditAccount: "Accounts Receivable (Customers)",
        amount: settleAmount
      });
      setJournals(newJournals);
      localStorage.setItem('sb_journals', JSON.stringify(newJournals));

      alert(`Outstanding payment receipt of Rs. ${settleAmount.toLocaleString()} recorded for client ${clientObj.name}. Dues reduced to Rs. ${updatedDues.toLocaleString()}`);
    } else {
      // suppliers settlement
      const supplierObj = suppliers.find(s => s.id === selectedEntityId);
      if (!supplierObj) return;

      const updatedDues = Math.max(0, supplierObj.outstandingDue - settleAmount);

      // 1. Update Supplier dues state
      const updatedSuppliers = suppliers.map(s => {
        if (s.id === selectedEntityId) {
          return {
            ...s,
            totalPaid: s.totalPaid + settleAmount,
            outstandingDue: updatedDues
          };
        }
        return s;
      });
      setSuppliers(updatedSuppliers);
      localStorage.setItem('sb_suppliers', JSON.stringify(updatedSuppliers));

      // 2. Journal entry debit AP credit Cash/Bank
      const newJournals = [...journals];
      newJournals.unshift({
        id: `journal-settle-${Date.now()}`,
        date: adDate,
        bsDate: bsDateStr,
        description: `Supplier liability cleared: Pay out to ${supplierObj.name} of Rs. ${settleAmount} (${settleMethod})`,
        reference: `PAY-${supplierObj.id.slice(-4).toUpperCase()}`,
        debitAccount: "Accounts Payable (Suppliers)",
        creditAccount: "Cash / Bank Accounts",
        amount: settleAmount
      });
      setJournals(newJournals);
      localStorage.setItem('sb_journals', JSON.stringify(newJournals));

      alert(`Cleared payable of Rs. ${settleAmount.toLocaleString()} to ${supplierObj.name}. Outstanding liability reduced to Rs. ${updatedDues.toLocaleString()}`);
    }

    setShowSettleModal(false);
    setSettleAmount(0);
  };

  // Combine customers and suppliers into a unified parties summary array
  const combinedParties = [
    ...customers
      .filter(c => c.id !== 'walk-in')
      .map(c => ({
        ...c,
        partyType: 'customer' as const,
        roleLabel: 'Retail Customer (Client)',
        totalVolumeLabel: 'Total Purchases',
        totalVolume: c.totalPurchases,
        duesLabel: 'Receivable Due',
        dueColorClass: 'text-rose-650',
        dueAmtColorClass: 'text-rose-600',
        cardBorderClass: c.outstandingDue > 0 ? 'border-rose-100/80 bg-rose-50/10' : 'border-gray-100',
        settleBtnColorClass: 'bg-emerald-600 hover:bg-emerald-700',
        settleBtnText: 'Settle Receipt'
      })),
    ...suppliers.map(s => ({
      ...s,
      partyType: 'supplier' as const,
      roleLabel: 'Agro Supplier (Payable)',
      totalVolumeLabel: 'Total Purchased',
      totalVolume: s.totalPurchased,
      duesLabel: 'We Owe Due',
      dueColorClass: 'text-amber-650',
      dueAmtColorClass: 'text-amber-600',
      cardBorderClass: s.outstandingDue > 0 ? 'border-amber-100/85 bg-amber-50/10' : 'border-gray-100',
      settleBtnColorClass: 'bg-amber-600 hover:bg-amber-700',
      settleBtnText: 'Post Settlement Pay'
    }))
  ].filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.phone.includes(query) ||
    (p.address && p.address.toLowerCase().includes(query.toLowerCase())) ||
    (p.partyType === 'supplier' && p.contactPerson && p.contactPerson.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="contacts-module-container">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4" id="contacts-header">
        <div>
          <h1 className="text-xl font-semibold text-gray-900" id="contacts-title">Ledger Accounts Directory</h1>
          <p className="text-xs text-gray-500" id="contacts-desc">Manage credit statements, supplier liabilities, and register dues clearance receipts</p>
        </div>

        <div className="flex gap-2" id="contacts-view-toggle">
          <button
            id="btn-active-segment-customers"
            onClick={() => {
              setActiveSegment('customers');
              setQuery('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSegment === 'customers' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            Manage Clients (Receivables)
          </button>
          <button
            id="btn-active-segment-suppliers"
            onClick={() => {
              setActiveSegment('suppliers');
              setQuery('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSegment === 'suppliers' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            Manage Suppliers (Payables)
          </button>
          <button
            id="btn-active-segment-all"
            onClick={() => {
              setActiveSegment('all');
              setQuery('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSegment === 'all' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            All Parties Summary
          </button>
        </div>
      </div>

      {/* Dues highlights aggregation widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="contacts-aggregation-widgets-grid">
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between" id="outstanding-receivables-widget-card">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Total Outstanding Trade Receivables</span>
            <span className="text-xl font-black text-rose-600 block font-mono mt-1">Rs. {globalReceivables.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Sum credit pending collection from retail clients</span>
          </div>
          <Award className="h-10 w-10 text-rose-500 bg-rose-50 p-2 rounded-full" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between" id="outstanding-payables-widget-card">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Total Outstanding Commercial Liabilities</span>
            <span className="text-xl font-black text-amber-600 block font-mono mt-1">Rs. {globalPayables.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Liabilities to settle back to agro suppliers</span>
          </div>
          <ArrowLeftRight className="h-10 w-10 text-amber-500 bg-amber-50 p-2 rounded-full" />
        </div>
      </div>

      {/* Searching row */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xxs" id="contacts-operations-row">
        <div className="relative flex-1" id="contacts-search-field">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            id="search-contacts-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              activeSegment === 'customers' 
                ? 'Search clients directory by phone tags, addresses, or registration metadata...' 
                : activeSegment === 'suppliers'
                ? 'Search agricultural suppliers by coordinator names, phones, or offices...'
                : 'Search all ledger parties (clients & suppliers) by names, contact channels, or offices...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none animate-fade-in"
          />
        </div>

        {activeSegment !== 'all' ? (
          <button
            id={activeSegment === 'customers' ? "btn-trigger-add-cust-modal" : "btn-trigger-add-supp-modal"}
            onClick={() => {
              if (activeSegment === 'customers') {
                setShowAddCustModal(true);
              } else {
                setShowAddSuppModal(true);
              }
            }}
            className="px-4 py-2 bg-blue-650 hover:bg-blue-750 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition active:scale-97 bg-blue-600"
          >
            <UserPlus className="h-4 w-4" /> 
            {activeSegment === 'customers' ? 'Configure New Client' : 'Configure New Supplier'}
          </button>
        ) : (
          <div className="flex gap-2" id="all-segment-add-buttons">
            <button
              id="all-add-client-btn"
              onClick={() => setShowAddCustModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition active:scale-97"
            >
              <UserPlus className="h-4 w-4" /> 
              + Client
            </button>
            <button
              id="all-add-supplier-btn"
              onClick={() => setShowAddSuppModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-750 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition active:scale-97"
            >
              <UserPlus className="h-4 w-4" /> 
              + Supplier
            </button>
          </div>
        )}
      </div>

      {/* Grid records displaying card units */}
      {activeSegment === 'customers' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="customers-list-cards-grid">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-2 text-center py-10 bg-white border rounded-xl" id="empty-customers-directory">
              <span className="text-gray-450 block text-xs">No client profiles found corresponding to selection.</span>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const hasDue = cust.outstandingDue > 0;
              return (
                <div 
                  key={cust.id} 
                  id={`cust-card-${cust.id}`}
                  className={`bg-white p-4 rounded-xl border flex flex-col justify-between shadow-xxs hover:shadow-xs transition duration-200 ${
                    hasDue ? 'border-rose-100/80 bg-rose-50/10' : 'border-gray-100'
                  }`}
                >
                  <div className="space-y-2.5" id="customer-card-header">
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <h3 className="font-extrabold text-xs text-gray-900">{cust.name}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-sans leading-none flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 inline text-gray-450" /> {cust.address || 'Address unconfigured'}
                        </p>
                      </div>

                      {hasDue && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md animate-pulse">
                          Credit Due
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-gray-50 pt-2 text-gray-550" id="customer-card-metrics">
                      <div>
                        <span className="text-gray-400 block pb-0.5">Phone Call</span>
                        <span className="font-semibold text-gray-800 flex items-center gap-0.5"><Phone className="h-3 w-3 inline text-gray-400" /> {cust.phone}</span>
                      </div>
                      
                      {cust.panVat && (
                        <div>
                          <span className="text-gray-400 block pb-0.5">PAN Index</span>
                          <span className="font-mono text-gray-800 flex items-center gap-0.5"><Hash className="h-3 w-3 inline text-gray-400" /> {cust.panVat}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] bg-gray-50 p-2 rounded-lg border border-gray-100 text-center" id="customer-card-financial-grids">
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-tight">Total Volume</span>
                        <span className="font-bold text-gray-950 block mt-0.5">Rs. {cust.totalPurchases.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-tight">Cleared Sum</span>
                        <span className="font-bold text-gray-950 block mt-0.5">Rs. {cust.totalPaid.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-rose-650 block text-[9px] uppercase font-semibold tracking-tight">Balance Due</span>
                        <span className="font-bold text-rose-600 block mt-0.5">Rs. {cust.outstandingDue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for settlements */}
                  {hasDue && (
                    <div className="border-t border-gray-100 pt-3 mt-3 flex justify-end" id="customer-card-actions-wrapper">
                      <button
                        id={`btn-settle-cust-${cust.id}`}
                        onClick={() => {
                          setSelectedEntityId(cust.id);
                          setSettleEntityType('customer');
                          setSettleAmount(cust.outstandingDue);
                          setShowSettleModal(true);
                        }}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition rounded-lg text-white font-semibold text-[10px] flex items-center gap-1.5"
                      >
                        <HandCoins className="h-3.5 w-3.5" /> Settle Credit Payment (Receipt)
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : activeSegment === 'suppliers' ? (
        /* SUPPLIERS CARD SECTION */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="suppliers-list-cards-grid">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-2 text-center py-10 bg-white border rounded-xl" id="empty-suppliers-directory">
              <span className="text-gray-450 block text-xs">No agricultural supply entities detected matching selection.</span>
            </div>
          ) : (
            filteredSuppliers.map((supp) => {
              const hasDue = supp.outstandingDue > 0;
              return (
                <div 
                  key={supp.id} 
                  id={`supp-card-${supp.id}`}
                  className={`bg-white p-4 rounded-xl border flex flex-col justify-between shadow-xxs hover:shadow-xs transition duration-200 ${
                    hasDue ? 'border-amber-100/85 bg-amber-50/10' : 'border-gray-100'
                  }`}
                >
                  <div className="space-y-2.5" id="supplier-card-header">
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <h3 className="font-extrabold text-xs text-gray-900">{supp.name}</h3>
                        {supp.contactPerson && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">Coordinator: <strong className="text-gray-700 font-semibold">{supp.contactPerson}</strong></span>
                        )}
                      </div>

                      {hasDue && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-805 text-[10px] font-bold rounded-md animate-pulse">
                          Payable Out
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-gray-50 pt-2 text-gray-550" id="supplier-card-metrics">
                      <div>
                        <span className="text-gray-400 block pb-0.5">Farms Phone</span>
                        <span className="font-semibold text-gray-800 block">{supp.phone}</span>
                      </div>
                      
                      {supp.address && (
                        <div>
                          <span className="text-gray-400 block pb-0.5">Agronomy Office</span>
                          <span className="font-semibold text-gray-800 block truncate">{supp.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] bg-gray-50 p-2 rounded-lg border border-gray-100 text-center" id="supplier-card-financial-grids">
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-tight">Purchased</span>
                        <span className="font-bold text-gray-950 block mt-0.5">Rs. {supp.totalPurchased.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-tight">Paid Back</span>
                        <span className="font-bold text-gray-950 block mt-0.5">Rs. {supp.totalPaid.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-amber-650 block text-[9px] uppercase font-semibold tracking-tight">We Owe Due</span>
                        <span className="font-bold text-amber-600 block mt-0.5">Rs. {supp.outstandingDue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Settlements payout trigger */}
                  {hasDue && currentUserRole === 'Owner' && (
                    <div className="border-t border-gray-100 pt-3 mt-3 flex justify-end" id="supplier-card-actions-wrapper">
                      <button
                        id={`btn-settle-supp-${supp.id}`}
                        onClick={() => {
                          setSelectedEntityId(supp.id);
                          setSettleEntityType('supplier');
                          setSettleAmount(supp.outstandingDue);
                          setShowSettleModal(true);
                        }}
                        className="py-1.5 px-3 bg-amber-600 hover:bg-amber-750 active:scale-95 transition rounded-lg text-white font-semibold text-[10px] flex items-center gap-1.5"
                      >
                        <HandCoins className="h-3.5 w-3.5" /> Post Settlement payout
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* CONSOLIDATED ALL PARTIES SECTION */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="all-parties-cards-grid">
          {combinedParties.length === 0 ? (
            <div className="col-span-2 text-center py-10 bg-white border rounded-xl" id="empty-all-parties-directory">
              <span className="text-gray-455 block text-xs">No client or agricultural supplier profiles correspond to search query.</span>
            </div>
          ) : (
            combinedParties.map((party) => {
              const hasDue = party.outstandingDue > 0;
              return (
                <div 
                  key={`${party.partyType}-${party.id}`} 
                  id={`party-card-${party.partyType}-${party.id}`}
                  className={`bg-white p-4 rounded-xl border flex flex-col justify-between shadow-xxs hover:shadow-xs transition duration-200 ${party.cardBorderClass}`}
                >
                  <div className="space-y-2.5" id="party-card-header">
                    <div className="flex justify-between items-start gap-1 w-full">
                      <div className="space-y-0.5 select-none">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-xs text-gray-900">{party.name}</h3>
                          <span className={`px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded-full ${
                            party.partyType === 'customer' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {party.partyType === 'customer' ? 'Customer' : 'Supplier'}
                          </span>
                        </div>
                        {party.partyType === 'supplier' && party.contactPerson && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">Coordinator: <strong className="text-gray-705 font-semibold">{party.contactPerson}</strong></span>
                        )}
                        {party.address && (
                          <p className="text-[10px] text-gray-400 mt-0.5 font-sans leading-none flex items-center gap-0.5">
                            <MapPin className="h-3 w-3 inline text-gray-450" /> {party.address}
                          </p>
                        )}
                      </div>

                      {hasDue && (
                        <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold rounded-md animate-pulse shrink-0 ${
                          party.partyType === 'customer' 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {party.partyType === 'customer' ? 'Receivable' : 'Payable'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-gray-50 pt-2 text-gray-550" id="party-card-metrics">
                      <div>
                        <span className="text-gray-400 block pb-0.5">Contact</span>
                        <span className="font-semibold text-gray-800 flex items-center gap-0.5 font-mono"><Phone className="h-3 w-3 inline text-gray-400" /> {party.phone}</span>
                      </div>
                      
                      {party.panVat && (
                        <div>
                          <span className="text-gray-400 block pb-0.5">PAN / VAT</span>
                          <span className="font-mono text-gray-800 flex items-center gap-0.5"><Hash className="h-3 w-3 inline text-gray-400" /> {party.panVat}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] bg-gray-50 p-1.5 rounded-lg border border-gray-100 text-center" id="party-card-financial-grids">
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-tight">{party.totalVolumeLabel}</span>
                        <span className="font-bold text-gray-950 block mt-0.5 font-mono">Rs. {party.totalVolume.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-tight">Total Settled</span>
                        <span className="font-bold text-gray-950 block mt-0.5 font-mono">Rs. {party.totalPaid.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className={`${party.dueColorClass} block text-[9px] uppercase font-semibold tracking-tight`}>{party.duesLabel}</span>
                        <span className={`font-bold block mt-0.5 font-mono ${party.dueAmtColorClass}`}>Rs. {party.outstandingDue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for settlements */}
                  {hasDue && (
                    <div className="border-t border-gray-100 pt-3 mt-3 flex justify-end" id="party-card-actions-wrapper">
                      <button
                        id={`btn-settle-${party.partyType}-${party.id}`}
                        onClick={() => {
                          setSelectedEntityId(party.id);
                          setSettleEntityType(party.partyType);
                          setSettleAmount(party.outstandingDue);
                          setShowSettleModal(true);
                        }}
                        className={`py-1.5 px-3 active:scale-95 transition rounded-lg text-white font-semibold text-[10px] flex items-center gap-1.5 ${party.settleBtnColorClass}`}
                      >
                        <HandCoins className="h-3.5 w-3.5" /> {party.settleBtnText}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: DUESS SETTLEMENT PAYMENT PROCESSOR */}
      {showSettleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-settlement">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-150" id="settlement-inner">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-950 text-xs uppercase tracking-tight">
                {settleEntityType === 'customer' ? 'Receive Outstanding Credit Receipt' : 'Record Direct Payout settlement'}
              </span>
              <button 
                id="btn-close-settle-modal"
                onClick={() => setShowSettleModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600" id="settle-dialog-meta">
              <span className="text-gray-400 block">Settle Outstanding with Entity:</span>
              <strong className="text-gray-900 block text-xs">
                {settleEntityType === 'customer' 
                  ? customers.find(c => c.id === selectedEntityId)?.name 
                  : suppliers.find(s => s.id === selectedEntityId)?.name}
              </strong>
              <span className="text-gray-450 block mt-1">Remaining Statement Due carrying in records: <strong className="text-rose-600 font-bold font-mono">
                Rs. {settleEntityType === 'customer' 
                  ? customers.find(c => c.id === selectedEntityId)?.outstandingDue.toLocaleString()
                  : suppliers.find(s => s.id === selectedEntityId)?.outstandingDue.toLocaleString()}
              </strong></span>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-3.5 text-xs" id="settle-form">
              <div className="space-y-1">
                <label className="text-gray-600 block">Clear Sum Amount (Rs) *</label>
                <input
                  type="number"
                  id="input-settle-amt"
                  required
                  min="1"
                  max={
                    settleEntityType === 'customer'
                      ? (customers.find(c => c.id === selectedEntityId)?.outstandingDue || 999999)
                      : (suppliers.find(s => s.id === selectedEntityId)?.outstandingDue || 999999)
                  }
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500 font-extrabold text-blue-700 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Transactional Settle Channel *</label>
                <select
                  id="select-settle-method"
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg p-2 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Cash">Cash Transfer</option>
                  <option value="Fonepay">Instant Fonepay QR Pay</option>
                  <option value="Bank Transfer">Bank Mobile Deposit</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Auditing Reference Notes</label>
                <input
                  type="text"
                  id="input-settle-notes"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                id="btn-confirm-settlement"
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
              >
                Sync with bookkeeping Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOMER */}
      {showAddCustModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-add-customer-direct">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border" id="add-cust-inner">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold text-gray-900 text-xs">Register Commercial Customer Profile</span>
              <button id="btn-close-cust-direct-modal" onClick={() => setShowAddCustModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAddCustSubmit} className="space-y-3 text-xs" id="cust-direct-form">
              <div className="space-y-1">
                <label className="text-gray-650 block">Full Name *</label>
                <input
                  type="text"
                  id="input-direct-cust-name"
                  required
                  placeholder="e.g. Dayahang Rai"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Phone Number *</label>
                <input
                  type="text"
                  id="input-direct-cust-phone"
                  required
                  placeholder="e.g. 98510XXXXX"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Address</label>
                <input
                  type="text"
                  id="input-direct-cust-addr"
                  placeholder="e.g. Baneshwor, KTM"
                  value={custAddr}
                  onChange={(e) => setCustAddr(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-655 block">PAN / VAT Reg ID</label>
                <input
                  type="text"
                  id="input-direct-cust-pan"
                  value={custVat}
                  onChange={(e) => setCustVat(e.target.value)}
                  placeholder="9 digit code"
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                id="btn-confirm-save-cust"
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                Save Client Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {showAddSuppModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-add-supplier-direct">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border" id="add-supp-inner">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold text-gray-900 text-xs">Register Agricultural Supplier Corp</span>
              <button id="btn-close-supp-direct-modal" onClick={() => setShowAddSuppModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAddSuppSubmit} className="space-y-3 text-xs" id="supp-direct-form">
              <div className="space-y-1">
                <label className="text-gray-650 block">Supplier Company Name *</label>
                <input
                  type="text"
                  id="input-direct-supp-name"
                  required
                  placeholder="e.g. Mustang Apple Farms Ltd"
                  value={suppName}
                  onChange={(e) => setSuppName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Farms Phone *</label>
                <input
                  type="text"
                  id="input-direct-supp-phone"
                  required
                  value={suppPhone}
                  onChange={(e) => setSuppPhone(e.target.value)}
                  placeholder="Contact code"
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Primary Liaison Coordinator</label>
                <input
                  type="text"
                  id="input-direct-supp-person"
                  placeholder="e.g. Nim Dorje Sherpa"
                  value={suppPerson}
                  onChange={(e) => setSuppPerson(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3" id="supp-meta-col-direct">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Agronomy Office</label>
                  <input
                    type="text"
                    id="input-direct-supp-addr"
                    placeholder="e.g. Marpha, Mustang"
                    value={suppAddr}
                    onChange={(e) => setSuppAddr(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block">PAN/VAT registration</label>
                  <input
                    type="text"
                    id="input-direct-supp-pan"
                    value={suppVat}
                    onChange={(e) => setSuppVat(e.target.value)}
                    placeholder="9 digits"
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-confirm-save-supp"
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                Save Supplier Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
