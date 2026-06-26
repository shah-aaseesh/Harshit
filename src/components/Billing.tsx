import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice, InvoiceItem, Product, Customer } from '../types';
import { 
  Plus, Minus, Trash, Printer, ArrowLeft, CheckCircle, Search, 
  UserPlus, ShoppingCart, DollarSign, Frown, Sparkles, Ban, FileDown,
  Info, QrCode, X
} from 'lucide-react';
import { toast } from 'sonner';
import { formatBSDate, getTodayBS, getFiscalYear, FISCAL_YEAR_OPTIONS, NEP_MONTHS_EN } from '../utils/nepaliCalendar';

export const Billing: React.FC = () => {
  const { 
    products, customers, invoices, submitInvoice, refundInvoice, 
    submitCustomer, businessConfig, currentUserRole 
  } = useApp();

  // Active sub-view: 'create' | 'history'
  const [viewMode, setViewMode] = useState<'create' | 'history'>('create');
  
  // Create mode state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [invoiceVatRegistered, setInvoiceVatRegistered] = useState<boolean>(businessConfig.isVatRegistered);
  const [flatDiscount, setFlatDiscount] = useState<number>(0);
  const [receivedPaymentAmount, setReceivedPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Fonepay' | 'Bank Transfer' | 'Credit'>('Cash');
  const [notes, setNotes] = useState<string>('');

  // Walk-in custom name support & cash receipt tracking
  const [walkInName, setWalkInName] = useState<string>('');
  const [paymentAmountOverridden, setPaymentAmountOverridden] = useState<boolean>(false);

  // Search & add quick items helper states
  const [productQuery, setProductQuery] = useState<string>('');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>('');
  
  // Modals view states
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [activePrintInvoice, setActivePrintInvoice] = useState<Invoice | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState<boolean>(false);

  // New customer quick-add form
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');
  const [newCustPan, setNewCustPan] = useState<string>('');

  // Cart math calculations
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const taxableAmount = Math.max(0, cartSubtotal - flatDiscount);
  const calculatedTax = invoiceVatRegistered ? Math.round(taxableAmount * (businessConfig.vatRate / 100)) : 0;
  const cartGrandTotal = taxableAmount + calculatedTax;
  const calculatedDue = Math.max(0, cartGrandTotal - (paymentMethod === 'Credit' ? 0 : receivedPaymentAmount));

  // Auto-sync cash received amount unless explicitly overridden or is credit payment
  React.useEffect(() => {
    if (!paymentAmountOverridden && paymentMethod !== 'Credit') {
      setReceivedPaymentAmount(cartGrandTotal);
    }
  }, [cartGrandTotal, paymentMethod, paymentAmountOverridden]);

  // Quick product filters
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productQuery.toLowerCase()) || 
    (p.nepaliName && p.nepaliName.includes(productQuery)) ||
    p.sku.toLowerCase().includes(productQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(productQuery.toLowerCase())
  );

  // Quick invoice logs filters
  const [invoiceFiscalYear, setInvoiceFiscalYear] = useState<string>('All');
  const [invoiceMonth, setInvoiceMonth] = useState<string>('All');
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
      (inv.customerPhone && inv.customerPhone.includes(invoiceSearchQuery));
    const matchesFY = invoiceFiscalYear === 'All' || getFiscalYear(inv.bsDate) === invoiceFiscalYear;
    const matchesMonth = invoiceMonth === 'All' || (() => {
      if (!inv.bsDate || !inv.bsDate.includes('-')) return false;
      const m = parseInt(inv.bsDate.split('-')[1]);
      return m === (NEP_MONTHS_EN.indexOf(invoiceMonth) + 1);
    })();
    return matchesSearch && matchesFY && matchesMonth;
  });

  // Handlers for cart customization
  const addToCart = (product: Product) => {
    // Check if product is already in cart
    const existingIndex = cartItems.findIndex(item => item.productId === product.id);
    if (existingIndex !== -1) {
      const updated = [...cartItems];
      const nextQty = updated[existingIndex].quantity + 1;
      
      // Stock boundary evaluation
      if (nextQty > product.stockQty) {
        toast.warning(`Insufficient stock! ${product.name} has only ${product.stockQty} ${product.unit} remaining.`);
        return;
      }

      updated[existingIndex].quantity = nextQty;
      updated[existingIndex].subtotal = (updated[existingIndex].rate * nextQty) - updated[existingIndex].discountAmt;
      setCartItems(updated);
    } else {
      if (product.stockQty < 1) {
        toast.warning(`${product.name} is out of stock!`);
        return;
      }

      const newItem: InvoiceItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.unit,
        rate: product.sellingPrice,
        discountAmt: 0,
        subtotal: product.sellingPrice,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateCartQty = (itemId: string, direction: 'up' | 'down') => {
    const updated = cartItems.map(item => {
      if (item.id === itemId) {
        const linkedProduct = products.find(p => p.id === item.productId);
        const nextQty = direction === 'up' ? item.quantity + 1 : item.quantity - 1;
        
        if (nextQty < 1) return item;
        if (linkedProduct && nextQty > linkedProduct.stockQty) {
          toast.warning(`Insufficient stock. Only ${linkedProduct.stockQty} ${linkedProduct.unit} available.`);
          return item;
        }

        const newSub = (item.rate * nextQty) - item.discountAmt;
        return {
          ...item,
          quantity: nextQty,
          subtotal: Math.max(0, newSub)
        };
      }
      return item;
    });
    setCartItems(updated);
  };

  const updateCartQtyCustom = (itemId: string, newQty: number) => {
    if (newQty < 1) newQty = 1;
    const updated = cartItems.map(item => {
      if (item.id === itemId) {
        const linkedProduct = products.find(p => p.id === item.productId);
        if (linkedProduct && newQty > linkedProduct.stockQty) {
          toast.warning(`Insufficient stock. Only ${linkedProduct.stockQty} ${linkedProduct.unit} available.`);
          return item;
        }

        const newSub = (item.rate * newQty) - item.discountAmt;
        return {
          ...item,
          quantity: newQty,
          subtotal: Math.max(0, newSub)
        };
      }
      return item;
    });
    setCartItems(updated);
  };

  const updateCartItemRate = (itemId: string, newRate: number) => {
    const updated = cartItems.map(item => {
      if (item.id === itemId) {
        const newSub = (newRate * item.quantity) - item.discountAmt;
        return {
          ...item,
          rate: newRate,
          subtotal: Math.max(0, newSub)
        };
      }
      return item;
    });
    setCartItems(updated);
  };

  const updateCartItemDiscount = (itemId: string, discAmt: number) => {
    const updated = cartItems.map(item => {
      if (item.id === itemId) {
        const newSub = (item.rate * item.quantity) - discAmt;
        return {
          ...item,
          discountAmt: discAmt,
          subtotal: Math.max(0, newSub)
        };
      }
      return item;
    });
    setCartItems(updated);
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  // Add customer prompt flow
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust = submitCustomer({
      name: newCustName,
      phone: newCustPhone || "9800000000",
      address: newCustAddress,
      panVat: newCustPan,
      notes: "Quick registered via billing terminal"
    });

    setSelectedCustomerId(newCust.id);
    setShowNewCustomerModal(false);
    
    // reset form
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustPan('');
  };

  // Submission Checkout
  const handleCheckoutSubmit = () => {
    if (cartItems.length === 0) {
      toast.warning('Billing basket is empty! Please add items before checkout.');
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomerId) || customers[0];
    const isWalkIn = selectedCustomerId === 'walk-in';
    const finalCustomerName = isWalkIn && walkInName.trim() ? `${walkInName.trim()} (Walk in)` : customerObj.name;

    // Status mapping
    let finalStatus: 'Paid' | 'Unpaid' | 'Partial' = 'Paid';
    // Cap shown payment to cartGrandTotal, any excess amount entered is given back as change
    const paidAmt = paymentMethod === 'Credit' ? 0 : Math.min(receivedPaymentAmount, cartGrandTotal);
    
    if (paidAmt === 0) {
      finalStatus = 'Unpaid';
    } else if (paidAmt < cartGrandTotal) {
      finalStatus = 'Partial';
    }

    const payload = {
      customerId: selectedCustomerId,
      customerName: finalCustomerName,
      customerPhone: customerObj.phone,
      isVatEnabled: invoiceVatRegistered,
      items: cartItems,
      subtotal: cartSubtotal,
      discount: flatDiscount,
      taxPercent: invoiceVatRegistered ? businessConfig.vatRate : 0,
      taxAmount: calculatedTax,
      grandTotal: cartGrandTotal,
      paidAmount: paidAmt,
      dueAmount: calculatedDue,
      status: finalStatus,
      paymentMethod: paymentMethod,
      notes: notes
    };

    const finalInvoiceObj = submitInvoice(payload);
    
    // Automatically trigger visual overlay A4 printer panel!
    setActivePrintInvoice(finalInvoiceObj);
    setShowPrintModal(true);

    // Wipe cart & resetting state
    setCartItems([]);
    setSelectedCustomerId('walk-in');
    setFlatDiscount(0);
    setReceivedPaymentAmount(0);
    setPaymentMethod('Cash');
    setNotes('');
    setWalkInName('');
    setPaymentAmountOverridden(false);
  };

  // Direct mock Fonepay QR Popout with Amount for fast cashier audits
  const openFonepayQR = () => {
    if (cartGrandTotal <= 0) {
      toast.warning('Checkout total must be greater than Rs 0.');
      return;
    }
    setShowQrModal(true);
  };

  // Save/Download invoice as A4 PDF document client-side using html2pdf
  const downloadInvoiceAsPdf = () => {
    if (!activePrintInvoice) {
      toast.error('Print invoice target not loaded.');
      return;
    }

    const performGeneration = () => {
      try {
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Coordinates & Margins
        const marginX = 15;
        let currY = 15;

        // Monochrome sleek double line border for black and white
        doc.setFillColor(17, 24, 39); // Deep Slate
        doc.rect(marginX, currY, 180, 1.2, 'F');
        currY += 1.8;

        doc.setFillColor(107, 114, 128); // Medium grayish line
        doc.rect(marginX, currY, 180, 0.4, 'F');
        currY += 6;

        // Business Details on Left
        if (businessConfig.logo) {
          try {
            // Draw logo image (15mm x 15mm)
            doc.addImage(businessConfig.logo, 'JPEG', marginX, currY, 15, 15);
            
            const textStartX = marginX + 18;
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(17, 24, 39); // gray-900
            doc.text(businessConfig.name, textStartX, currY + 4);
            
            let tempY = currY + 8.5;
            if (businessConfig.nepaliName) {
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(10);
              doc.setTextColor(55, 65, 81); // Charcoal gray
              doc.text(businessConfig.nepaliName, textStartX, tempY);
              tempY += 4.5;
            }

            doc.setFont("Helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175); // gray-400
            if (businessConfig.slogan) {
              doc.text(`"${businessConfig.slogan}"`, textStartX, tempY);
              tempY += 4;
            }

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128); // gray-500
            doc.text(`Address: ${businessConfig.address}  |  Phone: ${businessConfig.phone}`, textStartX, tempY);
            
            currY += 18; // safe spacing after the logo block
          } catch (err) {
            console.error("Error drawing logo on PDF invoice", err);
            // Fallback to standard layout
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(17, 24, 39); // gray-900
            doc.text(businessConfig.name, marginX, currY);
            currY += 4.5;

            if (businessConfig.nepaliName) {
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(10);
              doc.setTextColor(55, 65, 81); // Charcoal gray
              doc.text(businessConfig.nepaliName, marginX, currY);
              currY += 4.5;
            }

            doc.setFont("Helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175); // gray-400
            if (businessConfig.slogan) {
              doc.text(`"${businessConfig.slogan}"`, marginX, currY);
              currY += 4;
            }

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128); // gray-500
            doc.text(`Address: ${businessConfig.address}`, marginX, currY);
            currY += 4;
            doc.text(`Phone: ${businessConfig.phone}`, marginX, currY);
          }
        } else {
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(17, 24, 39); // gray-900
          doc.text(businessConfig.name, marginX, currY);
          currY += 4.5;

          if (businessConfig.nepaliName) {
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(55, 65, 81); // Charcoal gray
            doc.text(businessConfig.nepaliName, marginX, currY);
            currY += 4.5;
          }

          doc.setFont("Helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(156, 163, 175); // gray-400
          if (businessConfig.slogan) {
            doc.text(`"${businessConfig.slogan}"`, marginX, currY);
            currY += 4;
          }

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(107, 114, 128); // gray-500
          doc.text(`Address: ${businessConfig.address}`, marginX, currY);
          currY += 4;
          doc.text(`Phone: ${businessConfig.phone}`, marginX, currY);
        }

        // Right side metadata
        const metaX = 135;
        let metaY = 24;

        // Bounding header background
        doc.setFillColor(243, 244, 246); // gray-100
        doc.rect(metaX - 2, metaY - 4, 62, 7, 'F');

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(31, 41, 55); // gray-800
        const invoiceTitle = activePrintInvoice.isVatEnabled ? 'ABBREVIATED TAX INVOICE' : 'ESTIMATE / COMMERCIAL RECEIPT';
        doc.text(invoiceTitle, metaX, metaY, { align: 'left' });
        metaY += 6.5;

        // PAN/VAT Reg No
        if (businessConfig.panVat) {
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(17, 24, 39);
          doc.text(`PAN/VAT Reg: ${businessConfig.panVat}`, metaX, metaY);
          metaY += 5;
        }

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(75, 85, 99);
        doc.text(`BS Date: ${activePrintInvoice.bsDate}`, metaX, metaY);
        metaY += 4.5;
        doc.text(`Gregorian Date: ${activePrintInvoice.date}`, metaX, metaY);
        metaY += 5;

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(31, 41, 55); // charcoal gray/black
        doc.text(`Invoice Serial: ${activePrintInvoice.invoiceNo}`, metaX, metaY);

        // Horizontal line
        currY = Math.max(currY + 8, metaY + 4);
        doc.setDrawColor(229, 231, 235); // gray-200
        doc.setLineWidth(0.3);
        doc.line(marginX, currY, 195, currY);
        currY += 4;

        // Client info & details block
        doc.setFillColor(249, 250, 251); // gray-50
        doc.rect(marginX, currY, 180, 20, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.rect(marginX, currY, 180, 20, 'S');

        let clientY = currY + 4;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175); // gray-400
        doc.text("BILL TO CUSTOMER", marginX + 4, clientY);

        clientY += 4.5;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        doc.text(activePrintInvoice.customerName, marginX + 4, clientY);

        clientY += 4.5;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(75, 85, 99);
        const activeCustomer = customers.find(c => c.id === activePrintInvoice.customerId);
        doc.text(`Address: ${activeCustomer?.address || 'Counter Sales'}`, marginX + 4, clientY);
        clientY += 4;
        doc.text(`Phone: ${activePrintInvoice.customerPhone || '-'}`, marginX + 4, clientY);

        // Client right column coordinates
        let clientRightY = currY + 4;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(75, 85, 99);
        if (activeCustomer?.panVat) {
          doc.text(`PAN / VAT: ${activeCustomer.panVat}`, 125, clientRightY);
          clientRightY += 5;
        }
        doc.text(`Dispatched Via: ${activePrintInvoice.paymentMethod}`, 125, clientRightY);
        clientRightY += 5;
        doc.text(`Authorized Operator: Operator-01`, 125, clientRightY);

        currY += 25;

        // Table Header
        doc.setFillColor(243, 244, 246); // gray-100
        doc.rect(marginX, currY, 180, 8, 'F');
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 81); // gray-700

        doc.text("S.N", marginX + 2, currY + 5.5);
        doc.text("Product Particular Description", marginX + 11, currY + 5.5);
        doc.text("Qty", marginX + 98, currY + 5.5);
        doc.text("Rate (Rs)", marginX + 125, currY + 5.5, { align: 'right' });
        doc.text("Disc (Rs)", marginX + 152, currY + 5.5, { align: 'right' });
        doc.text("Subtotal (Rs)", marginX + 178, currY + 5.5, { align: 'right' });

        currY += 8;

        // Table Body
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(31, 41, 55);

        activePrintInvoice.items.forEach((item, idx) => {
          // Row layout
          currY += 6.5;

          // Check for overflow - standard invoice fits easily, but check anyway
          if (currY > 265) {
            doc.addPage();
            currY = 20;

            // Re-draw table header
            doc.setFillColor(243, 244, 246);
            doc.rect(marginX, currY, 180, 8, 'F');
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(55, 65, 81);
            doc.text("S.N", marginX + 2, currY + 5.5);
            doc.text("Product Particular Description", marginX + 11, currY + 5.5);
            doc.text("Qty", marginX + 98, currY + 5.5);
            doc.text("Rate (Rs)", marginX + 125, currY + 5.5, { align: 'right' });
            doc.text("Disc (Rs)", marginX + 152, currY + 5.5, { align: 'right' });
            doc.text("Subtotal (Rs)", marginX + 178, currY + 5.5, { align: 'right' });
            currY += 8 + 6.5;
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(31, 41, 55);
          }

          doc.setTextColor(156, 163, 175);
          doc.text(String(idx + 1), marginX + 3, currY);

          doc.setTextColor(17, 24, 39);
          doc.setFont("Helvetica", "bold");
          doc.text(item.productName, marginX + 11, currY);

          doc.setFont("Helvetica", "normal");
          doc.setTextColor(55, 65, 81);
          doc.text(`${item.quantity} ${item.unit}`, marginX + 98, currY);
          doc.text(item.rate.toLocaleString(), marginX + 125, currY, { align: 'right' });

          const dAmt = item.discountAmt > 0 ? item.discountAmt.toLocaleString() : '-';
          if (item.discountAmt > 0) {
            doc.setTextColor(75, 85, 99); // Dark graphite
          }
          doc.text(dAmt, marginX + 152, currY, { align: 'right' });

          doc.setTextColor(17, 24, 39);
          doc.setFont("Helvetica", "bold");
          doc.text(item.subtotal.toLocaleString(), marginX + 178, currY, { align: 'right' });

          // Row divider
          doc.setDrawColor(243, 244, 246);
          doc.line(marginX, currY + 2.5, 195, currY + 2.5);
          currY += 2.5;
        });

        // Totals summary section
        currY += 10;
        if (currY > 230) {
          doc.addPage();
          currY = 20;
        }

        // Terms and Conditions left box (simulating nice visual frame)
        doc.setDrawColor(229, 231, 235);
        doc.setLineDashPattern([2, 2], 0);
        doc.rect(marginX, currY, 82, 38, 'S');
        doc.setLineDashPattern([], 0); // reset line dash style

        let termsY = currY + 4.5;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);
        doc.text("FINE PRINTS & TERMS", marginX + 3, termsY);

        termsY += 4.5;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175);

        if (businessConfig.invoiceHeaderNotes) {
          // split notes to wrap text properly in 76mm width
          const lines = doc.splitTextToSize(`• ${businessConfig.invoiceHeaderNotes}`, 76);
          doc.text(lines, marginX + 3, termsY);
          termsY += (lines.length * 3.5);
        }

        if (activePrintInvoice.notes) {
          const remarkLines = doc.splitTextToSize(`• Remarks: ${activePrintInvoice.notes}`, 76);
          doc.text(remarkLines, marginX + 3, termsY);
          termsY += (remarkLines.length * 3.5);
        }

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(107, 114, 128);
        doc.text("SajiloBiz ERP System - Thank you!", marginX + 3, termsY + 2);

        // Mathematical breakout right column
        let totalsY = currY + 5;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(107, 114, 128);

        // Trading Gross Subtotal
        doc.text("Trading Gross Subtotal:", 112, totalsY);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(31, 41, 55);
        doc.text(`Rs. ${activePrintInvoice.subtotal.toLocaleString()}`, 178, totalsY, { align: 'right' });
        totalsY += 5;

        // Discount if any
        if (activePrintInvoice.discount > 0) {
          doc.setFont("Helvetica", "normal");
          doc.setTextColor(75, 85, 99); // Dark gray
          doc.text("Additional Flat Discount:", 112, totalsY);
          doc.setFont("Helvetica", "bold");
          doc.text(`Rs. -${activePrintInvoice.discount.toLocaleString()}`, 178, totalsY, { align: 'right' });
          totalsY += 5;
        }

        // VAT if any
        if (activePrintInvoice.taxAmount > 0) {
          doc.setFont("Helvetica", "normal");
          doc.setTextColor(107, 114, 128);
          doc.text(`Govt VAT (${activePrintInvoice.taxPercent}%):`, 112, totalsY);
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(31, 41, 55);
          doc.text(`Rs. ${activePrintInvoice.taxAmount.toLocaleString()}`, 178, totalsY, { align: 'right' });
          totalsY += 5;
        }

        // Horizontal line inside summary totals
        doc.setDrawColor(229, 231, 235);
        doc.line(112, totalsY, 178, totalsY);
        totalsY += 5;

        // Grand Net Total
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(17, 24, 39); // deep black
        doc.text("Grand Net Invoice Total:", 112, totalsY);
        doc.text(`Rs. ${activePrintInvoice.grandTotal.toLocaleString()}`, 178, totalsY, { align: 'right' });
        totalsY += 5;

        // Cleared Paid
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(31, 41, 55); // black/charcoal
        doc.text("Instant Cleared Paid:", 112, totalsY);
        doc.text(`Rs. ${activePrintInvoice.paidAmount.toLocaleString()}`, 178, totalsY, { align: 'right' });
        totalsY += 5;

        // Outstanding Balance Due
        if (activePrintInvoice.dueAmount > 0) {
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(17, 24, 39); // black/charcoal
          doc.text("Outstanding Balance Due:", 112, totalsY);
          doc.text(`Rs. ${activePrintInvoice.dueAmount.toLocaleString()}`, 178, totalsY, { align: 'right' });
        }

        // Signatures at bottom
        let sigY = currY + 54;
        if (sigY > 280) {
          doc.addPage();
          sigY = 50;
        }

        doc.setDrawColor(209, 213, 219);
        doc.line(marginX, sigY, marginX + 50, sigY);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text("Customer Receiver Signature", marginX + 3, sigY + 4);

        doc.line(135, sigY, 185, sigY);
        doc.text("Authorized Seal / Operator", 143, sigY + 4);

        // Save PDF doc
        doc.save(`Invoice-${activePrintInvoice.invoiceNo}.pdf`);

      } catch (err) {
        console.error("Direct programmatic PDF generation failed, launching standard print:", err);
        window.print();
      }
    };

    // Load standard jsPDF module from CDN if not present in globally resolved namespaces
    if ((window as any).jspdf) {
      performGeneration();
    } else {
      // Create lazy inline user loader hint bar
      const loader = document.createElement('div');
      loader.id = "dynamic-pdf-loader-bar";
      loader.style.position = "fixed";
      loader.style.top = "12px";
      loader.style.right = "12px";
      loader.style.backgroundColor = "#2563eb";
      loader.style.color = "white";
      loader.style.padding = "8px 16px";
      loader.style.borderRadius = "8px";
      loader.style.fontSize = "11px";
      loader.style.fontWeight = "bold";
      loader.style.zIndex = "99999";
      loader.innerText = "Generating Professional Invoice PDF...";
      document.body.appendChild(loader);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        const bar = document.getElementById("dynamic-pdf-loader-bar");
        if (bar) document.body.removeChild(bar);
        performGeneration();
      };
      script.onerror = () => {
        const bar = document.getElementById("dynamic-pdf-loader-bar");
        if (bar) document.body.removeChild(bar);
        toast.error('Failed to load PDF library. Using system print instead.');
        window.print();
      };
      document.body.appendChild(script);
    }
  };

  // Safe isolated print method without printing background noise
  const triggerDirectPrint = () => {
    const invoiceElement = document.getElementById("printable-bill-invoice-sheet");
    if (!invoiceElement || !activePrintInvoice) {
      window.print();
      return;
    }

    // Try to trigger clean system printing via a temporary silent iframe
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
      // Fallback
      window.print();
      return;
    }

    let styleTagsHtml = "";
    document.querySelectorAll("style, link[rel='stylesheet']").forEach(el => {
      styleTagsHtml += el.outerHTML;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${activePrintInvoice.invoiceNo}</title>
          ${styleTagsHtml}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,900;1,400&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              background-color: white !important;
              color: #000000 !important;
              margin: 0;
              padding: 10px;
            }
            #printable-bill-invoice-sheet {
              border: none !important;
              box-shadow: none !important;
              max-height: none !important;
              overflow: visible !important;
              width: 100% !important;
              padding: 0 !important;
            }
            @page {
              size: A4;
              margin: 12mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                filter: grayscale(100%) !important;
                -webkit-filter: grayscale(100%) !important;
              }
              /* Enforce clean solid black for print text and elegant borders */
              * {
                color: #000000 !important;
                text-shadow: none !important;
                box-shadow: none !important;
              }
              .text-blue-700, .text-red-700, .text-rose-600, .text-emerald-500, .text-emerald-700, .text-blue-600 {
                color: #000000 !important;
              }
              .bg-red-700, .bg-blue-700 {
                background-color: #000000 !important;
              }
              .bg-gray-50, .bg-gray-100 {
                background-color: #f3f4f6 !important;
              }
              .border {
                border-color: #d1d5db !important;
              }
            }
          </style>
        </head>
        <body>
          <div id="printable-bill-invoice-sheet">
            ${invoiceElement.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                try {
                  window.print();
                } catch (e) {
                  console.error(e);
                }
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
    <div className="space-y-6 max-w-7xl mx-auto" id="billing-module-container">
      {/* Tab Switch header */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4" id="billing-header">
        <div>
          <h1 className="text-xl font-semibold text-gray-900" id="billing-title">Billing Checkout Terminal</h1>
          <p className="text-xs text-gray-500" id="billing-desc">Generate invoices, record customer credits, and print tax receipts</p>
        </div>

        <div className="flex gap-2" id="billing-tab-toggle">
          <button
            id="tab-billing-create"
            onClick={() => setViewMode('create')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'create' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            Terminal Checkout
          </button>
          <button
            id="tab-billing-history"
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'history' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            Invoice Register ({invoices.length})
          </button>
        </div>
      </div>

      {viewMode === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="billing-layout-grid">
          
          {/* LEFT 7 PANELS: PRODUCT CATALOG PICKER */}
          <div className="lg:col-span-7 space-y-4" id="catalog-picker-panel">
            
            {/* Search Input Filter */}
            <div className="relative" id="product-search-bar">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search-product-input"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Quick search products by Name, category, SKU, or nepali labels..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Products grid display */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-3" id="catalog-list-card">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Trading Inventory</h2>
              
              {filteredProducts.length === 0 ? (
                <div className="text-center py-10" id="no-products-found">
                  <Frown className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">No matching items found in warehouse catalog.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1" id="products-catalog-grid">
                  {filteredProducts.map((p) => {
                    const isLowStock = p.stockQty <= p.minStockAlert;
                    const inCart = cartItems.some(i => i.productId === p.id);
                    return (
                      <div 
                        key={p.id}
                        id={`catalog-card-${p.id}`}
                        onClick={() => addToCart(p)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-98 ${
                          inCart 
                            ? 'bg-blue-50/40 border-blue-200/60 shadow-xxs hover:border-blue-300' 
                            : 'bg-white hover:bg-gray-50/55 border-gray-100/70 hover:border-gray-200 shadow-xxs'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div>
                            <span className="font-semibold text-xs text-gray-800 block line-clamp-1">{p.name}</span>
                            {p.nepaliName && (
                              <span className="text-[10px] text-gray-400 block mt-0.5 font-sans">{p.nepaliName}</span>
                            )}
                            <span className="text-[10px] font-mono mt-1 text-gray-400 uppercase tracking-wide bg-gray-50 rounded px-1 inline-block">
                              {p.sku} • {p.category}
                            </span>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-xs text-blue-700 block">Rs. {p.sellingPrice}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 font-medium rounded-full inline-block mt-1 ${
                              p.stockQty === 0 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                : isLowStock 
                                ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {p.stockQty === 0 ? 'Out' : `Stock: ${p.stockQty} ${p.unit}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions Guide */}
            <div className="flex items-center gap-2 text-[11px] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-gray-500" id="billing-quick-help">
              <Info className="h-4 w-4 text-blue-500 shrink-0" />
              <span>Click items on the catalog grid to immediately add them to active billing cart on the right.</span>
            </div>
          </div>

          {/* RIGHT 5 PANELS: ACTIVE CART CHEKOUT */}
          <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-gray-100 flex flex-col justify-between min-h-[580px]" id="cart-summary-panel">
            <div className="space-y-4" id="cart-container">
              {/* Customer Selector & Add Client Action Row */}
              <div className="space-y-1.5" id="customer-selector-row">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">Bill Recipient Customer</span>
                  <button 
                    id="btn-trigger-add-customer"
                    type="button"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="flex items-center gap-1 text-blue-600 font-medium hover:underline"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    New Customer
                  </button>
                </div>

                <div className="flex gap-2" id="customer-select-with-walkin">
                  <select
                    id="select-customer-dropdown"
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      if (e.target.value === 'walk-in') {
                        setPaymentMethod('Cash');
                      }
                    }}
                    className="flex-1 py-2 px-3 text-xs rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone !== '9800000000' ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    id="btn-toggle-walkin-quick"
                    onClick={() => {
                      setSelectedCustomerId('walk-in');
                      setPaymentMethod('Cash');
                    }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      selectedCustomerId === 'walk-in'
                        ? 'bg-gray-100 border-gray-200 text-gray-800'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Walk-in
                  </button>
                </div>

                {/* Walk-in custom name input */}
                {selectedCustomerId === 'walk-in' && (
                  <div className="mt-2 space-y-1 block border border-dashed border-gray-205 p-2.5 rounded-lg bg-gray-50/50" id="walk-in-customer-name-row">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-450 uppercase tracking-wider">
                      <span>Walk-In Customer Name</span>
                      <span className="text-blue-500 font-medium lowercase">shown on invoice</span>
                    </div>
                    <input
                      type="text"
                      id="input-walkin-customer-name"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="Enter customer name (e.g., Aashish Shah)"
                      className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-gray-200 bg-white outline-none focus:ring-1 focus:ring-blue-500 text-gray-850"
                    />
                    <p className="text-[10px] text-gray-450 leading-none mt-1">
                      If provided, registers as <span className="font-semibold text-gray-700 font-mono">{walkInName ? `${walkInName} (Walk in)` : 'Walk-in Customer'}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Basket line items list */}
              <div className="space-y-2 border-t border-gray-100 pt-3" id="basket-list-section">
                <div className="flex justify-between items-center" id="basket-title-row">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <ShoppingCart className="h-3.5 w-3.5 text-gray-400" />
                    Billing Cart Items ({cartItems.length})
                  </span>
                  {cartItems.length > 0 && (
                    <button 
                      id="btn-clear-cart"
                      onClick={() => setCartItems([])} 
                      className="text-[10px] text-rose-500 font-medium hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <div className="text-center py-14 bg-gray-50/50 rounded-xl border border-dashed border-gray-200" id="empty-cart-state">
                    <p className="text-xs text-gray-400">Cart is empty.</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Click catalog items on the left to start adding.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1" id="cart-item-stepper-list">
                    {cartItems.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50/45 rounded-lg border border-gray-100 flex justify-between items-center text-xs" id={`cart-item-row-${item.id}`}>
                        <div className="space-y-0.5 flex-1 pr-1.5" id="cart-item-meta">
                          <span className="font-semibold text-gray-800 block line-clamp-1">{item.productName}</span>
                          
                          {/* Stepper with custom rate/discount values inputs */}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-gray-500" id="item-param-inputs">
                            <div className="flex items-center gap-1.5" id="inline-price-input">
                              <span>Rs.</span>
                              <input
                                type="number"
                                id={`input-rate-${item.id}`}
                                value={item.rate}
                                onChange={(e) => updateCartItemRate(item.id, parseFloat(e.target.value) || 0)}
                                className="w-20 bg-white border border-gray-200 rounded px-1.5 text-center font-mono py-0.5"
                              />
                            </div>
                            
                            <div className="flex items-center gap-1" id="inline-discount-input">
                              <span>Disc:</span>
                              <input
                                type="number"
                                id={`input-discount-${item.id}`}
                                value={item.discountAmt}
                                onChange={(e) => updateCartItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                                className="w-16 bg-white border border-gray-200 rounded px-1.5 text-center font-mono py-0.5 text-rose-600"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quantity Adjustments */}
                        <div className="flex items-center gap-3 shrink-0" id="cart-item-quantity-management">
                          <div className="flex items-center border border-gray-200 bg-white rounded-md p-0.5" id="quantity-stepper">
                            <button
                              id={`btn-dec-qty-${item.id}`}
                              onClick={() => updateCartQty(item.id, 'down')}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 active:scale-95 transition-all font-bold"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              id={`input-qty-${item.id}`}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                updateCartQtyCustom(item.id, val);
                              }}
                              className="w-10 text-center font-mono font-bold text-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0 text-xs"
                              style={{ MozAppearance: 'textfield' }}
                            />
                            <button
                              id={`btn-inc-qty-${item.id}`}
                              onClick={() => updateCartQty(item.id, 'up')}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 active:scale-95 transition-all font-bold"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <span className="font-mono font-bold text-gray-800 w-16 text-right">
                            Rs. {item.subtotal}
                          </span>

                          <button
                            id={`btn-remove-${item.id}`}
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-gray-400 hover:text-rose-500 rounded active:scale-90 transition-all"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calculations Checkout summary */}
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-4" id="checkout-calculations-box">
              <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs text-gray-600" id="math-grid-panel">
                
                {/* Switch for VAT billing */}
                <div className="flex justify-between items-center border-b border-gray-200/50 pb-2" id="vat-config-row">
                  <span className="font-semibold text-gray-700">Calculate VAT billing (13% VAT)</span>
                  <label className="relative inline-flex items-center cursor-pointer" id="vat-switch-wrapper">
                    <input
                      type="checkbox"
                      id="checkbox-vat-toggle"
                      checked={invoiceVatRegistered}
                      onChange={(e) => {
                        setInvoiceVatRegistered(e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center" id="subtotal-row">
                  <span>Gross Basket Subtotal:</span>
                  <span className="font-mono font-semibold">Rs. {cartSubtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center" id="discount-row">
                  <span>Additional Flat Discount (Rs):</span>
                  <input
                    type="number"
                    id="input-discount-flat"
                    value={flatDiscount}
                    onChange={(e) => setFlatDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-18 bg-white border border-gray-200 rounded px-1.5 text-center font-mono py-0.5 text-rose-600 font-bold"
                  />
                </div>

                {invoiceVatRegistered && (
                  <div className="flex justify-between items-center text-xs text-gray-500" id="vat-breakout-row">
                    <span>Taxable Subtotal (after discount):</span>
                    <span className="font-mono">Rs. {taxableAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center" id="vat-amount-row">
                  <span>{invoiceVatRegistered ? `Government VAT (${businessConfig.vatRate}%)` : 'Non-VAT Billing'}:</span>
                  <span className="font-mono">{invoiceVatRegistered ? `Rs. ${calculatedTax.toLocaleString()}` : 'Rs. 0'}</span>
                </div>

                <div className="flex justify-between items-center border-t border-gray-200/60 pt-2 text-sm text-gray-900 font-bold" id="grand-total-row">
                  <span>Grand Net Payable:</span>
                  <span className="font-mono text-blue-700 text-lg">Rs. {cartGrandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Methods and Received change calculator */}
              <div className="grid grid-cols-2 gap-3" id="payment-gateways-grid">
                
                {/* Method selector */}
                <div className="space-y-1" id="payment-type-picker">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Payment Channel</label>
                  <select
                    id="select-payment-method"
                    value={paymentMethod}
                    onChange={(e) => {
                      const method = e.target.value as any;
                      setPaymentMethod(method);
                      if (method === 'Credit') {
                        setReceivedPaymentAmount(0);
                        setPaymentAmountOverridden(true);
                      } else {
                        // Reset manual amount override flag on method flip
                        setPaymentAmountOverridden(false);
                        setReceivedPaymentAmount(cartGrandTotal);
                      }
                    }}
                    disabled={selectedCustomerId === 'walk-in' && paymentMethod === 'Credit'}
                    className="w-full text-xs py-2 px-2.5 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Cash">Cash Hand</option>
                    <option value="Fonepay">Instant Fonepay</option>
                    <option value="Bank Transfer">Bank Mobile</option>
                    <option value="Credit" disabled={selectedCustomerId === 'walk-in'}>Credit Account (Due)</option>
                  </select>
                </div>

                {/* Amount custom received */}
                <div className="space-y-1" id="payment-amount-receipt">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex justify-between">
                    <span>Cash Received (Rs)</span>
                    {paymentMethod === 'Fonepay' && (
                      <button 
                        id="btn-fonepay-qr-qr"
                        type="button" 
                        onClick={openFonepayQR}
                        className="text-[9px] text-blue-600 flex items-center gap-0.5 normal-case font-bold"
                      >
                        <QrCode className="h-3 w-3" /> QR Show
                      </button>
                    )}
                  </label>
                  <input
                    type="number"
                    id="input-cash-received"
                    value={paymentMethod === 'Credit' ? 0 : receivedPaymentAmount}
                    disabled={paymentMethod === 'Credit'}
                    onChange={(e) => {
                      setReceivedPaymentAmount(Math.max(0, parseFloat(e.target.value) || 0));
                      setPaymentAmountOverridden(true);
                    }}
                    placeholder="Received"
                    className="w-full text-xs py-2 px-2.5 rounded-lg border border-gray-200 outline-none font-mono focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                  
                  {paymentMethod !== 'Credit' && (
                    <div className="flex flex-wrap gap-1 mt-1.5" id="quick-cash-badges">
                      <button
                        type="button"
                        id="btn-cash-exact"
                        onClick={() => {
                          setPaymentAmountOverridden(false);
                          setReceivedPaymentAmount(cartGrandTotal);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold transition border ${
                          !paymentAmountOverridden 
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-white text-gray-500 border-gray-250 hover:bg-gray-50'
                        }`}
                      >
                        Exact (Full Pay)
                      </button>
                      <button
                        type="button"
                        id="btn-cash-100"
                        onClick={() => {
                          setPaymentAmountOverridden(true);
                          setReceivedPaymentAmount(100);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold border bg-white text-gray-650 border-gray-200 hover:bg-gray-50"
                      >
                        100
                      </button>
                      <button
                        type="button"
                        id="btn-cash-500"
                        onClick={() => {
                          setPaymentAmountOverridden(true);
                          setReceivedPaymentAmount(500);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold border bg-white text-gray-650 border-gray-200 hover:bg-gray-50"
                      >
                        500
                      </button>
                      <button
                        type="button"
                        id="btn-cash-1000"
                        onClick={() => {
                          setPaymentAmountOverridden(true);
                          setReceivedPaymentAmount(1000);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold border bg-white text-gray-650 border-gray-200 hover:bg-gray-50"
                      >
                        1000
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Credit check representation */}
              {paymentMethod !== 'Credit' && receivedPaymentAmount > 0 && (
                <div className="flex justify-between items-center text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100" id="cash-change-box">
                  <span className="font-semibold">Cash Return Change:</span>
                  <span className="font-mono font-bold">
                    Rs. {Math.max(0, receivedPaymentAmount - cartGrandTotal).toLocaleString()}
                  </span>
                </div>
              )}

              {calculatedDue > 0 && (
                <div className="flex justify-between items-center text-xs bg-rose-50 text-rose-800 p-2.5 rounded-lg border border-rose-100" id="due-warning-box">
                  <span className="font-semibold">Credit/Due Outstanding Recorded:</span>
                  <span className="font-mono font-bold">Rs. {calculatedDue.toLocaleString()}</span>
                </div>
              )}

              {/* Notes or Comments */}
              <input
                type="text"
                id="input-invoice-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes or references for invoice logs..."
                className="w-full outline-none border border-gray-150 py-1.5 px-3 rounded-lg text-[11px] text-gray-600"
              />

              {/* Record Action */}
              <button
                type="button"
                id="btn-confirm-checkout"
                onClick={handleCheckoutSubmit}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-99 text-xs font-semibold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4.5 w-4.5" />
                Record & Dispatch Invoice
              </button>
            </div>

          </div>

        </div>
      ) : (
        /* HISTORICAL REGISTER LOGS */
        <div className="space-y-4" id="invoice-register-list">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-100" id="history-search-row">
            <div className="relative flex-1" id="history-search-bar">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search-invoice-history-input"
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                placeholder="Search processed invoices by customer name, registration numbers, or statuses..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Fiscal Year Filter Selector */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-150 rounded-lg px-2.5 py-1.5 text-xs shrink-0" id="invoice-history-fy-wrapper">
              <span className="text-gray-400 font-bold select-none">FY:</span>
              <select
                id="select-invoice-history-fy"
                value={invoiceFiscalYear}
                onChange={(e) => setInvoiceFiscalYear(e.target.value)}
                className="bg-transparent font-extrabold text-gray-800 outline-none cursor-pointer"
              >
                {FISCAL_YEAR_OPTIONS.map(fy => (
                  <option key={fy} value={fy}>{fy === 'All' ? 'All Fiscal Years' : `FY ${fy}`}</option>
                ))}
              </select>
            </div>

            {/* Month Filter Selector */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-150 rounded-lg px-2.5 py-1.5 text-xs shrink-0" id="invoice-history-month-wrapper">
              <span className="text-gray-400 font-bold select-none">Month:</span>
              <select
                id="select-invoice-history-month"
                value={invoiceMonth}
                onChange={(e) => setInvoiceMonth(e.target.value)}
                className="bg-transparent font-extrabold text-gray-800 outline-none cursor-pointer"
              >
                <option value="All">All Months</option>
                {NEP_MONTHS_EN.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" id="history-table-card">
            <div className="overflow-x-auto" id="history-table-wrapper">
              <table className="w-full text-left border-collapse text-xs" id="invoice-history-table">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <th id="th-inv" className="p-4">Invoice No</th>
                    <th id="th-date" className="p-4">Date BS (AD)</th>
                    <th id="th-client" className="p-4">Client</th>
                    <th id="th-type" className="p-4">Tax Type</th>
                    <th id="th-total" className="p-4">Grand Total</th>
                    <th id="th-paid" className="p-4">Paid (Method)</th>
                    <th id="th-due" className="p-4">Due Out</th>
                    <th id="th-status" className="p-4">Status</th>
                    <th id="th-actions" className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600" id="invoice-history-tbody">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-gray-400">
                        No invoices registered in system records.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50" id={`row-invoice-log-${inv.id}`}>
                        <td className="p-4 font-mono font-semibold text-gray-900">{inv.invoiceNo}</td>
                        <td className="p-4">
                          <span className="block font-medium text-gray-800">{inv.bsDate}</span>
                          <span className="text-[10px] text-gray-400">{inv.date}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-gray-800 block">{inv.customerName}</span>
                          {inv.customerPhone && <span className="text-[10px] text-gray-400">{inv.customerPhone}</span>}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            inv.isVatEnabled 
                              ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                              : 'bg-gray-50 text-gray-600 border border-gray-100'
                          }`}>
                            {inv.isVatEnabled ? 'VAT (13%)' : 'Non-VAT'}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-gray-900">Rs. {inv.grandTotal.toLocaleString()}</td>
                        <td className="p-4">
                          <span className="font-mono block">Rs. {inv.paidAmount.toLocaleString()}</span>
                          <span className="text-[10px] text-blue-600">{inv.paymentMethod}</span>
                        </td>
                        <td className="p-4 font-mono font-medium text-rose-600">
                          {inv.dueAmount > 0 ? `Rs. ${inv.dueAmount.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 font-medium rounded-full text-[10px] inline-block ${
                            inv.status === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : inv.status === 'Partial' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-2" id="invoice-logs-action-buttons">
                            <button
                              id={`btn-reg-print-${inv.id}`}
                              onClick={() => {
                                setActivePrintInvoice(inv);
                                setShowPrintModal(true);
                              }}
                              className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-600 flex items-center gap-1 active:scale-95 transition-all text-[10px] font-semibold"
                            >
                              <Printer className="h-3.5 w-3.5" /> Print
                            </button>
                            {inv.status !== 'Draft' && currentUserRole === 'Owner' && (
                              <button
                                id={`btn-reg-void-${inv.id}`}
                                onClick={() => {
                                  if (confirm("Are you sure you want to refund/void this invoice? This will restore stocks & debit the Ledger entries.")) {
                                    refundInvoice(inv.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-md text-rose-600 active:scale-95 transition-all text-[10px] font-semibold flex items-center gap-0.5"
                              >
                                <Ban className="h-3.5 w-3.5" /> Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD NEW CUSTOMER MODAL */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-new-customer">
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-sm w-full p-5 space-y-4" id="new-customer-inner">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-950 text-xs">Create New Customer Profile</span>
              <button 
                id="btn-close-cust-modal"
                onClick={() => setShowNewCustomerModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs" id="quick-cust-form">
              <div className="space-y-1">
                <label className="text-gray-600 block">Full Customer Name *</label>
                <input
                  type="text"
                  id="input-quick-cust-name"
                  required
                  placeholder="e.g. Dayahang Rai"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outlined-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Phone Number *</label>
                <input
                  type="text"
                  id="input-quick-cust-phone"
                  required
                  placeholder="e.g. 98510XXXXX"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outlined-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Address</label>
                <input
                  type="text"
                  id="input-quick-cust-addr"
                  placeholder="e.g. Koteshwor, KTM"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outlined-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">PAN / VAT Number (Optional)</label>
                <input
                  type="text"
                  id="input-quick-cust-pan"
                  placeholder="9 digit official layout code"
                  value={newCustPan}
                  onChange={(e) => setNewCustPan(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outlined-none font-mono"
                />
              </div>

              <button
                type="submit"
                id="btn-save-quick-cust"
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-bold mt-2 hover:bg-blue-700"
              >
                Assemble & Register Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC FONEPAY QR CODE POPUP */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-fonepay-qr">
          <div className="bg-white rounded-2xl shadow-xl max-w-xs w-full p-5 text-center relative border border-gray-100" id="qrcode-inner">
            <button
              id="btn-close-qr-modal"
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 hover:scale-105 p-1 text-gray-400 hover:text-gray-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-3.5" id="fonepay-qr-display-box">
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">Fonepay Instant QR</span>
              
              <div className="flex justify-center p-2 rounded-xl border-2 border-dashed border-emerald-500 bg-white" id="qr-frame">
                {/* Simulated authentic Fonepay QR card containing amount details */}
                <div className="w-48 h-48 bg-gray-50 relative flex items-center justify-center text-center p-3 rounded-lg flex-col overflow-hidden">
                  <div className="h-2 w-full bg-rose-600 absolute top-0"></div>
                  <div className="h-2 w-full bg-blue-600 absolute bottom-0"></div>
                  
                  {/* Decorative QR-like layout boxes */}
                  <div className="w-full h-full border border-gray-200 rounded p-1.5 flex flex-col justify-between" id="designed-qr">
                    <div className="flex justify-between">
                      <div className="h-8 w-8 border-2 border-gray-900 bg-gray-900"></div>
                      <div className="h-8 w-8 border-2 border-gray-900"></div>
                    </div>
                    <div className="text-[9px] font-mono leading-tight my-1.5">
                      <span className="block font-bold">Fonepay Merchant Id</span>
                      <span className="text-gray-500">SAJILO_TRADERS_KTM</span>
                      <span className="block text-xs font-extrabold text-[#111827] mt-1 font-sans">
                        Rs. {cartGrandTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="h-8 w-8 border-2 border-gray-900"></div>
                      <div className="h-3 w-3 bg-red-600 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-xs text-gray-400">Scan using any Nepalese Banking app (Siddharth, Nabil, eSewa, IME Pay, Fonepay)</span>
                <span className="text-sm font-extrabold block text-gray-900 mt-1 font-mono">Rs. {cartGrandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE NEPAL STYLE BILL MODAL */}
      {showPrintModal && activePrintInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="modal-invoice-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-4" id="invoice-print-container">
            
            {/* Action Bar */}
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-100 pb-3" id="print-action-bar">
              <span className="font-semibold text-xs text-gray-500 flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-blue-500" /> Printable invoice parsed successfully
              </span>

              <div className="flex items-center gap-2 flex-wrap" id="print-actions-right">
                <button
                  id="btn-download-pdf-doc"
                  onClick={downloadInvoiceAsPdf}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-700 active:scale-97 transition-all shadow-xs"
                >
                  <FileDown className="h-3.5 w-3.5" /> Save / Download PDF File
                </button>
                <button
                  id="btn-print-dispatch"
                  onClick={triggerDirectPrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-700 active:scale-97 transition-all shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" /> Direct System Print
                </button>
                <button
                  id="btn-close-print-modal"
                  onClick={() => {
                    setShowPrintModal(false);
                    setActivePrintInvoice(null);
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 active:scale-97 transition-all"
                >
                  Close Terminal
                </button>
              </div>
            </div>

            {/* THE PRINTABLE TARGET FRAME */}
            <div 
              id="printable-bill-invoice-sheet" 
              className="border border-gray-300 p-8 rounded-lg bg-white relative max-h-[500px] overflow-y-auto text-gray-900"
              style={{ fontFamily: '"Inter", sans-serif' }}
            >
              {/* Dual Traditional Nepalese Border Lines style */}
              <div className="h-1 bg-red-700 w-full mb-1"></div>
              <div className="h-0.5 bg-blue-700 w-full mb-4"></div>

               {/* Headings */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4" id="bill-print-header">
                <div className="flex items-center gap-3">
                  {businessConfig.logo && (
                    <img 
                      src={businessConfig.logo} 
                      alt="Business Logo" 
                      className="h-14 w-14 object-contain rounded-lg border border-gray-150 p-1 bg-white shrink-0" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase font-sans">
                      {businessConfig.name}
                    </h1>
                    {businessConfig.nepaliName && (
                      <p className="text-sm font-semibold text-gray-800 font-sans mt-0.5 mb-1 text-red-700">
                        {businessConfig.nepaliName}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-500 leading-snug">
                      {businessConfig.slogan && <span className="italic block mb-0.5 text-gray-400">"{businessConfig.slogan}"</span>}
                      Address: {businessConfig.address}<br />
                      Phone: {businessConfig.phone}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[10px] text-gray-500 space-y-0.5" id="bill-meta-right">
                  <div className="text-xs font-extrabold text-gray-900 uppercase tracking-widest bg-gray-50 px-2.5 py-1 rounded inline-block border border-gray-200">
                    {activePrintInvoice.isVatEnabled ? 'Abbreviated Tax Invoice' : 'Estimate / Commercial Receipt'}
                  </div>
                  {businessConfig.panVat && (
                    <div className="text-xs font-mono font-bold text-gray-800 pt-1">
                      PAN/VAT Reg No: <span className="tracking-widest bg-gray-50 border px-1 rounded">{businessConfig.panVat}</span>
                    </div>
                  )}
                  <div className="pt-2">BS Date: <span className="font-semibold font-mono">{activePrintInvoice.bsDate}</span></div>
                  <div>Gregorian Date: <span className="font-mono">{activePrintInvoice.date}</span></div>
                  <div className="text-xs font-bold text-blue-700">Invoice Serial: <span className="font-mono">{activePrintInvoice.invoiceNo}</span></div>
                </div>
              </div>

              {/* Customer / Client ledger billing block */}
              <div className="border border-gray-150 p-3 rounded-lg bg-gray-50/50 mt-4 text-[10px] grid grid-cols-1 sm:grid-cols-2 gap-2" id="bill-client-segment">
                <div className="space-y-0.5" id="client-info-col">
                  <span className="text-gray-400 uppercase font-bold block text-[8px] tracking-wider">Bill To Customer</span>
                  <p className="font-extrabold text-xs text-gray-900">{activePrintInvoice.customerName}</p>
                  <p className="text-gray-500">Address: {customers.find(c => c.id === activePrintInvoice.customerId)?.address || 'Counter Sales'}</p>
                  <p className="text-gray-500">Phone: {activePrintInvoice.customerPhone || '-'}</p>
                </div>
                <div className="space-y-0.5 text-left sm:text-right" id="client-financial-col">
                  {customers.find(c => c.id === activePrintInvoice.customerId)?.panVat && (
                    <p className="text-gray-500 font-mono">
                      PAN / VAT: {customers.find(c => c.id === activePrintInvoice.customerId)?.panVat}
                    </p>
                  )}
                  <p className="text-gray-500">Dispatched Via: {activePrintInvoice.paymentMethod}</p>
                  <p className="text-gray-500">Authorized Operator: Operator-01</p>
                </div>
              </div>

              {/* Invoiced items list table */}
              <div className="mt-5 border border-gray-200 rounded-lg overflow-hidden text-[10px]" id="bill-print-table-wrapper">
                <table className="w-full text-left border-collapse" id="bill-print-items-table">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                      <th id="th-print-sn" className="p-2 w-10 text-center">S.N</th>
                      <th id="th-print-desc" className="p-2">Product Particular Description</th>
                      <th id="th-print-qty" className="p-2 text-center w-16">Qty</th>
                      <th id="th-print-rate" className="p-2 text-right w-20">Rate (Rs)</th>
                      <th id="th-print-disc" className="p-2 text-right w-16">Disc (Rs)</th>
                      <th id="th-print-sub" className="p-2 text-right w-24">Subtotal (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-800" id="bill-print-items-tbody">
                    {activePrintInvoice.items.map((item, idx) => (
                      <tr key={item.id} id={`print-item-row-${idx}`}>
                        <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                        <td className="p-2 font-semibold">{item.productName}</td>
                        <td className="p-2 text-center font-mono font-medium">{item.quantity} {item.unit}</td>
                        <td className="p-2 text-right font-mono">{item.rate.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono text-rose-600">{item.discountAmt > 0 ? item.discountAmt.toLocaleString() : '-'}</td>
                        <td className="p-2 text-right font-mono font-bold">{item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grand summary checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-[10px]" id="bill-print-summary-box">
                {/* Comments & Terms */}
                <div className="space-y-2 border border-dashed border-gray-200 p-2.5 rounded text-[9px] text-gray-400 italic font-mono leading-relaxed" id="fine-prints">
                  <span className="font-bold underline block text-[8px] tracking-wider uppercase not-italic text-gray-500">Fine Prints & Terms</span>
                  {businessConfig.invoiceHeaderNotes && <span className="block">• {businessConfig.invoiceHeaderNotes}</span>}
                  {activePrintInvoice.notes && <span className="block">• Remarks: {activePrintInvoice.notes}</span>}
                  <span className="block text-gray-500 font-sans tracking-wide">धन्यवाद फेरि भेटौंला! (SajiloBiz ERP System)</span>
                </div>

                {/* Mathematical breakouts */}
                <div className="space-y-1.5 font-mono text-left sm:text-right" id="print-aggregates">
                  <div className="flex justify-between sm:justify-end gap-10">
                    <span className="text-gray-400 text-[9px]">Trading Gross Subtotal:</span>
                    <span className="font-bold">Rs. {activePrintInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  {activePrintInvoice.discount > 0 && (
                    <div className="flex justify-between sm:justify-end gap-10 text-rose-600">
                      <span className="text-[9px]">Additional Flat Discount:</span>
                      <span className="font-bold">Rs. -{activePrintInvoice.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {activePrintInvoice.taxAmount > 0 && (
                    <div className="flex justify-between sm:justify-end gap-10 text-gray-500">
                      <span className="text-[9px]">Govt VAT ({activePrintInvoice.taxPercent}%):</span>
                      <span className="font-bold">Rs. {activePrintInvoice.taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between sm:justify-end gap-10 border-t border-gray-200 pt-1.5 text-[11px] font-sans font-bold text-blue-700">
                    <span>Grand Net Invoice Total:</span>
                    <span className="font-mono">Rs. {activePrintInvoice.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between sm:justify-end gap-10 text-emerald-600 border-b border-gray-100 pb-1.5">
                    <span className="text-[9px]">Instant Cleared Paid:</span>
                    <span className="font-bold">Rs. {activePrintInvoice.paidAmount.toLocaleString()}</span>
                  </div>
                  {activePrintInvoice.dueAmount > 0 && (
                    <div className="flex justify-between sm:justify-end gap-10 text-rose-600 font-extrabold text-xs">
                      <span className="text-[9px]">Outstanding Balance Due:</span>
                      <span>Rs. {activePrintInvoice.dueAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature section */}
              <div className="flex justify-between items-end mt-12 pr-4 text-[10px]" id="signatures">
                <div className="text-center" id="sig-buyer">
                  <div className="h-0.5 w-24 bg-gray-300 mb-1"></div>
                  <span className="text-gray-400">Customer Receiver Signature</span>
                </div>
                
                <div className="text-center" id="sig-seller">
                  <div className="h-0.5 w-24 bg-gray-550 mb-1"></div>
                  <span className="text-gray-800 font-semibold">{businessConfig.name}</span>
                  <span className="text-gray-400 block text-[8px] uppercase font-bold mt-0.5">Authorized Cashier Stall</span>
                </div>
              </div>

              <div className="h-0.5 bg-gray-200 w-full mt-8"></div>
            </div>

            {/* Note alert */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 p-2 rounded-lg border border-gray-250 italic" id="print-pdf-warning">
              <Info className="h-4 w-4 text-gray-400 shrink-0" />
              <span>Direct System Print option will open standard system print prompts where target destination can be selected as "Save to PDF" block.</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
