import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Product, Customer, Supplier, Expense, Invoice, Purchase, 
  JournalEntry, BusinessConfig, StockMovement, UserRole 
} from '../types';
import { 
  INITIAL_BUSINESS_CONFIG, INITIAL_PRODUCTS, INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, INITIAL_EXPENSES, INITIAL_INVOICES, 
  INITIAL_PURCHASES, INITIAL_JOURNALS 
} from '../utils/initialData';
import { convertADtoBS, getTodayBS } from '../utils/nepaliCalendar';
import { 
  testSupabaseConnection, pushDataToSupabase, pullDataFromSupabase, 
  hasSupabaseConfig, SyncResult 
} from '../utils/supabaseClient';

export interface AlertNotification {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  date: string; // BS date
  isRead: boolean;
}

interface AppContextType {
  businessConfig: BusinessConfig;
  setBusinessConfig: (config: BusinessConfig) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  journals: JournalEntry[];
  setJournals: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  stockMovements: StockMovement[];
  setStockMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  
  // State helpers
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  notifications: AlertNotification[];
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
  
  // Actions that automatically handle calculations, inventory, and bookkeeping
  submitInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNo' | 'date' | 'bsDate'>) => Invoice;
  refundInvoice: (invoiceId: string) => void;
  submitPurchase: (purchase: Omit<Purchase, 'id' | 'date' | 'bsDate'>) => Purchase;
  submitExpense: (expense: Omit<Expense, 'id' | 'date' | 'bsDate'>) => Expense;
  submitProduct: (product: Omit<Product, 'id'>) => Product;
  submitCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'outstandingDue'>) => Customer;
  submitSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchased' | 'totalPaid' | 'outstandingDue'>) => Supplier;
  adjustStockQuantity: (productId: string, changeQty: number, reason: string) => void;
  resetToDefault: () => void;

  // Supabase Sync additions
  isSupabaseConfigured: boolean;
  isAutoSyncEnabled: boolean;
  setIsAutoSyncEnabled: (val: boolean) => void;
  supabaseStatus: { success: boolean; message: string; tableExists: boolean } | null;
  checkSupabaseConnection: () => Promise<void>;
  backupToSupabase: () => Promise<SyncResult>;
  restoreFromSupabase: () => Promise<SyncResult>;
  lastSyncedAt: string | null;
  isSyncing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial settings or fetch from localStorage
  const [businessConfig, setBusinessConfigState] = useState<BusinessConfig>(INITIAL_BUSINESS_CONFIG);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Owner');
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  // Supabase states
  const [isAutoSyncEnabled, setIsAutoSyncEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('sb_autosync') === 'true';
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem('sb_last_synced_at');
  });
  const [supabaseStatus, setSupabaseStatus] = useState<{ success: boolean; message: string; tableExists: boolean } | null>(null);


  // Local storage synchronization
  useEffect(() => {
    try {
      const storedConfig = localStorage.getItem('sb_business_config');
      const storedProducts = localStorage.getItem('sb_products');
      const storedCustomers = localStorage.getItem('sb_customers');
      const storedSuppliers = localStorage.getItem('sb_suppliers');
      const storedExpenses = localStorage.getItem('sb_expenses');
      const storedInvoices = localStorage.getItem('sb_invoices');
      const storedPurchases = localStorage.getItem('sb_purchases');
      const storedJournals = localStorage.getItem('sb_journals');
      const storedMovements = localStorage.getItem('sb_stock_movements');
      const storedNotifications = localStorage.getItem('sb_notifications');
      const storedRole = localStorage.getItem('sb_role');

      if (storedConfig) setBusinessConfigState(JSON.parse(storedConfig));
      
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(INITIAL_PRODUCTS);
      }

      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      } else {
        setCustomers(INITIAL_CUSTOMERS);
      }

      if (storedSuppliers) {
        setSuppliers(JSON.parse(storedSuppliers));
      } else {
        setSuppliers(INITIAL_SUPPLIERS);
      }

      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      } else {
        setExpenses(INITIAL_EXPENSES);
      }

      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices));
      } else {
        setInvoices(INITIAL_INVOICES);
      }

      if (storedPurchases) {
        setPurchases(JSON.parse(storedPurchases));
      } else {
        setPurchases(INITIAL_PURCHASES);
      }

      if (storedJournals) {
        setJournals(JSON.parse(storedJournals));
      } else {
        setJournals(INITIAL_JOURNALS);
      }

      if (storedMovements) {
        setStockMovements(JSON.parse(storedMovements));
      } else {
        setStockMovements([]);
      }

      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        setNotifications([]);
      }

      if (storedRole) {
        setCurrentUserRole(storedRole as UserRole);
      }
    } catch (e) {
      console.error("Failed to load initial local state structures", e);
    }
  }, []);

  // Check Supabase connection on loading
  useEffect(() => {
    if (hasSupabaseConfig) {
      checkSupabaseConnection();
    }
  }, []);

  const checkSupabaseConnection = async () => {
    const result = await testSupabaseConnection();
    setSupabaseStatus(result);
  };

  const setIsAutoSyncEnabled = (val: boolean) => {
    setIsAutoSyncEnabledState(val);
    localStorage.setItem('sb_autosync', val ? 'true' : 'false');
  };

  const backupToSupabase = async (): Promise<SyncResult> => {
    setIsSyncing(true);
    try {
      const payload = {
        sb_business_config: businessConfig,
        sb_products: products,
        sb_customers: customers,
        sb_suppliers: suppliers,
        sb_expenses: expenses,
        sb_invoices: invoices,
        sb_purchases: purchases,
        sb_journals: journals,
        sb_stock_movements: stockMovements,
        sb_notifications: notifications,
      };
      const res = await pushDataToSupabase(payload);
      if (res.success) {
        const nowStr = new Date().toLocaleTimeString() + ' ' + getTodayBS();
        setLastSyncedAt(nowStr);
        localStorage.setItem('sb_last_synced_at', nowStr);
      }
      return res;
    } catch (err: any) {
      return { success: false, message: 'Cloud backup operation failed', error: err?.message || String(err) };
    } finally {
      setIsSyncing(false);
    }
  };

  const restoreFromSupabase = async (): Promise<SyncResult> => {
    setIsSyncing(true);
    try {
      const res = await pullDataFromSupabase();
      if (res.success && res.data) {
        const {
          sb_business_config,
          sb_products,
          sb_customers,
          sb_suppliers,
          sb_expenses,
          sb_invoices,
          sb_purchases,
          sb_journals,
          sb_stock_movements,
          sb_notifications,
        } = res.data;

        if (sb_business_config) {
          setBusinessConfigState(sb_business_config);
          localStorage.setItem('sb_business_config', JSON.stringify(sb_business_config));
        }
        if (sb_products) {
          setProducts(sb_products);
          localStorage.setItem('sb_products', JSON.stringify(sb_products));
        }
        if (sb_customers) {
          setCustomers(sb_customers);
          localStorage.setItem('sb_customers', JSON.stringify(sb_customers));
        }
        if (sb_suppliers) {
          setSuppliers(sb_suppliers);
          localStorage.setItem('sb_suppliers', JSON.stringify(sb_suppliers));
        }
        if (sb_expenses) {
          setExpenses(sb_expenses);
          localStorage.setItem('sb_expenses', JSON.stringify(sb_expenses));
        }
        if (sb_invoices) {
          setInvoices(sb_invoices);
          localStorage.setItem('sb_invoices', JSON.stringify(sb_invoices));
        }
        if (sb_purchases) {
          setPurchases(sb_purchases);
          localStorage.setItem('sb_purchases', JSON.stringify(sb_purchases));
        }
        if (sb_journals) {
          setJournals(sb_journals);
          localStorage.setItem('sb_journals', JSON.stringify(sb_journals));
        }
        if (sb_stock_movements) {
          setStockMovements(sb_stock_movements);
          localStorage.setItem('sb_stock_movements', JSON.stringify(sb_stock_movements));
        }
        if (sb_notifications) {
          setNotifications(sb_notifications);
          localStorage.setItem('sb_notifications', JSON.stringify(sb_notifications));
        }

        const nowStr = new Date().toLocaleTimeString() + ' ' + getTodayBS();
        setLastSyncedAt(nowStr);
        localStorage.setItem('sb_last_synced_at', nowStr);

        return { success: true, message: 'All business modules successfully synced down and restored from Supabase!' };
      } else {
        return { success: false, message: res.message, error: res.error };
      }
    } catch (err: any) {
      return { success: false, message: 'Restore failed', error: err?.message || String(err) };
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync mechanism
  useEffect(() => {
    if (!isAutoSyncEnabled || !hasSupabaseConfig) return;

    // Debounce pushing to prevent rate limits and smooth performance
    const timer = setTimeout(() => {
      const payload = {
        sb_business_config: businessConfig,
        sb_products: products,
        sb_customers: customers,
        sb_suppliers: suppliers,
        sb_expenses: expenses,
        sb_invoices: invoices,
        sb_purchases: purchases,
        sb_journals: journals,
        sb_stock_movements: stockMovements,
        sb_notifications: notifications,
      };

      pushDataToSupabase(payload).then((res) => {
        if (res.success) {
          const nowStr = new Date().toLocaleTimeString() + ' ' + getTodayBS();
          setLastSyncedAt(nowStr);
          localStorage.setItem('sb_last_synced_at', nowStr);
        }
      }).catch((err) => {
        console.error("Auto-sync background error: ", err);
      });
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [
    isAutoSyncEnabled,
    businessConfig,
    products,
    customers,
    suppliers,
    expenses,
    invoices,
    purchases,
    journals,
    stockMovements,
    notifications,
  ]);


  // Set updates helper & persistence
  const saveToLocalStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Local storage sync error: ", e);
    }
  };

  const setBusinessConfig = (config: BusinessConfig) => {
    setBusinessConfigState(config);
    saveToLocalStorage('sb_business_config', config);
  };

  const updateProductsAndPersist = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveToLocalStorage('sb_products', newProducts);
  };

  const updateCustomersAndPersist = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    saveToLocalStorage('sb_customers', newCustomers);
  };

  const updateSuppliersAndPersist = (newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
    saveToLocalStorage('sb_suppliers', newSuppliers);
  };

  const updateExpensesAndPersist = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    saveToLocalStorage('sb_expenses', newExpenses);
  };

  const updateInvoicesAndPersist = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    saveToLocalStorage('sb_invoices', newInvoices);
  };

  const updatePurchasesAndPersist = (newPurchases: Purchase[]) => {
    setPurchases(newPurchases);
    saveToLocalStorage('sb_purchases', newPurchases);
  };

  const updateJournalsAndPersist = (newJournals: JournalEntry[]) => {
    setJournals(newJournals);
    saveToLocalStorage('sb_journals', newJournals);
  };

  const updateMovementsAndPersist = (newMovements: StockMovement[]) => {
    setStockMovements(newMovements);
    saveToLocalStorage('sb_stock_movements', newMovements);
  };

  const updateNotificationsAndPersist = (newNotifications: AlertNotification[]) => {
    setNotifications(newNotifications);
    saveToLocalStorage('sb_notifications', newNotifications);
  };

  const handleSetRole = (role: UserRole) => {
    setCurrentUserRole(role);
    localStorage.setItem('sb_role', role);
  };

  // Notification actions
  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    updateNotificationsAndPersist(updated);
  };

  const clearNotifications = () => {
    updateNotificationsAndPersist([]);
  };

  // CORE BUSINESS OPERATING WORKFLOWS

  /**
   * Action: Create invoice
   * Automatically:
   * 1. Appends invoice (assigned custom serial sequence e.g., SB-2083-[Seq])
   * 2. Decrements product stock quantities in state
   * 3. Logs sales StockMovements
   * 4. Updates customer outstanding dues & aggregates
   * 5. Spawns Double Entry Booking Journal entries
   * 6. Triggers alerts for low stock items
   */
  const submitInvoice = (invoiceBase: Omit<Invoice, 'id' | 'invoiceNo' | 'date' | 'bsDate'>) => {
    const adDate = new Date().toISOString().split('T')[0];
    const bsDateStr = getTodayBS();
    const invoiceId = `inv-${Date.now()}`;
    
    // Gen invoice number
    const sequence = (invoices.length + 1).toString().padStart(4, '0');
    const invoiceNumber = `SB-${bsDateStr.split('-')[0]}-${sequence}`;

    const completeInvoice: Invoice = {
      ...invoiceBase,
      id: invoiceId,
      invoiceNo: invoiceNumber,
      date: adDate,
      bsDate: bsDateStr,
    };

    // 1. Invoices list append
    const updatedInvoices = [completeInvoice, ...invoices];
    updateInvoicesAndPersist(updatedInvoices);

    // 2. Adjust product stock & triggers warning alerts
    const updatedProducts = [...products];
    const newStockMovements = [...stockMovements];
    const newNotifications = [...notifications];

    completeInvoice.items.forEach(item => {
      const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIdx !== -1) {
        const prod = updatedProducts[prodIdx];
        const prevQty = prod.stockQty;
        const nextQty = Math.max(0, prevQty - item.quantity);
        
        // Update product in memory
        updatedProducts[prodIdx] = {
          ...prod,
          stockQty: nextQty
        };

        // Stock movement log
        newStockMovements.unshift({
          id: `sm-sale-${Date.now()}-${Math.random()}`,
          productId: prod.id,
          productName: prod.name,
          type: 'sale',
          quantity: item.quantity,
          date: adDate,
          bsDate: bsDateStr,
          referenceId: invoiceNumber,
        });

        // Trigger Alert if stock dips below thresh
        if (nextQty <= prod.minStockAlert) {
          newNotifications.unshift({
            id: `notif-low-${Date.now()}-${Math.random()}`,
            type: 'warning',
            title: 'Critical Stock Level Alert',
            message: `${prod.name} has decreased to ${nextQty} ${prod.unit}s. Please trigger a new purchase order soon.`,
            date: bsDateStr,
            isRead: false
          });
        }
      }
    });
    updateProductsAndPersist(updatedProducts);
    updateMovementsAndPersist(newStockMovements);

    // 3. Update customer outstanding balance if NOT Walk-in
    if (completeInvoice.customerId !== 'walk-in') {
      const updatedCustomers = customers.map(cust => {
        if (cust.id === completeInvoice.customerId) {
          const newPurchasesAmt = cust.totalPurchases + completeInvoice.grandTotal;
          const newPaidAmt = cust.totalPaid + completeInvoice.paidAmount;
          const newDueAmt = Math.max(0, cust.outstandingDue + completeInvoice.dueAmount);
          
          // Append client alert if due exceeds Rs 10000
          if (completeInvoice.dueAmount > 0 && newDueAmt > 10000) {
            newNotifications.unshift({
              id: `notif-due-${Date.now()}`,
              type: 'danger',
              title: 'Credit Dues Threshold Warning',
              message: `Customer ${cust.name} carries a total unpaid credit statement of Rs. ${newDueAmt.toLocaleString()}`,
              date: bsDateStr,
              isRead: false
            });
          }

          return {
            ...cust,
            totalPurchases: newPurchasesAmt,
            totalPaid: newPaidAmt,
            outstandingDue: newDueAmt
          };
        }
        return cust;
      });
      updateCustomersAndPersist(updatedCustomers);
    } else {
      // Walk-in ledger aggregates
      const updatedCustomers = customers.map(cust => {
        if (cust.id === 'walk-in') {
          return {
            ...cust,
            totalPurchases: cust.totalPurchases + completeInvoice.grandTotal,
            totalPaid: cust.totalPaid + completeInvoice.grandTotal,
          };
        }
        return cust;
      });
      updateCustomersAndPersist(updatedCustomers);
    }

    // 4. Record accounting double-entry behind-the-scenes
    const newJournals = [...journals];
    
    // Debit Receivables or Cash Account
    // Credit Sales accounts
    if (completeInvoice.paidAmount > 0) {
      newJournals.unshift({
        id: `journal-${Date.now()}-1`,
        date: adDate,
        bsDate: bsDateStr,
        description: `Invoice ${invoiceNumber} cash payment receipt (${completeInvoice.paymentMethod})`,
        reference: invoiceNumber,
        debitAccount: "Cash / Fonepay Receivables",
        creditAccount: "Sales Revenue",
        amount: completeInvoice.paidAmount
      });
    }

    if (completeInvoice.dueAmount > 0) {
      newJournals.unshift({
        id: `journal-${Date.now()}-2`,
        date: adDate,
        bsDate: bsDateStr,
        description: `Invoice ${invoiceNumber} credit dispatch balance booking`,
        reference: invoiceNumber,
        debitAccount: "Accounts Receivable (Customers)",
        creditAccount: "Sales Revenue",
        amount: completeInvoice.dueAmount
      });
    }

    // Capture standard cost of goods sold if estimated (e.g., 60% average or computed rate)
    // To keep simple accounting readable, we map revenue and asset changes directly
    updateJournalsAndPersist(newJournals);
    updateNotificationsAndPersist(newNotifications);

    return completeInvoice;
  };

  /**
   * Action: Refund/Cancel Invoice
   * Automatically reverses bookkeeping and returns stock
   */
  const refundInvoice = (invoiceId: string) => {
    const foundInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!foundInvoice) return;

    const adDate = new Date().toISOString().split('T')[0];
    const bsDateStr = getTodayBS();

    // 1. Switch invoice status to Unpaid / Refunded
    const updatedInvoices = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, status: 'Draft' as const, notes: `${inv.notes || ''} [Voided/Refunded on ${bsDateStr}]` };
      }
      return inv;
    });
    updateInvoicesAndPersist(updatedInvoices);

    // 2. Add back items to stock
    const updatedProducts = [...products];
    const newStockMovements = [...stockMovements];

    foundInvoice.items.forEach(item => {
      const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIdx !== -1) {
        const prod = updatedProducts[prodIdx];
        updatedProducts[prodIdx] = {
          ...prod,
          stockQty: prod.stockQty + item.quantity
        };

        newStockMovements.unshift({
          id: `sm-return-${Date.now()}-${Math.random()}`,
          productId: prod.id,
          productName: prod.name,
          type: 'return',
          quantity: item.quantity,
          date: adDate,
          bsDate: bsDateStr,
          referenceId: foundInvoice.invoiceNo,
          notes: "Invoice Refund / Returned"
        });
      }
    });

    updateProductsAndPersist(updatedProducts);
    updateMovementsAndPersist(newStockMovements);

    // 3. Reverse customer balances
    if (foundInvoice.customerId !== 'walk-in') {
      const updatedCustomers = customers.map(cust => {
        if (cust.id === foundInvoice.customerId) {
          return {
            ...cust,
            totalPurchases: Math.max(0, cust.totalPurchases - foundInvoice.grandTotal),
            totalPaid: Math.max(0, cust.totalPaid - foundInvoice.paidAmount),
            outstandingDue: Math.max(0, cust.outstandingDue - foundInvoice.dueAmount)
          };
        }
        return cust;
      });
      updateCustomersAndPersist(updatedCustomers);
    }

    // 4. Post debit refund/reversal journal
    const newJournals = [...journals];
    newJournals.unshift({
      id: `journal-ref-${Date.now()}`,
      date: adDate,
      bsDate: bsDateStr,
      description: `Voided & Reversed Sales Billing: ${foundInvoice.invoiceNo}`,
      reference: foundInvoice.invoiceNo,
      debitAccount: "Sales Revenue",
      creditAccount: foundInvoice.dueAmount > 0 ? "Accounts Receivable (Customers)" : "Cash / Fonepay Receivables",
      amount: foundInvoice.grandTotal
    });
    updateJournalsAndPersist(newJournals);
  };

  /**
   * Action: Submit purchase invoice/bill
   * Automatically:
   * 1. Increases stock quantities
   * 2. Log purchase StockMovements
   * 3. Increments Supplier dues & transactions ledger
   * 4. Books Journal entry in Double Entry accounting (Debit Inventory, Credit Accounts Payable / Cash)
   */
  const submitPurchase = (purchaseBase: Omit<Purchase, 'id' | 'date' | 'bsDate'>) => {
    const adDate = new Date().toISOString().split('T')[0];
    const bsDateStr = getTodayBS();
    const purchaseId = `pur-${Date.now()}`;

    const completePurchase: Purchase = {
      ...purchaseBase,
      id: purchaseId,
      date: adDate,
      bsDate: bsDateStr,
    };

    updatePurchasesAndPersist([completePurchase, ...purchases]);

    // 1. Increase stock Qty in state
    const updatedProducts = [...products];
    const newStockMovements = [...stockMovements];

    completePurchase.items.forEach(item => {
      const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIdx !== -1) {
        const prod = updatedProducts[prodIdx];
        updatedProducts[prodIdx] = {
          ...prod,
          stockQty: prod.stockQty + item.quantity
        };

        newStockMovements.unshift({
          id: `sm-pur-${Date.now()}-${Math.random()}`,
          productId: prod.id,
          productName: prod.name,
          type: 'purchase',
          quantity: item.quantity,
          date: adDate,
          bsDate: bsDateStr,
          referenceId: completePurchase.billNo,
        });
      }
    });
    updateProductsAndPersist(updatedProducts);
    updateMovementsAndPersist(newStockMovements);

    // 2. Adjust Supplier Ledgers & outstanding dues
    const updatedSuppliers = suppliers.map(supp => {
      if (supp.id === completePurchase.supplierId) {
        return {
          ...supp,
          totalPurchased: supp.totalPurchased + completePurchase.grandTotal,
          totalPaid: supp.totalPaid + completePurchase.paidAmount,
          outstandingDue: supp.outstandingDue + completePurchase.dueAmount
        };
      }
      return supp;
    });
    updateSuppliersAndPersist(updatedSuppliers);

    // 3. Book Double Entry Journal
    const newJournals = [...journals];
    newJournals.unshift({
      id: `journal-pur-${Date.now()}`,
      date: adDate,
      bsDate: bsDateStr,
      description: `Inventory stock purchase from ${completePurchase.supplierName} (Bill: ${completePurchase.billNo})`,
      reference: completePurchase.billNo,
      debitAccount: "Inventory Assets",
      creditAccount: completePurchase.dueAmount > 0 ? "Accounts Payable (Suppliers)" : "Cash / Bank Accounts",
      amount: completePurchase.grandTotal
    });
    updateJournalsAndPersist(newJournals);

    return completePurchase;
  };

  /**
   * Action: Log an business expense
   * Automatically records standard bookkeeping logs
   */
  const submitExpense = (expenseBase: Omit<Expense, 'id' | 'date' | 'bsDate'>) => {
    const adDate = new Date().toISOString().split('T')[0];
    const bsDateStr = getTodayBS();
    const expenseId = `exp-${Date.now()}`;

    const completeExpense: Expense = {
      ...expenseBase,
      id: expenseId,
      date: adDate,
      bsDate: bsDateStr,
    };

    updateExpensesAndPersist([completeExpense, ...expenses]);

    // Book accounting double-entry
    const newJournals = [...journals];
    newJournals.unshift({
      id: `journal-exp-${Date.now()}`,
      date: adDate,
      bsDate: bsDateStr,
      description: `Commercial expense recorded: ${completeExpense.title}`,
      reference: `EXP-${expenseId.slice(-6).toUpperCase()}`,
      debitAccount: `Operational Expense - ${completeExpense.category}`,
      creditAccount: "Cash / Bank Accounts",
      amount: completeExpense.amount
    });
    updateJournalsAndPersist(newJournals);

    return completeExpense;
  };

  /**
   * Add new product safely
   */
  const submitProduct = (prodBase: Omit<Product, 'id'>) => {
    const adDate = new Date().toISOString().split('T')[0];
    const bsDateStr = getTodayBS();
    const prodId = `prod-${Date.now()}`;

    const completeProduct: Product = {
      ...prodBase,
      id: prodId
    };

    updateProductsAndPersist([...products, completeProduct]);

    // If initial stock quantity is supplied, log an opening stock adjustment record
    if (completeProduct.stockQty > 0) {
      const newStockMovements = [...stockMovements];
      newStockMovements.unshift({
        id: `sm-adj-${Date.now()}`,
        productId: prodId,
        productName: completeProduct.name,
        type: 'adjustment_add',
        quantity: completeProduct.stockQty,
        date: adDate,
        bsDate: bsDateStr,
        referenceId: 'Opening Stock',
        notes: "Opening balance configuration"
      });
      updateMovementsAndPersist(newStockMovements);

      const newJournals = [...journals];
      newJournals.unshift({
        id: `journal-init-${Date.now()}`,
        date: adDate,
        bsDate: bsDateStr,
        description: `Opening Stock configuration setup: ${completeProduct.name}`,
        reference: "Opening Stock",
        debitAccount: "Inventory Assets",
        creditAccount: "Owner's Equity Capital / Retained Earnings",
        amount: completeProduct.stockQty * completeProduct.purchasePrice
      });
      updateJournalsAndPersist(newJournals);
    }

    return completeProduct;
  };

  /**
   * Action: Manual stock adjustments
   */
  const adjustStockQuantity = (productId: string, changeQty: number, reason: string) => {
    const adDate = new Date().toISOString().split('T')[0];
    const bsDateStr = getTodayBS();
    
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        const nextQty = Math.max(0, p.stockQty + changeQty);
        
        // Push stock movement log
        const updatedMovements = [...stockMovements];
        updatedMovements.unshift({
          id: `sm-adj-${Date.now()}`,
          productId: p.id,
          productName: p.name,
          type: changeQty >= 0 ? 'adjustment_add' : 'adjustment_sub',
          quantity: Math.abs(changeQty),
          date: adDate,
          bsDate: bsDateStr,
          referenceId: 'Manual Adj',
          notes: reason
        });
        updateMovementsAndPersist(updatedMovements);

        // Accounting bookkeeping reconciliation
        const newJournals = [...journals];
        newJournals.unshift({
          id: `journal-reconcile-${Date.now()}`,
          date: adDate,
          bsDate: bsDateStr,
          description: `Stock Reconciliation: ${p.name} adjusted due to ${reason}`,
          reference: "Reconcile",
          debitAccount: changeQty >= 0 ? "Inventory Assets" : "Stock Loss Account",
          creditAccount: changeQty >= 0 ? "Stock Surplus (Other Income)" : "Inventory Assets",
          amount: Math.abs(changeQty) * p.purchasePrice
        });
        updateJournalsAndPersist(newJournals);

        return {
          ...p,
          stockQty: nextQty
        };
      }
      return p;
    });

    updateProductsAndPersist(updatedProducts);
  };

  /**
   * Add new Customer Profile safely
   */
  const submitCustomer = (custBase: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'outstandingDue'>) => {
    const custId = `cust-${Date.now()}`;
    const completeCustomer: Customer = {
      ...custBase,
      id: custId,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingDue: 0,
    };

    updateCustomersAndPersist([...customers, completeCustomer]);
    return completeCustomer;
  };

  /**
   * Add new Supplier Profile safely
   */
  const submitSupplier = (suppBase: Omit<Supplier, 'id' | 'totalPurchased' | 'totalPaid' | 'outstandingDue'>) => {
    const suppId = `supp-${Date.now()}`;
    const completeSupplier: Supplier = {
      ...suppBase,
      id: suppId,
      totalPurchased: 0,
      totalPaid: 0,
      outstandingDue: 0,
    };

    updateSuppliersAndPersist([...suppliers, completeSupplier]);
    return completeSupplier;
  };

  /**
   * Hard reset back to authentic defaults
   */
  const resetToDefault = () => {
    localStorage.clear();
    setBusinessConfigState(INITIAL_BUSINESS_CONFIG);
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setExpenses(INITIAL_EXPENSES);
    setInvoices(INITIAL_INVOICES);
    setPurchases(INITIAL_PURCHASES);
    setJournals(INITIAL_JOURNALS);

    setStockMovements([]);
    setNotifications([]);
    setCurrentUserRole('Owner');

    localStorage.setItem('sb_business_config', JSON.stringify(INITIAL_BUSINESS_CONFIG));
    localStorage.setItem('sb_products', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('sb_customers', JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem('sb_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
    localStorage.setItem('sb_expenses', JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem('sb_invoices', JSON.stringify(INITIAL_INVOICES));
    localStorage.setItem('sb_purchases', JSON.stringify(INITIAL_PURCHASES));
    localStorage.setItem('sb_journals', JSON.stringify(INITIAL_JOURNALS));
    localStorage.setItem('sb_stock_movements', JSON.stringify([]));
    localStorage.setItem('sb_notifications', JSON.stringify([]));
    localStorage.setItem('sb_role', 'Owner');
  };

  return (
    <AppContext.Provider
      value={{
        businessConfig,
        setBusinessConfig,
        products,
        setProducts: updateProductsAndPersist,
        customers,
        setCustomers: updateCustomersAndPersist,
        suppliers,
        setSuppliers: updateSuppliersAndPersist,
        expenses,
        setExpenses: updateExpensesAndPersist,
        invoices,
        setInvoices: updateInvoicesAndPersist,
        purchases,
        setPurchases: updatePurchasesAndPersist,
        journals,
        setJournals: updateJournalsAndPersist,
        stockMovements,
        setStockMovements: updateMovementsAndPersist,
        currentUserRole,
        setCurrentUserRole: handleSetRole,
        notifications,
        clearNotifications,
        markNotificationRead,
        submitInvoice,
        refundInvoice,
        submitPurchase,
        submitExpense,
        submitProduct,
        submitCustomer,
        submitSupplier,
        adjustStockQuantity,
        resetToDefault,
        isSupabaseConfigured: hasSupabaseConfig,
        isAutoSyncEnabled,
        setIsAutoSyncEnabled,
        supabaseStatus,
        checkSupabaseConnection,
        backupToSupabase,
        restoreFromSupabase,
        lastSyncedAt,
        isSyncing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
