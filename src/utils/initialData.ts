import { Product, Customer, Supplier, Expense, Invoice, Purchase, JournalEntry, BusinessConfig } from '../types';

export const INITIAL_BUSINESS_CONFIG: BusinessConfig = {
  name: "Sagarmatha Stationery Center",
  nepaliName: "सगरमाथा स्टेशनरी सेन्टर",
  address: "Putalisadak, Kathmandu, Nepal",
  phone: "+977-1-4432100",
  panVat: "301556782",
  isVatRegistered: true,
  vatRate: 13,
  slogan: "Premium Office, School & Art Supplies",
  invoiceHeaderNotes: "Authorized Signature Required.",
  invoiceFooterNotes: "Thank you for your business! धन्यवाद।",
  currencySymbol: "Rs.",
  logo: "",
};

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "walk-in",
    name: "Walk-in Customer",
    phone: "9800000000",
    address: "Counter Sales",
    totalPurchases: 0,
    totalPaid: 0,
    outstandingDue: 0,
    notes: "Default account for direct instant payments"
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_PURCHASES: Purchase[] = [];

export const INITIAL_JOURNALS: JournalEntry[] = [];
