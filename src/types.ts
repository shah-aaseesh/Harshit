export type UserRole = 'Owner' | 'Manager' | 'Staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  nepaliName?: string;
  sku: string;
  category: string;
  unit: string; // e.g., 'pcs', 'kg', 'ltr', 'box'
  purchasePrice: number;
  sellingPrice: number;
  stockQty: number;
  minStockAlert: number;
  description?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment_add' | 'adjustment_sub' | 'return';
  quantity: number;
  date: string; // AD
  bsDate: string; // BS
  referenceId: string; // invoiceId or purchaseId or 'Adj'
  notes?: string;
}

export interface Customer {
  id: string; // 'walk-in' is a special code
  name: string;
  phone: string;
  address?: string;
  panVat?: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingDue: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  panVat?: string;
  totalPurchased: number;
  totalPaid: number;
  outstandingDue: number;
  contactPerson?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  rate: number;
  discountAmt: number; // item-level discount in Rs
  subtotal: number; // (rate * qty) - discountAmt
}

export interface Invoice {
  id: string;
  invoiceNo: string; // e.g. B-1001
  customerId: string;
  customerName: string;
  customerPhone?: string;
  isVatEnabled: boolean; // VAT vs Non-VAT Invoice
  date: string; // AD
  bsDate: string; // BS string: YYYY-MM-DD
  items: InvoiceItem[];
  subtotal: number;
  discount: number; // flat or total invoice-level discount
  taxPercent: number; // 13% for VAT, 0% for non-VAT
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Unpaid' | 'Partial' | 'Draft';
  notes?: string;
  paymentMethod: 'Cash' | 'Fonepay' | 'Bank Transfer' | 'Credit';
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  purchaseRate: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  billNo: string;
  supplierId: string;
  supplierName: string;
  date: string;
  bsDate: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Received' | 'Ordered' | 'Draft';
  paymentMethod: 'Cash' | 'Fonepay' | 'Bank Transfer' | 'Credit';
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'Rent' | 'Salary' | 'Utilities' | 'Transportation' | 'Marketing' | 'Refreshment' | 'Miscellaneous';
  date: string;
  bsDate: string;
  paymentMethod: 'Cash' | 'Fonepay' | 'Bank Transfer';
  notes?: string;
}

export interface AccountBalance {
  accountName: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  balance: number; // debited positive, credited negative normally, or absolute depending on standard
}

export interface JournalEntry {
  id: string;
  date: string;
  bsDate: string;
  description: string;
  reference: string; // invoiceNo, billNo, expenseId
  debitAccount: string;
  creditAccount: string;
  amount: number;
}

export interface BusinessConfig {
  name: string;
  nepaliName?: string;
  address: string;
  phone: string;
  panVat?: string;
  isVatRegistered: boolean;
  vatRate: number; // default 13
  slogan?: string;
  invoiceHeaderNotes?: string;
  invoiceFooterNotes?: string;
  currencySymbol: string;
  logo?: string;
}
