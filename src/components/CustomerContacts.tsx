import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, Supplier, Receipt } from '../types';
import { 
  Users, UserPlus, Phone, MapPin, Hash, Plus, DollarSign, HandCoins, 
  Search, ShieldAlert, Award, FileSpreadsheet, ArrowLeftRight, CheckCircle, Info, Pencil, Printer, Trash2, ReceiptText
} from 'lucide-react';
import { toast } from 'sonner';
import { getTodayBS, numberToWords } from '../utils/nepaliCalendar';

export const CustomerContacts: React.FC = () => {
  const { 
    customers, suppliers, submitCustomer, submitSupplier, 
    setCustomers, setSuppliers, journals, setJournals, currentUserRole,
    businessConfig, invoices, receipts, setReceipts
  } = useApp();

  // Selected Sibling Tab: 'customers' | 'suppliers' | 'all' | 'receipts'
  const [activeSegment, setActiveSegment] = useState<'customers' | 'suppliers' | 'all' | 'receipts'>('customers');
  const [settleEntityType, setSettleEntityType] = useState<'customer' | 'supplier'>('customer');
  
  // Search parameters
  const [query, setQuery] = useState<string>('');

  // Settle Outstanding debt modal state
  const [showSettleModal, setShowSettleModal] = useState<boolean>(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<'Cash' | 'Fonepay' | 'Bank Transfer'>('Cash');
  const [settleNotes, setSettleNotes] = useState<string>('Dues installment cleared');
  const [settleReceiptNo, setSettleReceiptNo] = useState<string>('');

  // Record Credit (Payable / Credit Bill) modal state
  const [showAddCreditModal, setShowAddCreditModal] = useState<boolean>(false);
  const [creditEntityType, setCreditEntityType] = useState<'customer' | 'supplier'>('supplier');
  const [selectedCreditEntityId, setSelectedCreditEntityId] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditRefNo, setCreditRefNo] = useState<string>('');
  const [creditNotes, setCreditNotes] = useState<string>('');

  // Customer Add form states
  const [showAddCustModal, setShowAddCustModal] = useState<boolean>(false);
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [custAddr, setCustAddr] = useState<string>('');
  const [custVat, setCustVat] = useState<string>('');
  const [custNotes, setCustNotes] = useState<string>('');
  const [custOpeningDue, setCustOpeningDue] = useState<number>(0);

  // Supplier Add form states
  const [showAddSuppModal, setShowAddSuppModal] = useState<boolean>(false);
  const [suppName, setSuppName] = useState<string>('');
  const [suppPhone, setSuppPhone] = useState<string>('');
  const [suppAddr, setSuppAddr] = useState<string>('');
  const [suppVat, setSuppVat] = useState<string>('');
  const [suppPerson, setSuppPerson] = useState<string>('');
  const [suppOpeningDue, setSuppOpeningDue] = useState<number>(0);

  // Edit form states
  const [showEditCustModal, setShowEditCustModal] = useState<boolean>(false);
  const [editingCustId, setEditingCustId] = useState<string>('');
  const [editCustName, setEditCustName] = useState<string>('');
  const [editCustPhone, setEditCustPhone] = useState<string>('');
  const [editCustAddr, setEditCustAddr] = useState<string>('');
  const [editCustVat, setEditCustVat] = useState<string>('');
  const [editCustNotes, setEditCustNotes] = useState<string>('');

  const [showEditSuppModal, setShowEditSuppModal] = useState<boolean>(false);
  const [editingSuppId, setEditingSuppId] = useState<string>('');
  const [editSuppName, setEditSuppName] = useState<string>('');
  const [editSuppPhone, setEditSuppPhone] = useState<string>('');
  const [editSuppAddr, setEditSuppAddr] = useState<string>('');
  const [editSuppVat, setEditSuppVat] = useState<string>('');
  const [editSuppPerson, setEditSuppPerson] = useState<string>('');

  // Printing state
  const [selectedPartyForLedgerPrint, setSelectedPartyForLedgerPrint] = useState<any>(null);
  const [ledgerPrintType, setLedgerPrintType] = useState<'customer' | 'supplier' | null>(null);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Delete entity states
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedEntityToDelete, setSelectedEntityToDelete] = useState<Customer | Supplier | null>(null);
  const [deleteType, setDeleteType] = useState<'customer' | 'supplier'>('customer');

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
      notes: custNotes || undefined,
      openingDue: custOpeningDue || undefined
    });

    setCustName('');
    setCustPhone('');
    setCustAddr('');
    setCustVat('');
    setCustNotes('');
    setCustOpeningDue(0);
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
      contactPerson: suppPerson || undefined,
      openingDue: suppOpeningDue || undefined
    });

    setSuppName('');
    setSuppPhone('');
    setSuppAddr('');
    setSuppVat('');
    setSuppPerson('');
    setSuppOpeningDue(0);
    setShowAddSuppModal(false);
  };

  /**
   * Handler for recording new Credit / Credit Bill taken from supplier or given to customer
   */
  const handleRecordCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (creditAmount <= 0) return;

    const adDate = new Date().toISOString().split('T')[0];
    const bsDateStr = getTodayBS();

    if (creditEntityType === 'supplier') {
      const suppObj = suppliers.find(s => s.id === selectedCreditEntityId);
      if (!suppObj) return;

      const updatedDues = suppObj.outstandingDue + creditAmount;
      const updatedTotalPurchased = suppObj.totalPurchased + creditAmount;

      const updatedSuppliers = suppliers.map(s => {
        if (s.id === selectedCreditEntityId) {
          return {
            ...s,
            totalPurchased: updatedTotalPurchased,
            outstandingDue: updatedDues
          };
        }
        return s;
      });
      setSuppliers(updatedSuppliers);
      localStorage.setItem('sb_suppliers', JSON.stringify(updatedSuppliers));

      // Journal entry
      const newJournals = [...journals];
      newJournals.unshift({
        id: `journal-credit-${Date.now()}`,
        date: adDate,
        bsDate: bsDateStr,
        description: `Supplier Credit Purchase / Payable Bill from ${suppObj.name}: ${creditNotes || 'Credit taken'}`,
        reference: creditRefNo.trim() || `CR-${suppObj.id.slice(-4).toUpperCase()}`,
        debitAccount: "Purchases / Inventory Assets",
        creditAccount: "Accounts Payable (Suppliers)",
        amount: creditAmount
      });
      setJournals(newJournals);
      localStorage.setItem('sb_journals', JSON.stringify(newJournals));

      toast.success(`Credit of Rs. ${creditAmount.toLocaleString()} recorded for ${suppObj.name}. Total payable: Rs. ${updatedDues.toLocaleString()}.`);
    } else {
      const clientObj = customers.find(c => c.id === selectedCreditEntityId);
      if (!clientObj) return;

      const updatedDues = clientObj.outstandingDue + creditAmount;
      const updatedTotalPurchases = clientObj.totalPurchases + creditAmount;

      const updatedCustomers = customers.map(c => {
        if (c.id === selectedCreditEntityId) {
          return {
            ...c,
            totalPurchases: updatedTotalPurchases,
            outstandingDue: updatedDues
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      localStorage.setItem('sb_customers', JSON.stringify(updatedCustomers));

      // Journal entry
      const newJournals = [...journals];
      newJournals.unshift({
        id: `journal-credit-${Date.now()}`,
        date: adDate,
        bsDate: bsDateStr,
        description: `Credit Statement Issued to ${clientObj.name}: ${creditNotes || 'Credit given'}`,
        reference: creditRefNo.trim() || `CR-${clientObj.id.slice(-4).toUpperCase()}`,
        debitAccount: "Accounts Receivable (Customers)",
        creditAccount: "Sales Revenue",
        amount: creditAmount
      });
      setJournals(newJournals);
      localStorage.setItem('sb_journals', JSON.stringify(newJournals));

      toast.success(`Credit of Rs. ${creditAmount.toLocaleString()} recorded for ${clientObj.name}. Total due: Rs. ${updatedDues.toLocaleString()}.`);
    }

    setShowAddCreditModal(false);
    setCreditAmount(0);
    setCreditRefNo('');
    setCreditNotes('');
  };

  // Handle Customer Edit Submit
  const handleEditCustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustName.trim() || !editCustPhone.trim()) return;

    const updatedCustomers = customers.map(c => {
      if (c.id === editingCustId) {
        return {
          ...c,
          name: editCustName,
          phone: editCustPhone,
          address: editCustAddr || undefined,
          panVat: editCustVat || undefined,
          notes: editCustNotes || undefined
        };
      }
      return c;
    });

    setCustomers(updatedCustomers);
    localStorage.setItem('sb_customers', JSON.stringify(updatedCustomers));
    setShowEditCustModal(false);
  };

  // Handle Supplier Edit Submit
  const handleEditSuppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSuppName.trim() || !editSuppPhone.trim()) return;

    const updatedSuppliers = suppliers.map(s => {
      if (s.id === editingSuppId) {
        return {
          ...s,
          name: editSuppName,
          phone: editSuppPhone,
          address: editSuppAddr || undefined,
          panVat: editSuppVat || undefined,
          contactPerson: editSuppPerson || undefined
        };
      }
      return s;
    });

    setSuppliers(updatedSuppliers);
    localStorage.setItem('sb_suppliers', JSON.stringify(updatedSuppliers));
    setShowEditSuppModal(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedEntityToDelete) return;

    if (deleteType === 'customer') {
      const updatedCustomers = customers.filter(c => c.id !== selectedEntityToDelete.id);
      setCustomers(updatedCustomers);
      toast.success(`Client profile "${selectedEntityToDelete.name}" has been permanently deleted.`);
    } else {
      const updatedSuppliers = suppliers.filter(s => s.id !== selectedEntityToDelete.id);
      setSuppliers(updatedSuppliers);
      toast.success(`Supplier profile "${selectedEntityToDelete.name}" has been permanently deleted.`);
    }

    setShowDeleteModal(false);
    setSelectedEntityToDelete(null);
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

      toast.success(`Receipt of Rs. ${settleAmount.toLocaleString()} recorded for ${clientObj.name}. Dues reduced to Rs. ${updatedDues.toLocaleString()}.`);

      // 3. Store receipt record
      if (settleReceiptNo.trim()) {
        const newReceipt: Receipt = {
          id: `rec-${Date.now()}`,
          receiptNo: settleReceiptNo.trim(),
          entityType: 'customer',
          entityId: clientObj.id,
          entityName: clientObj.name,
          amount: settleAmount,
          paymentMethod: settleMethod,
          previousDue: clientObj.outstandingDue,
          remainingDue: updatedDues,
          date: adDate,
          bsDate: bsDateStr,
          notes: settleNotes || undefined
        };
        const updatedReceipts = [newReceipt, ...receipts];
        setReceipts(updatedReceipts);
      }
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

      toast.success(`Payable of Rs. ${settleAmount.toLocaleString()} cleared to ${supplierObj.name}. Outstanding liability reduced to Rs. ${updatedDues.toLocaleString()}.`);

      // 3. Store receipt record
      if (settleReceiptNo.trim()) {
        const newReceipt: Receipt = {
          id: `rec-${Date.now()}`,
          receiptNo: settleReceiptNo.trim(),
          entityType: 'supplier',
          entityId: supplierObj.id,
          entityName: supplierObj.name,
          amount: settleAmount,
          paymentMethod: settleMethod,
          previousDue: supplierObj.outstandingDue,
          remainingDue: updatedDues,
          date: adDate,
          bsDate: bsDateStr,
          notes: settleNotes || undefined
        };
        const updatedReceipts = [newReceipt, ...receipts];
        setReceipts(updatedReceipts);
      }
    }

    setShowSettleModal(false);
    setSettleAmount(0);
    setSettleReceiptNo('');
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
          <button
            id="btn-active-segment-receipts"
            onClick={() => {
              setActiveSegment('receipts');
              setQuery('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSegment === 'receipts' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            <span className="flex items-center gap-1.5"><ReceiptText className="h-3.5 w-3.5" /> Receipt Log</span>
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
                : activeSegment === 'receipts'
                ? 'Search receipts by receipt number, party name, or notes...'
                : 'Search all ledger parties (clients & suppliers) by names, contact channels, or offices...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none animate-fade-in"
          />
        </div>

        {(activeSegment === 'customers' || activeSegment === 'suppliers') ? (
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          id={`btn-edit-cust-${cust.id}`}
                          onClick={() => {
                            setEditingCustId(cust.id);
                            setEditCustName(cust.name);
                            setEditCustPhone(cust.phone);
                            setEditCustAddr(cust.address || '');
                            setEditCustVat(cust.panVat || '');
                            setEditCustNotes(cust.notes || '');
                            setShowEditCustModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-blue-600 transition"
                          title="Edit Customer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`btn-delete-cust-${cust.id}`}
                          onClick={() => {
                            if (cust.outstandingDue > 0) {
                              toast.error(`Cannot delete client "${cust.name}" because they have an active outstanding balance of Rs. ${cust.outstandingDue.toLocaleString()}. Please settle the balance first.`);
                              return;
                            }
                            setSelectedEntityToDelete(cust);
                            setDeleteType('customer');
                            setShowDeleteModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-rose-600 transition"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {hasDue && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md animate-pulse">
                            Credit Due
                          </span>
                        )}
                      </div>
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

                  {/* Actions for settlements and printing */}
                  <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center gap-2" id="customer-card-actions-wrapper">
                    <button
                      id={`btn-print-ledger-cust-${cust.id}`}
                      onClick={() => {
                        setSelectedPartyForLedgerPrint(cust);
                        setLedgerPrintType('customer');
                        setPrintOrientation('portrait');
                      }}
                      className="py-1.5 px-2.5 text-gray-600 hover:text-blue-650 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      title="Print Customer Ledger Statement"
                    >
                      <Printer className="h-3.5 w-3.5 text-gray-500" />
                      <span>खाता विवरण (Ledger)</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`btn-add-credit-cust-${cust.id}`}
                        onClick={() => {
                          setSelectedCreditEntityId(cust.id);
                          setCreditEntityType('customer');
                          setCreditAmount(0);
                          setCreditRefNo('');
                          setCreditNotes('');
                          setShowAddCreditModal(true);
                        }}
                        className="py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Record Credit Bill Issued to Customer"
                      >
                        <Plus className="h-3.5 w-3.5 text-blue-600" />
                        <span>+ Add Credit</span>
                      </button>
                      {hasDue && (
                        <button
                          id={`btn-settle-cust-${cust.id}`}
                          onClick={() => {
                            setSelectedEntityId(cust.id);
                            setSettleEntityType('customer');
                            setSettleAmount(cust.outstandingDue);
                            setShowSettleModal(true);
                          }}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition rounded-lg text-white font-semibold text-[10px] flex items-center gap-1.5 cursor-pointer"
                        >
                          <HandCoins className="h-3.5 w-3.5" /> Settle Credit
                        </button>
                      )}
                    </div>
                  </div>
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          id={`btn-edit-supp-${supp.id}`}
                          onClick={() => {
                            setEditingSuppId(supp.id);
                            setEditSuppName(supp.name);
                            setEditSuppPhone(supp.phone);
                            setEditSuppAddr(supp.address || '');
                            setEditSuppVat(supp.panVat || '');
                            setEditSuppPerson(supp.contactPerson || '');
                            setShowEditSuppModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-blue-600 transition"
                          title="Edit Supplier"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`btn-delete-supp-${supp.id}`}
                          onClick={() => {
                            if (supp.outstandingDue > 0) {
                              toast.error(`Cannot delete supplier "${supp.name}" because we owe them an outstanding due of Rs. ${supp.outstandingDue.toLocaleString()}. Please settle the balance first.`);
                              return;
                            }
                            setSelectedEntityToDelete(supp);
                            setDeleteType('supplier');
                            setShowDeleteModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-rose-600 transition"
                          title="Delete Supplier"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {hasDue && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-805 text-[10px] font-bold rounded-md animate-pulse">
                            Payable Out
                          </span>
                        )}
                      </div>
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

                  {/* Actions for settlements and printing */}
                  <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center gap-2" id="supplier-card-actions-wrapper">
                    <button
                      id={`btn-print-ledger-supp-${supp.id}`}
                      onClick={() => {
                        setSelectedPartyForLedgerPrint(supp);
                        setLedgerPrintType('supplier');
                        setPrintOrientation('portrait');
                      }}
                      className="py-1.5 px-2.5 text-gray-600 hover:text-amber-700 hover:bg-amber-50 border border-gray-200 hover:border-amber-200 transition rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      title="Print Supplier Ledger Statement"
                    >
                      <Printer className="h-3.5 w-3.5 text-gray-500" />
                      <span>खाता विवरण (Ledger)</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`btn-add-credit-supp-${supp.id}`}
                        onClick={() => {
                          setSelectedCreditEntityId(supp.id);
                          setCreditEntityType('supplier');
                          setCreditAmount(0);
                          setCreditRefNo('');
                          setCreditNotes('');
                          setShowAddCreditModal(true);
                        }}
                        className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Record Credit Bill Taken from Supplier"
                      >
                        <Plus className="h-3.5 w-3.5 text-amber-600" />
                        <span>+ Record Credit</span>
                      </button>
                      {hasDue && currentUserRole === 'Owner' && (
                        <button
                          id={`btn-settle-supp-${supp.id}`}
                          onClick={() => {
                            setSelectedEntityId(supp.id);
                            setSettleEntityType('supplier');
                            setSettleAmount(supp.outstandingDue);
                            setShowSettleModal(true);
                          }}
                          className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-95 transition rounded-lg text-white font-semibold text-[10px] flex items-center gap-1.5 cursor-pointer"
                        >
                          <HandCoins className="h-3.5 w-3.5" /> Post Settlement
                        </button>
                      )}
                    </div>
                  </div>
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          id={`btn-edit-party-${party.partyType}-${party.id}`}
                          onClick={() => {
                            if (party.partyType === 'customer') {
                              setEditingCustId(party.id);
                              setEditCustName(party.name);
                              setEditCustPhone(party.phone);
                              setEditCustAddr(party.address || '');
                              setEditCustVat(party.panVat || '');
                              setEditCustNotes(party.notes || '');
                              setShowEditCustModal(true);
                            } else {
                              setEditingSuppId(party.id);
                              setEditSuppName(party.name);
                              setEditSuppPhone(party.phone);
                              setEditSuppAddr(party.address || '');
                              setEditSuppVat(party.panVat || '');
                              setEditSuppPerson(party.contactPerson || '');
                              setShowEditSuppModal(true);
                            }
                          }}
                          className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-blue-600 transition"
                          title={`Edit ${party.partyType === 'customer' ? 'Customer' : 'Supplier'}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`btn-delete-party-${party.partyType}-${party.id}`}
                          onClick={() => {
                            if (party.outstandingDue > 0) {
                              toast.error(`Cannot delete ${party.partyType === 'customer' ? 'client' : 'supplier'} "${party.name}" because there is an outstanding balance of Rs. ${party.outstandingDue.toLocaleString()}. Please settle the balance first.`);
                              return;
                            }
                            setSelectedEntityToDelete(party);
                            setDeleteType(party.partyType);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-rose-600 transition"
                          title={`Delete ${party.partyType === 'customer' ? 'Customer' : 'Supplier'}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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

                  {/* Actions for settlements and printing */}
                  <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center gap-2" id="party-card-actions-wrapper">
                    <button
                      id={`btn-print-ledger-party-${party.partyType}-${party.id}`}
                      onClick={() => {
                        setSelectedPartyForLedgerPrint(party);
                        setLedgerPrintType(party.partyType);
                        setPrintOrientation('portrait');
                      }}
                      className={`py-1.5 px-2.5 text-gray-600 border border-gray-200 transition rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer ${
                        party.partyType === 'customer' 
                          ? 'hover:text-blue-655 hover:bg-blue-50 hover:border-blue-200' 
                          : 'hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200'
                      }`}
                      title={`Print ${party.partyType === 'customer' ? 'Customer' : 'Supplier'} Ledger Statement`}
                    >
                      <Printer className="h-3.5 w-3.5 text-gray-500" />
                      <span>खाता विवरण (Ledger)</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`btn-add-credit-party-${party.partyType}-${party.id}`}
                        onClick={() => {
                          setSelectedCreditEntityId(party.id);
                          setCreditEntityType(party.partyType);
                          setCreditAmount(0);
                          setCreditRefNo('');
                          setCreditNotes('');
                          setShowAddCreditModal(true);
                        }}
                        className={`py-1.5 px-2.5 border transition rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer ${
                          party.partyType === 'customer'
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                        title={`Record Credit ${party.partyType === 'customer' ? 'Issued' : 'Taken'}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ Credit</span>
                      </button>
                      {hasDue && (
                        <button
                          id={`btn-settle-${party.partyType}-${party.id}`}
                          onClick={() => {
                            setSelectedEntityId(party.id);
                            setSettleEntityType(party.partyType);
                            setSettleAmount(party.outstandingDue);
                            setShowSettleModal(true);
                          }}
                          className={`py-1.5 px-3 active:scale-95 transition rounded-lg text-white font-semibold text-[10px] flex items-center gap-1.5 cursor-pointer ${party.settleBtnColorClass}`}
                        >
                          <HandCoins className="h-3.5 w-3.5" /> {party.settleBtnText}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* RECEIPTS HISTORY TAB */}
      {activeSegment === 'receipts' && (
        <div className="space-y-3" id="receipts-history-section">
          {receipts.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
              <ReceiptText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">No receipts recorded yet</p>
              <p className="text-gray-400 text-xs mt-1">When you settle dues and enter a receipt number, it will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs" id="receipts-history-table">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                      <th className="px-4 py-3 text-left font-semibold">Receipt No.</th>
                      <th className="px-4 py-3 text-left font-semibold">Date (BS)</th>
                      <th className="px-4 py-3 text-left font-semibold">Party</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount (Rs)</th>
                      <th className="px-4 py-3 text-left font-semibold">Method</th>
                      <th className="px-4 py-3 text-right font-semibold">Prev Due</th>
                      <th className="px-4 py-3 text-right font-semibold">Remaining</th>
                      <th className="px-4 py-3 text-left font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {receipts
                      .filter(r => {
                        if (!query) return true;
                        const q = query.toLowerCase();
                        return r.receiptNo.toLowerCase().includes(q) || r.entityName.toLowerCase().includes(q) || (r.notes && r.notes.toLowerCase().includes(q));
                      })
                      .map((r) => (
                      <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-blue-700 font-mono">{r.receiptNo}</td>
                        <td className="px-4 py-3 text-gray-600">{r.bsDate}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{r.entityName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.entityType === 'customer' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {r.entityType === 'customer' ? 'Collection' : 'Payout'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold font-mono text-green-700">Rs. {r.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{r.paymentMethod}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">Rs. {r.previousDue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">Rs. {r.remainingDue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-400 max-w-[150px] truncate">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-400 text-right border-t">
                Total receipts: {receipts.length} &bull; Total collected: Rs. {receipts.filter(r => r.entityType === 'customer').reduce((s,r) => s + r.amount, 0).toLocaleString()} &bull; Total paid out: Rs. {receipts.filter(r => r.entityType === 'supplier').reduce((s,r) => s + r.amount, 0).toLocaleString()}
              </div>
            </div>
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

              <div className="space-y-1">
                <label className="text-gray-600 block">Receipt No. (as written on paper rasid)</label>
                <input
                  type="text"
                  id="input-settle-receipt-no"
                  value={settleReceiptNo}
                  onChange={(e) => setSettleReceiptNo(e.target.value)}
                  placeholder="e.g. 1234, REC-05, रसिद-१२"
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500 font-mono"
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

              <div className="space-y-1">
                <label className="text-gray-650 block">Opening Credit Dues (Rs)</label>
                <input
                  type="number"
                  id="input-direct-cust-opening-due"
                  min="0"
                  placeholder="0"
                  value={custOpeningDue || ''}
                  onChange={(e) => setCustOpeningDue(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none font-mono text-blue-700 font-bold"
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
              <span className="font-semibold text-gray-900 text-xs">Register Stationery Supplier Corp</span>
              <button id="btn-close-supp-direct-modal" onClick={() => setShowAddSuppModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAddSuppSubmit} className="space-y-3 text-xs" id="supp-direct-form">
              <div className="space-y-1">
                <label className="text-gray-650 block">Supplier Company Name *</label>
                <input
                  type="text"
                  id="input-direct-supp-name"
                  required
                  placeholder="e.g. Himalayan Paper Mills Ltd"
                  value={suppName}
                  onChange={(e) => setSuppName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Supplier Phone *</label>
                <input
                  type="text"
                  id="input-direct-supp-phone"
                  required
                  value={suppPhone}
                  onChange={(e) => setSuppPhone(e.target.value)}
                  placeholder="Contact phone number"
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

              <div className="space-y-1">
                <label className="text-gray-650 block">Opening Credit Payable / Credit Taken (Rs)</label>
                <input
                  type="number"
                  id="input-direct-supp-opening-due"
                  min="0"
                  placeholder="0"
                  value={suppOpeningDue || ''}
                  onChange={(e) => setSuppOpeningDue(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none font-mono text-amber-700 font-bold"
                />
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

      {/* MODAL: EDIT CUSTOMER */}
      {showEditCustModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-edit-customer">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border text-left" id="edit-cust-inner">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold text-gray-900 text-xs">Edit Customer Profile</span>
              <button id="btn-close-edit-cust-modal" onClick={() => setShowEditCustModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleEditCustSubmit} className="space-y-3 text-xs" id="edit-cust-form">
              <div className="space-y-1">
                <label className="text-gray-650 block">Full Name *</label>
                <input
                  type="text"
                  id="input-edit-cust-name"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none text-gray-800 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Phone Number *</label>
                <input
                  type="text"
                  id="input-edit-cust-phone"
                  required
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none text-gray-800 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Address</label>
                <input
                  type="text"
                  id="input-edit-cust-addr"
                  value={editCustAddr}
                  onChange={(e) => setEditCustAddr(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none text-gray-800 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-655 block">PAN / VAT Reg ID</label>
                <input
                  type="text"
                  id="input-edit-cust-pan"
                  value={editCustVat}
                  onChange={(e) => setEditCustVat(e.target.value)}
                  placeholder="9 digit code"
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none font-mono text-gray-800 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-655 block">Notes</label>
                <input
                  type="text"
                  id="input-edit-cust-notes"
                  value={editCustNotes}
                  onChange={(e) => setEditCustNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none text-gray-800 font-semibold"
                />
              </div>

              <button
                type="submit"
                id="btn-confirm-update-cust"
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Update Customer Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SUPPLIER */}
      {showEditSuppModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-edit-supplier">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border text-left" id="edit-supp-inner">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold text-gray-900 text-xs">Edit Supplier Profile</span>
              <button id="btn-close-edit-supp-modal" onClick={() => setShowEditSuppModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleEditSuppSubmit} className="space-y-3 text-xs" id="edit-supp-form">
              <div className="space-y-1">
                <label className="text-gray-650 block">Supplier Company Name *</label>
                <input
                  type="text"
                  id="input-edit-supp-name"
                  required
                  value={editSuppName}
                  onChange={(e) => setEditSuppName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none text-gray-800 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-655 block">Farms Phone *</label>
                <input
                  type="text"
                  id="input-edit-supp-phone"
                  required
                  value={editSuppPhone}
                  onChange={(e) => setEditSuppPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none text-gray-800 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-655 block">Primary Liaison Coordinator</label>
                <input
                  type="text"
                  id="input-edit-supp-person"
                  value={editSuppPerson}
                  onChange={(e) => setEditSuppPerson(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none text-gray-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3" id="edit-supp-meta-col">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Agronomy Office</label>
                  <input
                    type="text"
                    id="input-edit-supp-addr"
                    value={editSuppAddr}
                    onChange={(e) => setEditSuppAddr(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none text-gray-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block">PAN/VAT Reg</label>
                  <input
                    type="text"
                    id="input-edit-supp-pan"
                    value={editSuppVat}
                    onChange={(e) => setEditSuppVat(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none font-mono text-gray-800 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-confirm-update-supp"
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Update Supplier Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PARTY GENERAL LEDGER STATEMENT (लेजर खाता विवरण) PRINT HUB */}
      {selectedPartyForLedgerPrint && (() => {
        const party = selectedPartyForLedgerPrint;
        const isCust = ledgerPrintType === 'customer';
        
        // Compile transactions
        const ledgerEntries: any[] = [];
        if (isCust) {
          const custInvoices = invoices.filter(inv => inv.customerId === party.id);
          custInvoices.forEach(inv => {
            ledgerEntries.push({
              date: inv.date,
              bsDate: inv.bsDate,
              particulars: `बिक्री बीजक (Sales Invoice) #${inv.invoiceNo}`,
              ref: inv.invoiceNo,
              debit: inv.grandTotal,
              credit: 0
            });
            if (inv.paidAmount > 0) {
              ledgerEntries.push({
                date: inv.date,
                bsDate: inv.bsDate,
                particulars: `नगद भुक्तानी प्राप्त (Payment Recd - ${inv.paymentMethod})`,
                ref: `REC-${inv.invoiceNo}`,
                debit: 0,
                credit: inv.paidAmount
              });
            }
          });

          // Add journal collections
          const settlements = journals.filter(j => j.description.includes(party.name));
          settlements.forEach(j => {
            ledgerEntries.push({
              date: j.date,
              bsDate: j.bsDate,
              particulars: `उधारो चुक्ता रसिद (Credit Settled - Cash/Bank)`,
              ref: j.reference,
              debit: 0,
              credit: j.amount
            });
          });
        } else {
          // Supplier
          if (party.totalPurchased > 0) {
            ledgerEntries.push({
              date: '2026-04-14',
              bsDate: '2083-01-01',
              particulars: `थोक कृषि खरिद कारोबार (Bulk Purchases Trade)`,
              ref: 'PUR-INIT',
              debit: 0,
              credit: party.totalPurchased
            });
          }
          if (party.totalPaid > 0) {
            ledgerEntries.push({
              date: '2026-04-15',
              bsDate: '2083-01-02',
              particulars: `आंशिक भुक्तानी फस्र्यौट (Installment Paid Out)`,
              ref: `PAY-INIT`,
              debit: party.totalPaid,
              credit: 0
            });
          }
          const settlements = journals.filter(j => j.description.includes(party.name));
          settlements.forEach(j => {
            ledgerEntries.push({
              date: j.date,
              bsDate: j.bsDate,
              particulars: `दायित्व भुक्तानी फस्र्यौट (Credit Paid Out)`,
              ref: j.reference,
              debit: j.amount,
              credit: 0
            });
          });
        }

        // Sort by date
        ledgerEntries.sort((a, b) => a.date.localeCompare(b.date));

        // Calculate running balances
        let runningBal = 0;
        const ledgerRows = ledgerEntries.map((entry) => {
          if (isCust) {
            // Customer: Debit increases dues, Credit reduces dues
            runningBal += (entry.debit - entry.credit);
          } else {
            // Supplier: Credit increases dues (liability), Debit reduces dues (payment)
            runningBal += (entry.credit - entry.debit);
          }
          return {
            ...entry,
            balance: runningBal
          };
        });

        const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="modal-party-ledger-print">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4 border text-left" id="party-ledger-container">
              
              {/* Action Bar */}
              <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-3" id="ledger-print-action-bar">
                <div>
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                    {isCust ? 'Customer Ledger Statement' : 'Supplier Account Statement'} (खाता पाना विवरण)
                  </h3>
                  <p className="text-[10px] text-gray-450 font-medium">Standardized client ledger directory and audit checklist</p>
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
                    id="btn-trigger-ledger-print"
                    onClick={() => triggerPrintForElement('party-ledger-print-content', `${party.name} Statement`, printOrientation)}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Statement
                  </button>
                  <button 
                    onClick={() => setSelectedPartyForLedgerPrint(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs px-2 font-bold"
                  >
                    Close ✕
                  </button>
                </div>
              </div>

              {/* Print Preview viewport */}
              <div className="bg-gray-50 border p-4 rounded-xl max-h-[60vh] overflow-y-auto" id="ledger-preview-viewport">
                <div 
                  id="party-ledger-print-content" 
                  className="bg-white border p-6 mx-auto shadow-sm text-gray-900 text-xs leading-relaxed" 
                  style={{ width: '100%', maxWidth: printOrientation === 'portrait' ? '680px' : '100%', minHeight: '500px' }}
                >
                  
                  {/* Business Header */}
                  <div className="text-center space-y-1.5 border-b-2 border-double border-gray-800 pb-3" id="ledger-sheet-header">
                    {businessConfig.logo && (
                      <img src={businessConfig.logo} alt="Company Logo" className="h-10 mx-auto object-contain mb-1" referrerPolicy="no-referrer" />
                    )}
                    <h1 className="text-sm font-black text-gray-950 uppercase">{businessConfig.nepaliName || businessConfig.name}</h1>
                    <p className="text-[10px] text-gray-500 font-semibold">{businessConfig.address}</p>
                    <p className="text-[10px] text-gray-500 font-mono">फोन नं: {businessConfig.phone} | PAN/VAT No: {businessConfig.panVat || 'N/A'}</p>
                    
                    <div className="pt-2">
                      <span className="inline-block px-4 py-1 border border-gray-900 text-[11px] font-black tracking-widest uppercase rounded">
                        {isCust ? 'ग्राहक लेजर खाता विवरण' : 'विक्रेता खाता लेजर विवरण'} (PARTY LEDGER STATEMENT)
                      </span>
                    </div>
                  </div>

                  {/* Profile & Date section */}
                  <div className="grid grid-cols-2 justify-between items-start text-[10px] py-3.5 border-b border-gray-350" id="ledger-profile-sec">
                    <div className="space-y-1 text-left">
                      <p className="text-[11px] font-bold text-gray-950 uppercase">{party.name}</p>
                      {party.contactPerson && <p><span className="text-gray-500">liaison Manager:</span> <span className="font-semibold">{party.contactPerson}</span></p>}
                      <p><span className="text-gray-500">ठेगाना (Address):</span> <span className="font-medium">{party.address || 'Address unconfigured'}</span></p>
                      <p><span className="text-gray-500">सम्पर्क (Phone):</span> <span className="font-mono font-bold text-gray-900">{party.phone}</span></p>
                      {party.panVat && <p><span className="text-gray-500">PAN/VAT No:</span> <span className="font-mono font-bold text-gray-900">{party.panVat}</span></p>}
                    </div>
                    <div className="space-y-1 text-right">
                      <p><span className="text-gray-500">खाता प्रकार (Account):</span> <span className="font-bold text-blue-700 uppercase">{isCust ? 'Accounts Receivable (ग्राहक)' : 'Accounts Payable (साहु)'}</span></p>
                      <p><span className="text-gray-500">मिति (Date):</span> <span className="font-mono text-gray-900">{getTodayBS()} (BS) / {new Date().toISOString().split('T')[0]} (AD)</span></p>
                      <p><span className="text-gray-500">खाता नं. (Code):</span> <span className="font-mono text-gray-800 uppercase">{party.id.slice(0, 10)}</span></p>
                    </div>
                  </div>

                  {/* Financial Balance Summary Box inside the sheet */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-b border-gray-200 text-center font-bold text-[9px] text-gray-600 bg-gray-50 p-2 rounded-lg my-3" id="ledger-summary-kpis-box">
                    <div>
                      <span className="block text-gray-450 uppercase">{isCust ? 'कुल कारोबार (Total Billing):' : 'कुल खरिद (Total Purchases):'}</span>
                      <span className="block text-[11px] font-black text-gray-900 font-mono mt-0.5">Rs. {isCust ? party.totalPurchases.toLocaleString() : party.totalPurchased.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-gray-450 uppercase">कुल फर्स्यौट (Total Cleared):</span>
                      <span className="block text-[11px] font-black text-emerald-700 font-mono mt-0.5">Rs. {party.totalPaid.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-gray-450 uppercase">बाँकी मौज्दात (Outstanding Balance):</span>
                      <span className="block text-[11px] font-black text-rose-700 font-mono mt-0.5">Rs. {party.outstandingDue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div className="mt-4 border border-gray-800 rounded-lg overflow-hidden text-[9px]" id="ledger-table-sheet">
                    <table className="w-full text-left border-collapse" id="ledger-print-table">
                      <thead>
                        <tr className="bg-gray-100 text-gray-950 font-bold border-b border-gray-800 uppercase">
                          <th id="th-ledg-sn" className="p-1.5 border-r border-gray-800 w-10 text-center">S.N</th>
                          <th id="th-ledg-date" className="p-1.5 border-r border-gray-800 w-24">मिति (Date BS/AD)</th>
                          <th id="th-ledg-part" className="p-1.5 border-r border-gray-800">विवरण (Particulars)</th>
                          <th id="th-ledg-ref" className="p-1.5 border-r border-gray-800 w-20">प्रमाण नं. (Ref)</th>
                          <th id="th-ledg-dr" className="p-1.5 border-r border-gray-800 text-right w-24">डेबिट (+) (Debit Rs)</th>
                          <th id="th-ledg-cr" className="p-1.5 border-r border-gray-800 text-right w-24">क्रेडिट (-) (Credit Rs)</th>
                          <th id="th-ledg-bal" className="p-1.5 text-right w-24">बाँकी मौज्दात (Balance Rs)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300 font-medium" id="ledger-print-tbody">
                        {ledgerRows.map((row, idx) => (
                          <tr key={idx} className="align-middle">
                            <td className="p-1.5 border-r border-gray-800 text-center font-mono">{idx + 1}</td>
                            <td className="p-1.5 border-r border-gray-800 text-left">
                              <span className="font-mono font-semibold block text-gray-900">{row.bsDate}</span>
                              <span className="font-mono text-[8px] text-gray-400 block mt-0.5">{row.date}</span>
                            </td>
                            <td className="p-1.5 border-r border-gray-800 text-left text-gray-800 font-semibold">{row.particulars}</td>
                            <td className="p-1.5 border-r border-gray-800 font-mono uppercase text-gray-600">{row.ref}</td>
                            <td className="p-1.5 border-r border-gray-800 text-right font-mono text-gray-900">
                              {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}
                            </td>
                            <td className="p-1.5 border-r border-gray-800 text-right font-mono text-gray-900">
                              {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}
                            </td>
                            <td className="p-1.5 text-right font-mono font-bold text-gray-950">
                              Rs. {row.balance.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {ledgerRows.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-gray-400 font-semibold">
                              No historical transactions detected for this contact profile in fiscal year daybook.
                            </td>
                          </tr>
                        )}
                        {/* Totals Row */}
                        <tr className="bg-gray-100 font-bold border-t border-gray-800 text-[9.5px]">
                          <td colSpan={4} className="p-2 border-r border-gray-800 text-right uppercase">
                            कुल योग (Total Ledger Summations):
                          </td>
                          <td className="p-2 border-r border-gray-800 text-right font-mono text-gray-900">
                            Rs. {totalDebit.toLocaleString()}
                          </td>
                          <td className="p-2 border-r border-gray-800 text-right font-mono text-gray-900">
                            Rs. {totalCredit.toLocaleString()}
                          </td>
                          <td className="p-2 text-right font-mono font-black text-rose-700 bg-rose-50/50">
                            Rs. {party.outstandingDue.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Amount in words */}
                  <div className="mt-4 p-2 bg-gray-50 border border-dashed rounded font-mono text-[9px] text-gray-600" id="ledger-amount-words">
                    <span className="font-extrabold uppercase text-gray-550 block">अक्षरेपी बाँकी मौज्दात (Outstanding balance in words):</span>
                    <span className="text-gray-900 font-bold block mt-0.5">
                      {party.outstandingDue > 0 ? `${numberToWords(party.outstandingDue)} Only` : 'Zero Balance (शून्य मौज्दात)'}
                    </span>
                  </div>

                  {/* Sign-off signatures */}
                  <div className="grid grid-cols-2 gap-4 mt-12 pt-8 border-t border-dashed text-[8px] text-center font-bold text-gray-600" id="ledger-signatures">
                    <div className="space-y-6">
                      <div className="h-6"></div>
                      <p className="border-t border-gray-400 pt-1.5">लेखा प्रमुखको हस्ताक्षर<br/><span className="text-[7px] font-normal text-gray-400">Chief Accountant / Logged By</span></p>
                    </div>
                    <div className="space-y-6">
                      <div className="h-6"></div>
                      <p className="border-t border-gray-400 pt-1.5">ग्राहक/सरोकारवालाको बुझिलिने हस्ताक्षर<br/><span className="text-[7px] font-normal text-gray-400">Authorized Client / Party Confirmation Sign</span></p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Hint Box */}
              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] text-blue-800 flex items-center gap-1.5 font-medium leading-relaxed" id="ledger-print-help">
                <span>💡 General Ledger Statements containing detailed transactional records and credit balances are printed in <strong>Portrait</strong> layout for standard business records and folder indexing.</span>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL: DELETE ENTITY VERIFICATION */}
      {showDeleteModal && selectedEntityToDelete && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-delete-entity">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-150" id="delete-entity-inner">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-950 text-xs uppercase tracking-tight text-rose-600">
                Confirm Profile Deletion
              </span>
              <button 
                id="btn-close-delete-modal"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEntityToDelete(null);
                }} 
                className="text-gray-400 hover:text-gray-600 font-sans cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4" id="delete-confirmed-view">
              <div className="space-y-2 text-xs text-gray-600">
                <p>Are you sure you want to permanently delete this {deleteType === 'customer' ? 'client' : 'supplier'} profile?</p>
                <div className="bg-gray-50 border border-gray-150 rounded-lg p-3 space-y-1">
                  <span className="text-gray-400 font-medium block">Name:</span>
                  <strong className="font-black text-gray-900 block">{selectedEntityToDelete.name}</strong>
                  {selectedEntityToDelete.phone && (
                    <>
                      <span className="text-gray-400 font-medium block mt-1">Phone:</span>
                      <strong className="font-mono text-gray-900 block">{selectedEntityToDelete.phone}</strong>
                    </>
                  )}
                  {selectedEntityToDelete.panVat && (
                    <>
                      <span className="text-gray-400 font-medium block mt-1">PAN / VAT:</span>
                      <strong className="font-mono text-gray-900 block">{selectedEntityToDelete.panVat}</strong>
                    </>
                  )}
                </div>
                <p className="text-rose-650 font-bold">This action is irreversible. Historical transaction references (invoices/bills) will remain intact, but the profile will be removed from all lists immediately.</p>
              </div>

              <div className="flex gap-2 text-xs" id="delete-actions-row">
                <button
                  id="btn-cancel-delete"
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedEntityToDelete(null);
                  }}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-delete-action"
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: RECORD CREDIT / TAKE CREDIT BILL */}
      {showAddCreditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-record-credit">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-150" id="record-credit-inner">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-950 text-xs uppercase tracking-tight">
                {creditEntityType === 'supplier' ? 'Record Supplier Credit (Payable Taken)' : 'Record Customer Credit (Receivable Given)'}
              </span>
              <button 
                id="btn-close-credit-modal"
                onClick={() => setShowAddCreditModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-lg text-xs text-gray-700 border border-amber-200/60" id="credit-dialog-meta">
              <span className="text-amber-800 font-medium block">Credit Entity Party:</span>
              <strong className="text-gray-950 block text-xs">
                {creditEntityType === 'customer' 
                  ? customers.find(c => c.id === selectedCreditEntityId)?.name 
                  : suppliers.find(s => s.id === selectedCreditEntityId)?.name}
              </strong>
              <span className="text-gray-600 block mt-1">Current Outstanding Balance: <strong className="text-amber-700 font-bold font-mono">
                Rs. {creditEntityType === 'customer' 
                  ? customers.find(c => c.id === selectedCreditEntityId)?.outstandingDue.toLocaleString()
                  : suppliers.find(s => s.id === selectedCreditEntityId)?.outstandingDue.toLocaleString()}
              </strong></span>
            </div>

            <form onSubmit={handleRecordCreditSubmit} className="space-y-3.5 text-xs" id="record-credit-form">
              <div className="space-y-1">
                <label className="text-gray-700 font-semibold block">
                  {creditEntityType === 'supplier' ? 'Credit Purchase Amount Owed (Rs) *' : 'Credit Statement Issued Amount (Rs) *'}
                </label>
                <input
                  type="number"
                  id="input-credit-amt"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={creditAmount || ''}
                  onChange={(e) => setCreditAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-amber-500 font-black text-amber-700 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Bill / Reference Number</label>
                <input
                  type="text"
                  id="input-credit-ref"
                  value={creditRefNo}
                  onChange={(e) => setCreditRefNo(e.target.value)}
                  placeholder="e.g. BILL-992, CR-001, बिल न."
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Particulars / Reason Notes</label>
                <input
                  type="text"
                  id="input-credit-notes"
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                  placeholder="e.g. Purchased 50 units on 30-day credit term"
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                id="btn-confirm-record-credit"
                className={`w-full py-2.5 text-white rounded-lg font-bold transition ${
                  creditEntityType === 'supplier' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {creditEntityType === 'supplier' ? '+ Save Payable Credit Entry' : '+ Save Client Credit Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
