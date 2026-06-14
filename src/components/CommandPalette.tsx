import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Terminal, ArrowRight, Sparkles, ShoppingCart, Eye, Layers, Database, Landmark, User, ShieldAlert } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, setActiveTab }) => {
  const { products, customers } = useApp();
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Handle ESC shortcuts to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Actions catalog
  const navigationActions = [
    { title: 'Go to Billing Checkout POS', icon: ShoppingCart, category: 'Navigation', shortcut: 'F2', action: () => { setActiveTab('billing'); onClose(); } },
    { title: 'Inspect Warehouse Stock Inventory', icon: Layers, category: 'Navigation', action: () => { setActiveTab('inventory'); onClose(); } },
    { title: 'View Customers & Suppliers Ledgers', icon: User, category: 'Navigation', action: () => { setActiveTab('contacts'); onClose(); } },
    { title: 'Analyze Bookkeeping Trial Balances & P&L', icon: Landmark, category: 'Navigation', action: () => { setActiveTab('accounting'); onClose(); } },
    { title: 'Review Workplace Operational Expenses', icon: Database, category: 'Navigation', action: () => { setActiveTab('expenses'); onClose(); } },
    { title: 'Open System Corporate Settings', icon: Terminal, category: 'Navigation', action: () => { setActiveTab('settings'); onClose(); } },
  ];

  // Filtering list based on user search
  const filteredNavigation = navigationActions.filter(act => 
    act.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 3);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-start justify-center pt-24 z-50 p-4" id="global-command-palette-backdrop">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-155 max-w-lg w-full overflow-hidden flex flex-col" id="command-palette-inner">
        
        {/* Input Bar */}
        <div className="relative border-b border-gray-100 p-4 flex items-center gap-3 bg-gray-50/50" id="palette-search-container">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            type="text"
            id="palette-search-input"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type a command (e.g., 'billing'), query a product sku, or search customer..."
            className="w-full text-xs outline-none bg-transparent placeholder-gray-400 text-gray-800"
          />
          <span className="text-[9px] bg-gray-200 text-gray-500 font-mono px-1.5 py-0.5 rounded shadow-xxs shrink-0">ESC to Close</span>
        </div>

        {/* Results Stream */}
        <div className="max-h-74 overflow-y-auto p-2 space-y-3" id="palette-results-wrapper">
          
          {/* Section 1: Navigation Actions */}
          {filteredNavigation.length > 0 && (
            <div className="space-y-1" id="palette-navs-group">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block px-2.5 pb-1">System Navigation Navigation</span>
              {filteredNavigation.map((act) => (
                <div 
                  key={act.title}
                  id={`palette-nav-item-${act.title.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={act.action}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50/30 text-xs text-gray-700 hover:text-blue-700 cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <act.icon className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{act.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                    <span>Jump</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section 2: Products Quick check */}
          {filteredProducts.length > 0 && (
            <div className="space-y-1" id="palette-prods-group">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block px-2.5 pb-1">Price Check Warehouse Catalog</span>
              {filteredProducts.map((p) => (
                <div 
                  key={p.id}
                  id={`palette-prod-item-${p.id}`}
                  onClick={() => { setActiveTab('inventory'); onClose(); }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-xs text-gray-700 cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <span className="font-semibold block">{p.name}</span>
                      <span className="text-[9px] text-gray-400 font-mono uppercase tracking-wider">{p.sku} • Stock: {p.stockQty} {p.unit}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-blue-700">Rs. {p.sellingPrice}</span>
                </div>
              ))}
            </div>
          )}

          {/* Section 3: Customers outstanding check */}
          {filteredCustomers.length > 0 && (
            <div className="space-y-1" id="palette-custs-group font-sans">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block px-2.5 pb-1">Client Outstanding Balances</span>
              {filteredCustomers.map((c) => (
                <div 
                  key={c.id}
                  id={`palette-cust-item-${c.id}`}
                  onClick={() => { setActiveTab('contacts'); onClose(); }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-xs text-gray-700 cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <span className="font-semibold block">{c.name}</span>
                      <span className="text-[9px] text-gray-400">{c.phone}</span>
                    </div>
                  </div>
                  <span className={`font-mono font-bold ${c.outstandingDue > 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                    Rs. {c.outstandingDue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {filteredNavigation.length === 0 && filteredProducts.length === 0 && filteredCustomers.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-xs" id="palette-empty">
              No results found matching search string.
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
