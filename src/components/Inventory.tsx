import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { 
  Plus, Search, Edit2, AlertTriangle, Layers, ArrowUpRight, ArrowDownRight, 
  History, Settings, BookOpen, Trash, Database, Info, Filter, Printer
} from 'lucide-react';
import { formatBSDate, getTodayBS } from '../utils/nepaliCalendar';

export const Inventory: React.FC = () => {
  const { 
    products, stockMovements, submitProduct, adjustStockQuantity, 
    currentUserRole, invoices, setProducts, businessConfig
  } = useApp();

  // Selected tab: 'roster' | 'movements'
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'movements'>('roster');
  
  // Search state
  const [productQuery, setProductQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modals state
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState<boolean>(false);
  const [selectedProductToAdjust, setSelectedProductToAdjust] = useState<Product | null>(null);

  // Printing state
  const [showPrintStockModal, setShowPrintStockModal] = useState<boolean>(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Edit/Delete Modals state
  const [showEditProductModal, setShowEditProductModal] = useState<boolean>(false);
  const [selectedProductToEdit, setSelectedProductToEdit] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedProductToDelete, setSelectedProductToDelete] = useState<Product | null>(null);

  // Add product form states
  const [newName, setNewName] = useState<string>('');
  const [newNepaliName, setNewNepaliName] = useState<string>('');
  const [newSku, setNewSku] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Notebooks & Diaries');
  const [newUnit, setNewUnit] = useState<string>('pcs');
  const [newPurchasePrice, setNewPurchasePrice] = useState<number>(0);
  const [newSellingPrice, setNewSellingPrice] = useState<number>(0);
  const [newStockQty, setNewStockQty] = useState<number>(0);
  const [newMinAlert, setNewMinAlert] = useState<number>(5);
  const [newDesc, setNewDesc] = useState<string>('');

  // Edit product form states
  const [editName, setEditName] = useState<string>('');
  const [editNepaliName, setEditNepaliName] = useState<string>('');
  const [editSku, setEditSku] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editUnit, setEditUnit] = useState<string>('');
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(0);
  const [editSellingPrice, setEditSellingPrice] = useState<number>(0);
  const [editMinAlert, setEditMinAlert] = useState<number>(5);
  const [editDesc, setEditDesc] = useState<string>('');
  const [editError, setEditError] = useState<string>('');

  // Stock Adjustment form states
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('Physical Count Surplus');
  const [adjustType, setAdjustType] = useState<'add' | 'sub'>('add');

  // Default Stationery Categories
  const DEFAULT_STATIONERY_CATEGORIES = [
    'Notebooks & Diaries',
    'Pens, Pencils & Markers',
    'Paper & Envelopes',
    'Desk Organizers',
    'Art & Craft Supplies',
    'Office Stationery',
    'School Stationery',
    'Binding & Laminating'
  ];

  // Master Categories list based on active products and defaults
  const categoriesList = ['All', ...Array.from(new Set([
    ...DEFAULT_STATIONERY_CATEGORIES,
    ...products.map(p => p.category)
  ]))];

  // Filtering products
  const filteredProducts = products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
                         p.sku.toLowerCase().includes(productQuery.toLowerCase()) ||
                         (p.nepaliName && p.nepaliName.includes(productQuery));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  // Calculate global summary states
  const totalValuation = products.reduce((sum, p) => sum + (p.stockQty * p.purchasePrice), 0);
  const totalDuesMargin = products.reduce((sum, p) => sum + (p.stockQty * (p.sellingPrice - p.purchasePrice)), 0);
  const lowStockCount = products.filter(p => p.stockQty <= p.minStockAlert).length;
  const outOfStockCount = products.filter(p => p.stockQty === 0).length;

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSku.trim()) return;

    submitProduct({
      name: newName,
      nepaliName: newNepaliName || undefined,
      sku: newSku.toUpperCase(),
      category: newCategory,
      unit: newUnit,
      purchasePrice: newPurchasePrice,
      sellingPrice: newSellingPrice,
      stockQty: newStockQty,
      minStockAlert: newMinAlert,
      description: newDesc || undefined
    });

    // Reset fields
    setNewName('');
    setNewNepaliName('');
    setNewSku('');
    setNewCategory('Notebooks & Diaries');
    setNewUnit('pcs');
    setNewPurchasePrice(0);
    setNewSellingPrice(0);
    setNewStockQty(0);
    setNewMinAlert(5);
    setNewDesc('');
    setShowAddProductModal(false);
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductToAdjust) return;

    const modifier = adjustType === 'add' ? adjustQty : -adjustQty;
    adjustStockQuantity(selectedProductToAdjust.id, modifier, adjustReason);

    setShowAdjustStockModal(false);
    setSelectedProductToAdjust(null);
    setAdjustQty(1);
    setAdjustReason('Physical Count Surplus');
  };

  const handleEditProductClick = (p: Product) => {
    setSelectedProductToEdit(p);
    setEditName(p.name);
    setEditNepaliName(p.nepaliName || '');
    setEditSku(p.sku);
    setEditCategory(p.category);
    setEditUnit(p.unit);
    setEditPurchasePrice(p.purchasePrice);
    setEditSellingPrice(p.sellingPrice);
    setEditMinAlert(p.minStockAlert);
    setEditDesc(p.description || '');
    setEditError('');
    setShowEditProductModal(true);
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductToEdit) return;
    if (!editName.trim() || !editSku.trim()) {
      setEditError('Name and SKU are required');
      return;
    }

    const skuConflict = products.some(p => p.sku.toUpperCase() === editSku.toUpperCase() && p.id !== selectedProductToEdit.id);
    if (skuConflict) {
      setEditError(`SKU code "${editSku.toUpperCase()}" is already in use by another product.`);
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.id === selectedProductToEdit.id) {
        return {
          ...p,
          name: editName,
          nepaliName: editNepaliName || undefined,
          sku: editSku.toUpperCase(),
          category: editCategory,
          unit: editUnit,
          purchasePrice: editPurchasePrice,
          sellingPrice: editSellingPrice,
          minStockAlert: editMinAlert,
          description: editDesc || undefined
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    setShowEditProductModal(false);
    setSelectedProductToEdit(null);
  };

  const handleDeleteProductClick = (p: Product) => {
    setSelectedProductToDelete(p);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedProductToDelete) return;

    const isSold = invoices.some(inv => inv.items.some(item => item.productId === selectedProductToDelete.id));
    if (isSold) {
      return;
    }

    const updatedProducts = products.filter(p => p.id !== selectedProductToDelete.id);
    setProducts(updatedProducts);
    setShowDeleteModal(false);
    setSelectedProductToDelete(null);
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
    <div className="space-y-6 max-w-7xl mx-auto" id="inventory-module-container">
      
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4" id="inventory-header">
        <div>
          <h1 className="text-xl font-semibold text-gray-900" id="inventory-title">Product & Stock Ledger</h1>
          <p className="text-xs text-gray-500" id="inventory-desc">Track trading item movements, perform audit adjustments, and verify low stock alerts</p>
        </div>

        <div className="flex gap-2" id="inventory-view-toggle">
          <button
            id="btn-subtab-roster"
            onClick={() => setActiveSubTab('roster')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'roster' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            Product Catalog
          </button>
          <button
            id="btn-subtab-movements"
            onClick={() => setActiveSubTab('movements')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'movements' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            Stock Movement History
          </button>
        </div>
      </div>

      {activeSubTab === 'roster' ? (
        <div className="space-y-5" id="roster-view">
          
          {/* Valuations KPI blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="inventory-stats-grid">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xxs">
              <span className="text-[10px] uppercase font-semibold text-gray-400 block tracking-wider">Total Warehouse Cost Value</span>
              <span className="text-lg font-bold text-gray-900 block font-mono mt-1">Rs. {totalValuation.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Estimated wholesale asset pricing</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xxs">
              <span className="text-[10px] uppercase font-semibold text-gray-400 block tracking-wider">Projected Trading Margin</span>
              <span className="text-lg font-bold text-blue-600 block font-mono mt-1">Rs. {totalDuesMargin.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Potential earnings based on retail rates</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-xxs bg-rose-50/20">
              <span className="text-[10px] uppercase font-semibold text-red-500 block tracking-wider">Critical Low Stock</span>
              <span className="text-lg font-bold text-rose-600 block font-mono mt-1">{lowStockCount} Items</span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Stock counts below alert limits</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xxs bg-rose-100/10">
              <span className="text-[10px] uppercase font-semibold text-rose-500 block tracking-wider">Out Of Stock</span>
              <span className="text-lg font-bold text-rose-700 block font-mono mt-1">{outOfStockCount} Items</span>
              <span className="text-[10px] text-gray-450 mt-0.5 block">Completely unavailable for billing</span>
            </div>
          </div>

          {/* Catalog Operations bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xxs" id="roster-ops-bar">
            
            <div className="flex flex-wrap items-center gap-2 flex-1 w-full" id="roster-filters">
              <div className="relative flex-1 max-w-sm" id="roster-search-field">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search-catalog-input"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search catalog by SKU, English or Nepali names..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Category filter */}
              <div className="inline-flex items-center gap-1.5" id="roster-cat-filter">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <select
                  id="filter-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg p-2 outline-none bg-white"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto" id="roster-top-actions">
              <button
                id="btn-print-stock-report"
                onClick={() => {
                  setPrintOrientation('landscape');
                  setShowPrintStockModal(true);
                }}
                className="w-full sm:w-auto px-4.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-250 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                title="Print Inventory Stock & Valuation Record"
              >
                <Printer className="h-4 w-4 text-gray-500" />
                <span>स्टक विवरण (Print Report)</span>
              </button>
              {currentUserRole !== 'Staff' && (
                <button
                  id="btn-add-product-modal"
                  onClick={() => setShowAddProductModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs hover:bg-blue-700 transition"
                >
                  <Plus className="h-4 w-4" /> Add Product SKU
                </button>
              )}
            </div>
          </div>

          {/* Products Catalog Table list */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xxs overflow-hidden" id="roster-table-card">
            <div className="overflow-x-auto" id="roster-table-wrapper">
              <table className="w-full text-left border-collapse text-xs" id="inventory-roster-table">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <th id="th-inv-sku" className="p-4 w-28">SKU</th>
                    <th id="th-inv-particulars" className="p-4">Particulars Name</th>
                    <th id="th-inv-cat" className="p-4">Category</th>
                    <th id="th-inv-cost" className="p-4 text-right">Cost Price (Rs)</th>
                    <th id="th-inv-retail" className="p-4 text-right">Retail Price (Rs)</th>
                    <th id="th-inv-stock" className="p-4 text-center">Remaining Stock</th>
                    <th id="th-inv-level" className="p-4">Thresh Level</th>
                    <th id="th-inv-actions" className="p-4 text-center w-56">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 animate-fade-in" id="inventory-roster-tbody">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-400">
                        No product SKUs found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isLowStock = p.stockQty <= p.minStockAlert;
                      const isOutOfStock = p.stockQty === 0;

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/40" id={`row-product-item-${p.id}`}>
                          <td className="p-4 font-mono font-bold text-gray-900 select-all uppercase">{p.sku}</td>
                          <td className="p-4">
                            <span className="font-semibold text-gray-800 block">{p.name}</span>
                            {p.nepaliName && (
                              <span className="text-[10px] text-gray-400 block font-normal">{p.nepaliName}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-[10px] text-gray-500 font-medium">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono font-medium">Rs. {p.purchasePrice}</td>
                          <td className="p-4 text-right font-mono font-bold text-blue-700">Rs. {p.sellingPrice}</td>
                          <td className="p-4 text-center font-mono">
                            <span className={`px-2 py-1 rounded-md font-extrabold text-[11px] inline-block ${
                              isOutOfStock 
                                ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                : isLowStock 
                                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                            }`}>
                              {p.stockQty} {p.unit}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-gray-400">Alert below {p.minStockAlert} {p.unit}</span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center items-center gap-1.5" id="inventory-operations-col">
                              <button
                                id={`btn-audit-stock-${p.id}`}
                                onClick={() => {
                                  setSelectedProductToAdjust(p);
                                  setShowAdjustStockModal(true);
                                }}
                                className="p-1 px-2 hover:bg-gray-150 border border-gray-200 rounded text-gray-700 font-semibold active:scale-95 transition text-[10px] flex items-center gap-1 cursor-pointer"
                                title="Adjust Stock Quantity (Add or Deduct)"
                              >
                                <Database className="h-3 w-3 text-gray-400" /> Adjust Stock
                              </button>

                              {currentUserRole !== 'Staff' && (
                                <>
                                  <button
                                    id={`btn-edit-product-${p.id}`}
                                    onClick={() => handleEditProductClick(p)}
                                    className="p-1 px-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-gray-200 rounded text-gray-600 font-semibold active:scale-95 transition text-[10px] flex items-center gap-1 cursor-pointer"
                                    title="Edit Product Details"
                                  >
                                    <Edit2 className="h-3 w-3 text-blue-500" /> Edit
                                  </button>
                                  <button
                                    id={`btn-delete-product-${p.id}`}
                                    onClick={() => handleDeleteProductClick(p)}
                                    className="p-1 px-2 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-gray-200 rounded text-gray-600 font-semibold active:scale-95 transition text-[10px] flex items-center gap-1 cursor-pointer"
                                    title="Delete Product"
                                  >
                                    <Trash className="h-3 w-3 text-rose-500" /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* STOCK MOVEMENTS CHRONOLOGY LEDGER VIEW */
        <div className="bg-white rounded-xl border border-gray-100 shadow-xxs overflow-hidden p-4 space-y-4" id="movements-view">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
              <History className="h-4.5 w-4.5 text-blue-500" /> Chronological Stock Movements Ledger
            </h3>
            <p className="text-xs text-gray-400">Real-time accounting receipts, cancellations and audit corrections recorded instantly</p>
          </div>

          <div className="overflow-x-auto" id="movements-table-wrapper">
            <table className="w-full text-left border-collapse text-xs" id="movements-log-table">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                  <th id="th-log-date" className="p-4">Date BS (AD)</th>
                  <th id="th-log-prod" className="p-4">Product Name</th>
                  <th id="th-log-type" className="p-4">Movement Type</th>
                  <th id="th-log-qty" className="p-4 text-center">Units Changed</th>
                  <th id="th-log-ref" className="p-4 font-mono">Reference Code</th>
                  <th id="th-log-notes" className="p-4">Remarks Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-600" id="movements-log-tbody">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      No stock movement history detected.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((sm) => {
                    const isAddition = ['purchase', 'adjustment_add', 'return'].includes(sm.type);
                    return (
                      <tr key={sm.id} className="hover:bg-gray-50/20" id={`row-movement-log-${sm.id}`}>
                        <td className="p-4 font-medium">
                          {sm.bsDate}
                          <span className="block text-[10px] text-gray-400 font-normal">{sm.date}</span>
                        </td>
                        <td className="p-4 font-semibold text-gray-800">{sm.productName}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] inline-block ${
                            sm.type === 'sale' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : sm.type === 'purchase'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : sm.type === 'return'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-purple-50 text-purple-700 border border-purple-100'
                          }`}>
                            {sm.type === 'sale' && 'Sale Dedux'}
                            {sm.type === 'purchase' && 'Purchase Influx'}
                            {sm.type === 'return' && 'Sales Return'}
                            {sm.type === 'adjustment_add' && 'Manual Addition'}
                            {sm.type === 'adjustment_sub' && 'Manual Write-Off'}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold">
                          <span className={`font-mono text-[11px] flex items-center justify-center gap-0.5 ${isAddition ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {isAddition ? '+' : '-'} {sm.quantity}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-gray-400">{sm.referenceId || '-'}</td>
                        <td className="p-4 italic max-w-xs truncate">{sm.notes || 'Automated background audit'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW TRADING SKU SKU */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-add-product">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 border border-gray-150" id="add-product-modal-inner">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-950 text-sm">Create New Product SKU Profile</span>
              <button 
                id="btn-close-product-modal"
                onClick={() => setShowAddProductModal(false)} 
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-3.5 text-xs" id="add-product-form">
              <div className="grid grid-cols-2 gap-3" id="product-meta-inputs">
                <div className="space-y-1">
                  <label className="text-gray-600 block">Product English Name *</label>
                  <input
                    type="text"
                    id="input-product-name-en"
                    required
                    placeholder="e.g. A4 Premium Photocopy Paper"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block">Nepali Label Translation</label>
                  <input
                    type="text"
                    id="input-product-name-np"
                    placeholder="e.g. ए४ फोटोकपी पेपर"
                    value={newNepaliName}
                    onChange={(e) => setNewNepaliName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3" id="product-code-inputs">
                <div className="space-y-1">
                  <label className="text-gray-600 block">SKU Code *</label>
                  <input
                    type="text"
                    id="input-product-sku"
                    required
                    placeholder="e.g. PAPER-A4-01"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono uppercase outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-605 block">Category *</label>
                  <input
                    type="text"
                    id="select-product-category"
                    required
                    list="product-categories-datalist"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Notebooks & Diaries"
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none bg-white focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                  <datalist id="product-categories-datalist">
                    {categoriesList.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-600 block">Quantity Unit</label>
                  <input
                    type="text"
                    id="input-product-unit"
                    required
                    placeholder="pcs, kg, case, ltr"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3" id="product-financial-inputs">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Purchase Cost Price (Rs) *</label>
                  <input
                    type="number"
                    id="input-product-cost"
                    required
                    min="0"
                    placeholder="Cost value"
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-600 block">Retail Selling Price (Rs) *</label>
                  <input
                    type="number"
                    id="input-product-retail"
                    required
                    min="0"
                    placeholder="Retail tag rate"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3" id="product-stock-inputs">
                <div className="space-y-1">
                  <label className="text-gray-600 block">Initial Opening Stock</label>
                  <input
                    type="number"
                    id="input-product-initial-stock"
                    required
                    min="0"
                    placeholder="Count"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block">Low Stock Alert Thresh</label>
                  <input
                    type="number"
                    id="input-product-alert-threshold"
                    required
                    min="0"
                    placeholder="Count alert"
                    value={newMinAlert}
                    onChange={(e) => setNewMinAlert(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Item General Description</label>
                <textarea
                  id="textarea-product-desc"
                  placeholder="Optional notes regarding suppliers or quality specs..."
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                id="btn-confirm-save-product"
                className="w-full py-3 bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700 active:scale-98 transition"
              >
                Save Catalog SKU Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL STOCK AUDIT調整 */}
      {showAdjustStockModal && selectedProductToAdjust && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-adjust-stock">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-150" id="adjust-stock-inner">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-955 text-xs uppercase tracking-tight">Adjust Stock Level (Add/Deduct)</span>
              <button 
                id="btn-close-adjust-modal"
                onClick={() => {
                  setShowAdjustStockModal(false);
                  setSelectedProductToAdjust(null);
                }} 
                className="text-gray-400 hover:text-gray-600 font-sans"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-xs" id="adjust-dialog-meta">
              <span className="text-gray-400 font-medium block">Selected Trading SKU SKU:</span>
              <span className="font-extrabold text-gray-900 block">{selectedProductToAdjust.name}</span>
              <span className="text-gray-400">Current system stock value: <strong className="text-blue-700 font-mono">{selectedProductToAdjust.stockQty} {selectedProductToAdjust.unit}</strong></span>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-3.5 text-xs" id="adjust-stock-form">
              <div className="grid grid-cols-2 gap-3" id="adjust-type-toggle">
                <button
                  id="btn-adjust-type-add"
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                    adjustType === 'add'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Add Stock Influx
                </button>
                <button
                  id="btn-adjust-type-sub"
                  type="button"
                  onClick={() => setAdjustType('sub')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                    adjustType === 'sub'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Deduct / Write-Off
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Quantity units *</label>
                <input
                  type="number"
                  id="input-adjust-qty"
                  required
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Auditing Reason *</label>
                <select
                  id="select-adjust-reason"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none bg-white font-semibold"
                >
                  <option value="Physical Count Surplus">Physical Count Surplus</option>
                  <option value="Supplier Harvest Delivery Influx">Supplier Harvest Delivery Influx</option>
                  <option value="Damaged / Rot / Broken Product">Damaged / Rot / Broken Items</option>
                  <option value="Theft / Lost count stock out">Theft / Lost Audit Item</option>
                  <option value="Demo Promotion Sample Free Dispatch">Demo Promotion Sample Dispatch</option>
                </select>
              </div>

              <button
                type="submit"
                id="btn-confirm-adjust"
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-97 transition"
              >
                Record Audited Stock adjustment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT DETAILS */}
      {showEditProductModal && selectedProductToEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-edit-product">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 border border-gray-150" id="edit-product-modal-inner">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-950 text-sm">Edit Product Profile (विवरण सम्पादन)</span>
              <button 
                id="btn-close-edit-product-modal"
                onClick={() => {
                  setShowEditProductModal(false);
                  setSelectedProductToEdit(null);
                }} 
                className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="bg-rose-50 text-rose-800 border border-rose-100 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5" id="edit-product-error">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditProductSubmit} className="space-y-3.5 text-xs" id="edit-product-form">
              <div className="grid grid-cols-2 gap-3" id="edit-product-meta-inputs">
                <div className="space-y-1">
                  <label className="text-gray-600 block">Product English Name *</label>
                  <input
                    type="text"
                    id="edit-input-product-name-en"
                    required
                    placeholder="e.g. A4 Premium Photocopy Paper"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block">Nepali Label Translation</label>
                  <input
                    type="text"
                    id="edit-input-product-name-np"
                    placeholder="e.g. ए४ फोटोकपी पेपर"
                    value={editNepaliName}
                    onChange={(e) => setEditNepaliName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3" id="edit-product-code-inputs">
                <div className="space-y-1">
                  <label className="text-gray-600 block">SKU Code *</label>
                  <input
                    type="text"
                    id="edit-input-product-sku"
                    required
                    placeholder="e.g. PAPER-A4-01"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono uppercase outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-655 block">Category *</label>
                  <input
                    type="text"
                    id="edit-select-product-category"
                    required
                    list="product-categories-datalist"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="e.g. Notebooks & Diaries"
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none bg-white focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-600 block">Quantity Unit</label>
                  <input
                    type="text"
                    id="edit-input-product-unit"
                    required
                    placeholder="pcs, kg, case, ltr"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3" id="edit-product-financial-inputs">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Purchase Cost Price (Rs) *</label>
                  <input
                    type="number"
                    id="edit-input-product-cost"
                    required
                    min="0"
                    placeholder="Cost value"
                    value={editPurchasePrice}
                    onChange={(e) => setEditPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-600 block">Retail Selling Price (Rs) *</label>
                  <input
                    type="number"
                    id="edit-input-product-retail"
                    required
                    min="0"
                    placeholder="Retail tag rate"
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Low Stock Alert Thresh</label>
                <input
                  type="number"
                  id="edit-input-product-alert-threshold"
                  required
                  min="0"
                  placeholder="Count alert"
                  value={editMinAlert}
                  onChange={(e) => setEditMinAlert(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Item General Description</label>
                <textarea
                  id="edit-textarea-product-desc"
                  placeholder="Optional notes regarding suppliers or quality specs..."
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                id="btn-confirm-edit-product"
                className="w-full py-3 bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700 active:scale-98 transition cursor-pointer"
              >
                Save Updated SKU Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE PRODUCT VERIFICATION */}
      {showDeleteModal && selectedProductToDelete && (() => {
        const isSold = invoices.some(inv => inv.items.some(item => item.productId === selectedProductToDelete.id));

        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-delete-product">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-150" id="delete-product-inner">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-semibold text-gray-950 text-xs uppercase tracking-tight text-rose-600">
                  {isSold ? 'Product Deletion Blocked' : 'Confirm Product Deletion'}
                </span>
                <button 
                  id="btn-close-delete-modal"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProductToDelete(null);
                  }} 
                  className="text-gray-400 hover:text-gray-600 font-sans cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {isSold ? (
                <div className="space-y-4" id="delete-blocked-view">
                  <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-lg p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                      <span>Cannot Delete Active SKU</span>
                    </div>
                    <p className="leading-relaxed">
                      The product <strong className="font-extrabold text-gray-900">"{selectedProductToDelete.name}"</strong> (SKU: <span className="font-mono">{selectedProductToDelete.sku}</span>) has <strong>already been sold</strong> in historical invoices.
                    </p>
                    <p className="leading-relaxed text-[11px] text-amber-700">
                      To preserve financial records and keep your sales history & daybook reports accurate, deleting sold items is strictly restricted.
                    </p>
                  </div>
                  <button
                    id="btn-close-blocked-modal"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedProductToDelete(null);
                    }}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Close Dialog
                  </button>
                </div>
              ) : (
                <div className="space-y-4" id="delete-confirmed-view">
                  <div className="space-y-2 text-xs text-gray-600">
                    <p>Are you sure you want to permanently delete the product from the catalog?</p>
                    <div className="bg-gray-50 border border-gray-150 rounded-lg p-3 space-y-1">
                      <span className="text-gray-400 font-medium block">Product Name:</span>
                      <strong className="font-black text-gray-900 block">{selectedProductToDelete.name}</strong>
                      <span className="text-gray-400 font-medium block mt-1">SKU Code:</span>
                      <strong className="font-mono text-gray-900 block uppercase">{selectedProductToDelete.sku}</strong>
                    </div>
                    <p className="text-rose-600 font-bold">This action is irreversible and will remove this product immediately from your inventory ledger.</p>
                  </div>

                  <div className="flex gap-2 text-xs" id="delete-actions-row">
                    <button
                      id="btn-cancel-delete"
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setSelectedProductToDelete(null);
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
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL: NEPAL INVENTORY STOCK LEDGER (जिन्सी मौज्दात विवरण) PRINT HUB */}
      {showPrintStockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="modal-stock-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4 border text-left" id="stock-print-container">
            
            {/* Action Bar */}
            <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-3" id="stock-print-action-bar">
              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Nepal Inventory Stock & Valuation (जिन्सी मौज्दात प्रतिवेदन)</h3>
                <p className="text-[10px] text-gray-450 font-medium">Standardized stock list, asset valuation, and trading margin summary for Nepalese auditing compliance</p>
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
                  Portrait (ठाडो)
                </button>
                <button 
                  onClick={() => setPrintOrientation('landscape')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md border transition ${
                    printOrientation === 'landscape' 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                      : 'bg-white text-gray-700 border-gray-250 hover:bg-gray-50'
                  }`}
                >
                  Landscape (तेर्सो) - Best
                </button>
                <button
                  id="btn-trigger-stock-print"
                  onClick={() => triggerPrintForElement('stock-ledger-print-content', 'Inventory Stock Report', printOrientation)}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Report
                </button>
                <button 
                  onClick={() => setShowPrintStockModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs px-2 font-bold"
                >
                  Close ✕
                </button>
              </div>
            </div>

            {/* Print Sheet Area */}
            <div className="bg-gray-50 border p-4 rounded-xl max-h-[60vh] overflow-y-auto" id="stock-preview-viewport">
              <div 
                id="stock-ledger-print-content" 
                className="bg-white border p-6 mx-auto shadow-sm text-gray-900 text-xs leading-relaxed" 
                style={{ width: '100%', maxWidth: printOrientation === 'portrait' ? '650px' : '100%', minHeight: '500px' }}
              >
                
                {/* Header Information */}
                <div className="text-center space-y-1.5 border-b-2 border-double border-gray-800 pb-3" id="stock-sheet-header">
                  {businessConfig.logo && (
                    <img src={businessConfig.logo} alt="Company Logo" className="h-10 mx-auto object-contain mb-1" referrerPolicy="no-referrer" />
                  )}
                  <h1 className="text-sm font-black text-gray-950 uppercase">{businessConfig.nepaliName || businessConfig.name}</h1>
                  <p className="text-[10px] text-gray-500 font-semibold">{businessConfig.address}</p>
                  <p className="text-[10px] text-gray-500 font-mono">फोन नं: {businessConfig.phone} | PAN/VAT No: {businessConfig.panVat || 'N/A'}</p>
                  
                  <div className="pt-2">
                    <span className="inline-block px-4 py-1 border border-gray-900 text-[11px] font-black tracking-widest uppercase rounded">
                      जिन्सी मौज्दात तथा मूल्यांकन प्रतिवेदन (STOCK LEDGER & VALUATION REPORT)
                    </span>
                  </div>
                </div>

                {/* Meta Rows */}
                <div className="grid grid-cols-2 justify-between items-center text-[10px] py-3 font-semibold border-b border-gray-200" id="stock-sheet-meta">
                  <div className="space-y-1 text-left">
                    <p><span className="text-gray-500">प्रतिवेदन वर्ग (Category):</span> <span className="font-bold text-gray-900">{selectedCategory}</span></p>
                    <p><span className="text-gray-500">कुल वस्तु सङ्ख्या (SKUs):</span> <span className="font-bold text-gray-900 font-mono">{filteredProducts.length}</span></p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p><span className="text-gray-500">मिति (BS Date):</span> <span className="font-mono text-gray-900">{getTodayBS()}</span></p>
                    <p><span className="text-gray-500">मिति (AD Date):</span> <span className="font-mono text-gray-900">{new Date().toISOString().split('T')[0]}</span></p>
                  </div>
                </div>

                {/* Valuation Summary Blocks inside Sheet */}
                <div className="grid grid-cols-3 gap-2 py-3 border-b border-gray-200 text-center font-bold text-[9px] text-gray-600 bg-gray-50 p-2 rounded-lg my-3" id="stock-summary-sheet-box">
                  <div>
                    <span className="block text-gray-450 uppercase">कुल मौज्दात मूल्य (Total Valuation):</span>
                    <span className="block text-[11px] font-black text-gray-950 font-mono mt-0.5">Rs. {filteredProducts.reduce((sum, p) => sum + (p.stockQty * p.purchasePrice), 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-gray-450 uppercase">कुल बिक्री मूल्य (Retail Valuation):</span>
                    <span className="block text-[11px] font-black text-blue-700 font-mono mt-0.5">Rs. {filteredProducts.reduce((sum, p) => sum + (p.stockQty * p.sellingPrice), 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-gray-450 uppercase">अनुमानित नाफा (Potential Profit Margin):</span>
                    <span className="block text-[11px] font-black text-emerald-700 font-mono mt-0.5">Rs. {filteredProducts.reduce((sum, p) => sum + (p.stockQty * (p.sellingPrice - p.purchasePrice)), 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Stock Table */}
                <div className="mt-4 border border-gray-800 rounded-lg overflow-hidden text-[9px]" id="stock-table-wrapper">
                  <table className="w-full text-left border-collapse" id="stock-print-table">
                    <thead>
                      <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-800 uppercase">
                        <th id="th-stk-sn" className="p-1.5 border-r border-gray-800 w-10 text-center">क्र.सं. (S.N)</th>
                        <th id="th-stk-sku" className="p-1.5 border-r border-gray-800 w-20">SKU</th>
                        <th id="th-stk-name" className="p-1.5 border-r border-gray-800">विवरण (Product Name)</th>
                        <th id="th-stk-cat" className="p-1.5 border-r border-gray-800 w-24">वर्ग (Category)</th>
                        <th id="th-stk-qty" className="p-1.5 border-r border-gray-800 text-center w-20">मौज्दात परिमाण (Qty)</th>
                        <th id="th-stk-cost" className="p-1.5 border-r border-gray-800 text-right w-20">खरिद दर (Cost Rate)</th>
                        <th id="th-stk-sell" className="p-1.5 border-r border-gray-800 text-right w-20">बिक्री दर (Sell Rate)</th>
                        <th id="th-stk-tot" className="p-1.5 text-right w-24">कुल मौज्दात मूल्य (Total Value)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300 font-medium" id="stock-print-tbody">
                      {filteredProducts.map((p, idx) => {
                        const costValue = p.stockQty * p.purchasePrice;
                        return (
                          <tr key={p.id} className="align-middle">
                            <td className="p-1.5 border-r border-gray-800 text-center font-mono">{idx + 1}</td>
                            <td className="p-1.5 border-r border-gray-800 font-mono text-gray-700">{p.sku}</td>
                            <td className="p-1.5 border-r border-gray-800 font-semibold">
                              {p.name} {p.nepaliName && <span className="text-[8px] text-gray-500">({p.nepaliName})</span>}
                            </td>
                            <td className="p-1.5 border-r border-gray-800 text-gray-600">{p.category}</td>
                            <td className="p-1.5 border-r border-gray-800 text-center font-mono font-bold">
                              {p.stockQty} <span className="text-[8px] text-gray-400 font-normal">{p.unit}</span>
                            </td>
                            <td className="p-1.5 border-r border-gray-800 text-right font-mono">Rs. {p.purchasePrice.toLocaleString()}</td>
                            <td className="p-1.5 border-r border-gray-800 text-right font-mono">Rs. {p.sellingPrice.toLocaleString()}</td>
                            <td className="p-1.5 text-right font-mono font-bold text-gray-950">Rs. {costValue.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-gray-400 font-semibold">
                            No products matching filters currently configured in catalog database.
                          </td>
                        </tr>
                      )}
                      {/* Total valuation row */}
                      <tr className="bg-gray-100 font-bold border-t border-gray-800 text-[10px]">
                        <td colSpan={4} className="p-2 border-r border-gray-800 text-right uppercase">
                          जम्मा मौज्दात मूल्यांकन (Total Asset Cost Value):
                        </td>
                        <td className="p-2 border-r border-gray-800 text-center font-mono font-black text-gray-950">
                          {filteredProducts.reduce((sum, p) => sum + p.stockQty, 0)}
                        </td>
                        <td className="p-2 border-r border-gray-800"></td>
                        <td className="p-2 border-r border-gray-800"></td>
                        <td className="p-2 text-right font-mono font-black text-gray-950">
                          Rs. {filteredProducts.reduce((sum, p) => sum + (p.stockQty * p.purchasePrice), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footnote details */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-dashed text-[8px] text-gray-500" id="stock-footers">
                  <div className="text-left">
                    <p>टिप्पणी: जिन्सी शाखाका कर्मचारीले मौज्दात परिमाण भौतिक गणना (Physical stock count) गरी प्रमाणित गरेको हुनुपर्नेछ ।</p>
                  </div>
                  <div className="text-right font-bold space-y-4">
                    <div className="h-6"></div>
                    <p className="border-t border-gray-400 pt-1.5 inline-block w-48 text-center">जिन्सी प्रमुखको हस्ताक्षर (Store Keeper Sign)</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Hint box */}
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] text-blue-800 flex items-center gap-1.5 font-medium leading-relaxed" id="stock-print-help">
              <span>💡 Stock and valuation statements containing multiple SKU cost rates are best printed in <strong>Landscape</strong> layout to align table widths cleanly.</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
