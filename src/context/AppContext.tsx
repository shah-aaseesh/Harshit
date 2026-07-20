import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Product, Customer, Supplier, Expense, Invoice, Purchase, 
  JournalEntry, BusinessConfig, StockMovement, UserRole, Receipt 
} from '../types';
import { 
  INITIAL_BUSINESS_CONFIG, INITIAL_PRODUCTS, INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, INITIAL_EXPENSES, INITIAL_INVOICES, 
  INITIAL_PURCHASES, INITIAL_JOURNALS 
} from '../utils/initialData';
import { convertADtoBS, getTodayBS } from '../utils/nepaliCalendar';
import { 
  testSupabaseConnection, pushDataToSupabase, pullDataFromSupabase, 
  hasSupabaseConfig, SyncResult, supabase 
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
  receipts: Receipt[];
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
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
  submitCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'outstandingDue'> & { openingDue?: number }) => Customer;
  submitSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchased' | 'totalPaid' | 'outstandingDue'> & { openingDue?: number }) => Supplier;
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

  // Multiple Business Profiles
  activeBusinessId: 'b1' | 'b2';
  switchBusinessProfile: (profileId: 'b1' | 'b2') => void;
  hasSecondBusiness: boolean;
  enableSecondBusiness: (name: string) => void;

  // Auth additions
  session: any;
  user: any;
  loadingAuth: boolean;
  signOut: () => Promise<void>;
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
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Owner');
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  // Auth states
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Supabase states
  const [isAutoSyncEnabled, setIsAutoSyncEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('sb_autosync') === 'true';
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem('sb_last_synced_at');
  });
  const [supabaseStatus, setSupabaseStatus] = useState<{ success: boolean; message: string; tableExists: boolean } | null>(null);

  // Business Profiles State
  const [activeBusinessId, setActiveBusinessIdState] = useState<'b1' | 'b2'>(() => {
    return (localStorage.getItem('sb_active_business_id') as 'b1' | 'b2') || 'b1';
  });

  const [hasSecondBusiness, setHasSecondBusiness] = useState<boolean>(() => {
    return localStorage.getItem('sb_has_second_business') === 'true';
  });

  const enableSecondBusiness = (name: string) => {
    localStorage.setItem('sb_has_second_business', 'true');
    setHasSecondBusiness(true);

    const secondaryConfig = {
      ...INITIAL_BUSINESS_CONFIG,
      name: name || "Classic Stationery & Distributors",
      nepaliName: "क्लासिक स्टेशनरी एण्ड डिस्ट्रिब्युटर्स",
      address: "Biratnagar, Nepal",
      phone: "+977-21-555123",
      panVat: "601234567",
      slogan: "Wholesale Office & Paper Merchants",
    };

    localStorage.setItem('sb_business_config_b2', JSON.stringify(secondaryConfig));
    if (activeBusinessId === 'b2') {
      setBusinessConfigState(secondaryConfig);
    }
  };

  const loadProfileData = (profileId: 'b1' | 'b2') => {
    try {
      const getPrefixedKey = (key: string) => profileId === 'b1' ? key : `${key}_b2`;

      const storedConfig = localStorage.getItem(getPrefixedKey('sb_business_config'));
      const storedProducts = localStorage.getItem(getPrefixedKey('sb_products'));
      const storedCustomers = localStorage.getItem(getPrefixedKey('sb_customers'));
      const storedSuppliers = localStorage.getItem(getPrefixedKey('sb_suppliers'));
      const storedExpenses = localStorage.getItem(getPrefixedKey('sb_expenses'));
      const storedInvoices = localStorage.getItem(getPrefixedKey('sb_invoices'));
      const storedPurchases = localStorage.getItem(getPrefixedKey('sb_purchases'));
      const storedJournals = localStorage.getItem(getPrefixedKey('sb_journals'));
      const storedReceipts = localStorage.getItem(getPrefixedKey('sb_receipts'));
      const storedMovements = localStorage.getItem(getPrefixedKey('sb_stock_movements'));
      const storedNotifications = localStorage.getItem(getPrefixedKey('sb_notifications'));
      const storedRole = localStorage.getItem('sb_role');

      if (storedConfig) {
        setBusinessConfigState(JSON.parse(storedConfig));
      } else {
        if (profileId === 'b2') {
          // Unique default config for second business to clearly distinguish them
          setBusinessConfigState({
            ...INITIAL_BUSINESS_CONFIG,
            name: "Classic Stationery & Distributors",
            nepaliName: "क्लासिक स्टेशनरी एण्ड डिस्ट्रिब्युटर्स",
            address: "Biratnagar, Nepal",
            phone: "+977-21-555123",
            panVat: "601234567",
            slogan: "Wholesale Office & Paper Merchants",
          });
        } else {
          setBusinessConfigState(INITIAL_BUSINESS_CONFIG);
        }
      }
      
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(profileId === 'b1' ? INITIAL_PRODUCTS : []);
      }

      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      } else {
        setCustomers(profileId === 'b1' ? INITIAL_CUSTOMERS : []);
      }

      if (storedSuppliers) {
        setSuppliers(JSON.parse(storedSuppliers));
      } else {
        setSuppliers(profileId === 'b1' ? INITIAL_SUPPLIERS : []);
      }

      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      } else {
        setExpenses(profileId === 'b1' ? INITIAL_EXPENSES : []);
      }

      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices));
      } else {
        setInvoices(profileId === 'b1' ? INITIAL_INVOICES : []);
      }

      if (storedPurchases) {
        setPurchases(JSON.parse(storedPurchases));
      } else {
        setPurchases(profileId === 'b1' ? INITIAL_PURCHASES : []);
      }

      if (storedJournals) {
        setJournals(JSON.parse(storedJournals));
      } else {
        setJournals(profileId === 'b1' ? INITIAL_JOURNALS : []);
      }

      if (storedReceipts) {
        setReceipts(JSON.parse(storedReceipts));
      } else {
        setReceipts([]);
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
  };

  const switchBusinessProfile = (profileId: 'b1' | 'b2') => {
    if (profileId === activeBusinessId) return;

    // 1. Persist the current active states into current profile's local storage keys before unloading
    const getOldPrefixedKey = (key: string) => activeBusinessId === 'b1' ? key : `${key}_b2`;

    localStorage.setItem(getOldPrefixedKey('sb_business_config'), JSON.stringify(businessConfig));
    localStorage.setItem(getOldPrefixedKey('sb_products'), JSON.stringify(products));
    localStorage.setItem(getOldPrefixedKey('sb_customers'), JSON.stringify(customers));
    localStorage.setItem(getOldPrefixedKey('sb_suppliers'), JSON.stringify(suppliers));
    localStorage.setItem(getOldPrefixedKey('sb_expenses'), JSON.stringify(expenses));
    localStorage.setItem(getOldPrefixedKey('sb_invoices'), JSON.stringify(invoices));
    localStorage.setItem(getOldPrefixedKey('sb_purchases'), JSON.stringify(purchases));
    localStorage.setItem(getOldPrefixedKey('sb_journals'), JSON.stringify(journals));
    localStorage.setItem(getOldPrefixedKey('sb_stock_movements'), JSON.stringify(stockMovements));
    localStorage.setItem(getOldPrefixedKey('sb_receipts'), JSON.stringify(receipts));
    localStorage.setItem(getOldPrefixedKey('sb_notifications'), JSON.stringify(notifications));

    // 2. Switch active business ID state
    setActiveBusinessIdState(profileId);
    localStorage.setItem('sb_active_business_id', profileId);

    // 3. Load the selected profile's dataset
    loadProfileData(profileId);
  };

  // Local storage synchronization on load
  useEffect(() => {
    loadProfileData(activeBusinessId);
  }, []);

  // Check Supabase connection on loading
  useEffect(() => {
    if (hasSupabaseConfig) {
      checkSupabaseConnection();
    }
  }, []);

  // Listen to Supabase Auth changes
  useEffect(() => {
    if (!supabase) {
      setLoadingAuth(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentUserRole('Owner'); // Every authenticated operator is an Owner
      }
      setLoadingAuth(false);
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentUserRole('Owner'); // Every authenticated operator is an Owner

        // Pull fresh data from cloud on sign in to sync state
        if (event === 'SIGNED_IN') {
          restoreFromSupabase();
        }
      }
      setLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    // 1. Wipe all localStorage keys prefixed with 'sb_'
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb_')) {
        localStorage.removeItem(key);
      }
    }
    
    // 2. Reset App React state variables back to default initial values
    setBusinessConfigState(INITIAL_BUSINESS_CONFIG);
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setExpenses(INITIAL_EXPENSES);
    setInvoices(INITIAL_INVOICES);
    setPurchases(INITIAL_PURCHASES);
    setJournals(INITIAL_JOURNALS);
    setStockMovements([]);
    setReceipts([]);
    setNotifications([]);
    setCurrentUserRole('Owner');
    setIsAutoSyncEnabledState(false);
    setLastSyncedAt(null);
    setSupabaseStatus(null);
    setActiveBusinessIdState('b1');
    setHasSecondBusiness(false);

    // 3. Clear session and user contexts
    setSession(null);
    setUser(null);
  };

  // Auto-sync: debounce 3s after any data change, then silently push to Supabase
  const isFirstLoad = React.useRef(true);
  useEffect(() => {
    if (!hasSupabaseConfig) return;
    // Skip the very first render — data just loaded from localStorage
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    const timer = setTimeout(() => {
      backupToSupabase().then(res => {
        if (!res.success) {
          console.warn('[SajiloBiz Sync] Auto-sync failed:', res.error);
        }
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [
    businessConfig, products, customers, suppliers,
    expenses, invoices, purchases, journals, stockMovements, receipts
  ]);

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
      const getPrefixedKey = (k: string) => activeBusinessId === 'b1' ? k : `${k}_b2`;
      const payload = {
        [getPrefixedKey('sb_business_config')]: businessConfig,
        [getPrefixedKey('sb_products')]: products,
        [getPrefixedKey('sb_customers')]: customers,
        [getPrefixedKey('sb_suppliers')]: suppliers,
        [getPrefixedKey('sb_expenses')]: expenses,
        [getPrefixedKey('sb_invoices')]: invoices,
        [getPrefixedKey('sb_purchases')]: purchases,
        [getPrefixedKey('sb_journals')]: journals,
        [getPrefixedKey('sb_stock_movements')]: stockMovements,
        [getPrefixedKey('sb_receipts')]: receipts,
        [getPrefixedKey('sb_notifications')]: notifications,
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
        const getPrefixedKey = (k: string) => activeBusinessId === 'b1' ? k : `${k}_b2`;

        const bConfig = res.data[getPrefixedKey('sb_business_config')];
        const bProducts = res.data[getPrefixedKey('sb_products')];
        const bCustomers = res.data[getPrefixedKey('sb_customers')];
        const bSuppliers = res.data[getPrefixedKey('sb_suppliers')];
        const bExpenses = res.data[getPrefixedKey('sb_expenses')];
        const bInvoices = res.data[getPrefixedKey('sb_invoices')];
        const bPurchases = res.data[getPrefixedKey('sb_purchases')];
        const bJournals = res.data[getPrefixedKey('sb_journals')];
        const bMovements = res.data[getPrefixedKey('sb_stock_movements')];
        const bReceipts = res.data[getPrefixedKey('sb_receipts')];
        const bNotifications = res.data[getPrefixedKey('sb_notifications')];

        if (bConfig) {
          setBusinessConfigState(bConfig);
          localStorage.setItem(getPrefixedKey('sb_business_config'), JSON.stringify(bConfig));
        }
        if (bProducts) {
          setProducts(bProducts);
          localStorage.setItem(getPrefixedKey('sb_products'), JSON.stringify(bProducts));
        }
        if (bCustomers) {
          setCustomers(bCustomers);
          localStorage.setItem(getPrefixedKey('sb_customers'), JSON.stringify(bCustomers));
        }
        if (bSuppliers) {
          setSuppliers(bSuppliers);
          localStorage.setItem(getPrefixedKey('sb_suppliers'), JSON.stringify(bSuppliers));
        }
        if (bExpenses) {
          setExpenses(bExpenses);
          localStorage.setItem(getPrefixedKey('sb_expenses'), JSON.stringify(bExpenses));
        }
        if (bInvoices) {
          setInvoices(bInvoices);
          localStorage.setItem(getPrefixedKey('sb_invoices'), JSON.stringify(bInvoices));
        }
        if (bPurchases) {
          setPurchases(bPurchases);
          localStorage.setItem(getPrefixedKey('sb_purchases'), JSON.stringify(bPurchases));
        }
        if (bJournals) {
          setJournals(bJournals);
          localStorage.setItem(getPrefixedKey('sb_journals'), JSON.stringify(bJournals));
        }
        if (bMovements) {
          setStockMovements(bMovements);
          localStorage.setItem(getPrefixedKey('sb_stock_movements'), JSON.stringify(bMovements));
        }
        if (bReceipts) {
          setReceipts(bReceipts);
          localStorage.setItem(getPrefixedKey('sb_receipts'), JSON.stringify(bReceipts));
        }
        if (bNotifications) {
          setNotifications(bNotifications);
          localStorage.setItem(getPrefixedKey('sb_notifications'), JSON.stringify(bNotifications));
        }

        const nowStr = new Date().toLocaleTimeString() + ' ' + getTodayBS();
        setLastSyncedAt(nowStr);
        localStorage.setItem('sb_last_synced_at', nowStr);

        return { success: true, message: 'All business modules successfully synced down and restored from Supabase!' };
      } else {
        if (res.message && res.message.includes('No backed up data found')) {
          resetToDefault();
        }
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
      const getPrefixedKey = (k: string) => activeBusinessId === 'b1' ? k : `${k}_b2`;
      const payload = {
        [getPrefixedKey('sb_business_config')]: businessConfig,
        [getPrefixedKey('sb_products')]: products,
        [getPrefixedKey('sb_customers')]: customers,
        [getPrefixedKey('sb_suppliers')]: suppliers,
        [getPrefixedKey('sb_expenses')]: expenses,
        [getPrefixedKey('sb_invoices')]: invoices,
        [getPrefixedKey('sb_purchases')]: purchases,
        [getPrefixedKey('sb_journals')]: journals,
        [getPrefixedKey('sb_stock_movements')]: stockMovements,
        [getPrefixedKey('sb_receipts')]: receipts,
        [getPrefixedKey('sb_notifications')]: notifications,
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
    activeBusinessId,
    businessConfig,
    products,
    customers,
    suppliers,
    expenses,
    invoices,
    purchases,
    journals,
    stockMovements,
    receipts,
    notifications,
  ]);


  // Set updates helper & persistence
  const saveToLocalStorage = (key: string, data: any) => {
    try {
      const getPrefixedKey = (k: string) => activeBusinessId === 'b1' ? k : `${k}_b2`;
      const prefixedKey = getPrefixedKey(key);
      const serialized = JSON.stringify(data);

      // Warn in dev if a single key grows large (> 1MB)
      if (serialized.length > 1_000_000) {
        console.warn(`[SajiloBiz Storage] Key "${prefixedKey}" is ${(serialized.length / 1024).toFixed(0)}KB — consider enabling Supabase cloud sync.`);
      }

      localStorage.setItem(prefixedKey, serialized);
    } catch (e: any) {
      if (e?.name === 'QuotaExceededError') {
        // Dispatch a custom event so the UI layer (App.tsx) can show a toast
        window.dispatchEvent(new CustomEvent('sajilobiz:storage-full'));
        console.error('[SajiloBiz Storage] localStorage is full! Please back up to Supabase and clear old data from Settings.');
      } else {
        console.error('Local storage sync error: ', e);
      }
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

  const updateReceiptsAndPersist = (newReceipts: Receipt[]) => {
    setReceipts(newReceipts);
    saveToLocalStorage('sb_receipts', newReceipts);
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
  const submitCustomer = (custBase: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'outstandingDue'> & { openingDue?: number }) => {
    const custId = `cust-${Date.now()}`;
    const initialDue = Math.max(0, custBase.openingDue || 0);
    const { openingDue, ...rest } = custBase;
    const completeCustomer: Customer = {
      ...rest,
      id: custId,
      totalPurchases: initialDue,
      totalPaid: 0,
      outstandingDue: initialDue,
    };

    updateCustomersAndPersist([...customers, completeCustomer]);

    if (initialDue > 0) {
      const adDate = new Date().toISOString().split('T')[0];
      const bsDateStr = getTodayBS();
      const newJournals = [...journals];
      newJournals.unshift({
        id: `journal-cust-init-${Date.now()}`,
        date: adDate,
        bsDate: bsDateStr,
        description: `Opening Receivables Credit for Client: ${completeCustomer.name}`,
        reference: `INIT-${completeCustomer.id.slice(-4).toUpperCase()}`,
        debitAccount: "Accounts Receivable (Customers)",
        creditAccount: "Sales Revenue",
        amount: initialDue
      });
      updateJournalsAndPersist(newJournals);
    }

    return completeCustomer;
  };

  /**
   * Add new Supplier Profile safely
   */
  const submitSupplier = (suppBase: Omit<Supplier, 'id' | 'totalPurchased' | 'totalPaid' | 'outstandingDue'> & { openingDue?: number }) => {
    const suppId = `supp-${Date.now()}`;
    const initialDue = Math.max(0, suppBase.openingDue || 0);
    const { openingDue, ...rest } = suppBase;
    const completeSupplier: Supplier = {
      ...rest,
      id: suppId,
      totalPurchased: initialDue,
      totalPaid: 0,
      outstandingDue: initialDue,
    };

    updateSuppliersAndPersist([...suppliers, completeSupplier]);

    if (initialDue > 0) {
      const adDate = new Date().toISOString().split('T')[0];
      const bsDateStr = getTodayBS();
      const newJournals = [...journals];
      newJournals.unshift({
        id: `journal-supp-init-${Date.now()}`,
        date: adDate,
        bsDate: bsDateStr,
        description: `Opening Payable Credit for Supplier: ${completeSupplier.name}`,
        reference: `INIT-${completeSupplier.id.slice(-4).toUpperCase()}`,
        debitAccount: "Purchases / Inventory Assets",
        creditAccount: "Accounts Payable (Suppliers)",
        amount: initialDue
      });
      updateJournalsAndPersist(newJournals);
    }

    return completeSupplier;
  };

  /**
   * Hard reset back to authentic defaults for active business profile
   */
  const resetToDefault = () => {
    const getPrefixedKey = (k: string) => activeBusinessId === 'b1' ? k : `${k}_b2`;

    const config = activeBusinessId === 'b1' ? INITIAL_BUSINESS_CONFIG : {
      ...INITIAL_BUSINESS_CONFIG,
      name: "Classic Stationery & Distributors",
      nepaliName: "क्लासिक स्टेशनरी एण्ड डिस्ट्रिब्युटर्स",
      address: "Biratnagar, Nepal",
      phone: "+977-21-555123",
      panVat: "601234567",
      slogan: "Wholesale Office & Paper Merchants",
    };
    const prods = activeBusinessId === 'b1' ? INITIAL_PRODUCTS : [];
    const custs = activeBusinessId === 'b1' ? INITIAL_CUSTOMERS : [];
    const supps = activeBusinessId === 'b1' ? INITIAL_SUPPLIERS : [];
    const exps = activeBusinessId === 'b1' ? INITIAL_EXPENSES : [];
    const invs = activeBusinessId === 'b1' ? INITIAL_INVOICES : [];
    const purs = activeBusinessId === 'b1' ? INITIAL_PURCHASES : [];
    const jrnls = activeBusinessId === 'b1' ? INITIAL_JOURNALS : [];

    setBusinessConfigState(config);
    setProducts(prods);
    setCustomers(custs);
    setSuppliers(supps);
    setExpenses(exps);
    setInvoices(invs);
    setPurchases(purs);
    setJournals(jrnls);
    setStockMovements([]);
    setNotifications([]);
    setCurrentUserRole('Owner');

    localStorage.setItem(getPrefixedKey('sb_business_config'), JSON.stringify(config));
    localStorage.setItem(getPrefixedKey('sb_products'), JSON.stringify(prods));
    localStorage.setItem(getPrefixedKey('sb_customers'), JSON.stringify(custs));
    localStorage.setItem(getPrefixedKey('sb_suppliers'), JSON.stringify(supps));
    localStorage.setItem(getPrefixedKey('sb_expenses'), JSON.stringify(exps));
    localStorage.setItem(getPrefixedKey('sb_invoices'), JSON.stringify(invs));
    localStorage.setItem(getPrefixedKey('sb_purchases'), JSON.stringify(purs));
    localStorage.setItem(getPrefixedKey('sb_journals'), JSON.stringify(jrnls));
    localStorage.setItem(getPrefixedKey('sb_stock_movements'), JSON.stringify([]));
    localStorage.setItem(getPrefixedKey('sb_notifications'), JSON.stringify([]));
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
        receipts,
        setReceipts: updateReceiptsAndPersist,
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
        activeBusinessId,
        switchBusinessProfile,
        hasSecondBusiness,
        enableSecondBusiness,
        session,
        user,
        loadingAuth,
        signOut,
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
