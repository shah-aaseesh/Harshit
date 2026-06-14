import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Dashboard } from './components/Dashboard';
import { Billing } from './components/Billing';
import { Inventory } from './components/Inventory';
import { CustomerContacts } from './components/CustomerContacts';
import { Bookkeeping } from './components/Bookkeeping';
import { Expenses } from './components/Expenses';
import { Settings } from './components/Settings';
import { CommandPalette } from './components/CommandPalette';
import { 
  BarChart2, ShoppingCart, Layers, Users, BookOpen, Database, 
  Settings as SettingsIcon, Bell, Search, Menu, X, Sparkles, Terminal, LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatBSDate, getTodayBS } from './utils/nepaliCalendar';

// Inner App with context bound
const SajiloAppContent: React.FC = () => {
  const { 
    businessConfig, notifications, markNotificationRead, 
    currentUserRole, toggleRole 
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);

  // Global Key binds listener (F2 -> billing, Ctrl+K or / -> command palette)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // F2 to quick bill
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('billing');
      }
      // Ctrl+K or slash to command drawer
      if ((e.ctrlKey && e.key === 'k') || (e.key === 'f' && e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === '/' && (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Filter tabs list according to logged in Roles permissions
  const allTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart2, minPermission: 'Staff' },
    { id: 'billing', name: 'Billing POS', icon: ShoppingCart, minPermission: 'Staff' },
    { id: 'inventory', name: 'Stock & Inventory', icon: Layers, minPermission: 'Staff' },
    { id: 'contacts', name: 'Ledger Directory', icon: Users, minPermission: 'Staff' },
    { id: 'expenses', name: 'Workplace Expenses', icon: Database, minPermission: 'Staff' },
    { id: 'accounting', name: 'Bookkeeping Ledger', icon: BookOpen, minPermission: 'Manager' }, // Hidden for staff
    { id: 'settings', name: 'Sajilo Settings', icon: SettingsIcon, minPermission: 'Staff' },
  ];

  const allowedTabs = allTabs.filter(tab => {
    if (tab.minPermission === 'Owner' && currentUserRole !== 'Owner') return false;
    if (tab.minPermission === 'Manager' && currentUserRole === 'Staff') return false;
    return true;
  });

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white" id="sajilobiz-app-shell">
      
      {/* GLOBAL TOP NAV BAR BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-150 px-4 py-3 flex justify-between items-center shadow-xxs shrink-0" id="global-header-bar">
        
        {/* Mobile Header Toggle burger */}
        <div className="flex items-center gap-3" id="global-header-left">
          <button
            id="btn-mobile-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo brand */}
          <div className="flex items-center gap-2" id="brand-logo-panel">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm" id="brand-icon">
              S
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase">
                {businessConfig.name}
              </h1>
              <span className="text-[10px] text-gray-400 font-sans block mt-0.5" id="nepali-brand-caption">सजिलोबिज • Operating System</span>
            </div>
          </div>
        </div>

        {/* Universal controls: command trigger, notification, profile switcher */}
        <div className="flex items-center gap-3" id="global-header-right">
          
          {/* Mock Spotlight Search button */}
          <button
            id="btn-trigger-search-palette"
            onClick={() => setPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-150 hover:border-gray-300 rounded-lg text-xs text-gray-400 transition cursor-pointer select-none"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search or command (/)...</span>
          </button>

          {/* Notifications Alerts bell */}
          <div className="relative" id="notifications-bell-container">
            <button
              id="btn-toggle-notifications-dropdown"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-rose-500 text-white font-mono font-bold text-[8px] rounded-full flex items-center justify-center animate-bounce">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notification alert lists window popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3.5 space-y-3" id="notifications-popover">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-bold text-xs text-gray-900">Sajilo Notifications ({unreadNotifCount})</span>
                  <button 
                    id="btn-close-notif-dropdown"
                    onClick={() => setShowNotifications(false)} 
                    className="text-[10px] text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1" id="notifications-drop-list">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-gray-400 text-[11px]">No alerts triggered.</p>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id}
                        id={`notif-drop-item-${n.id}`}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-lg border text-[10px] block cursor-pointer transition ${
                          n.isRead 
                            ? 'bg-white border-gray-100 text-gray-500' 
                            : n.type === 'danger' 
                            ? 'bg-rose-50/60 border-rose-100 text-rose-800 font-semibold' 
                            : 'bg-amber-50/60 border-amber-100 text-amber-805'
                        }`}
                      >
                        <span className="font-extrabold block mb-0.5">{n.title}</span>
                        <p className="font-normal text-gray-600 leading-snug">{n.message}</p>
                        <span className="text-[8px] text-gray-400 font-mono mt-1 block">{formatBSDate(n.date)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Active user indicator */}
          <div className="flex items-center gap-2 border-l border-gray-200 pl-3 text-xs" id="quick-user-pill">
            <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center">
              {currentUserRole.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-bold text-gray-800 block line-clamp-1">Aseem Shaha</span>
              <span className="text-[10px] text-blue-600 block leading-none font-semibold mt-0.5">{currentUserRole} Access</span>
            </div>
          </div>

        </div>
      </header>

      {/* MID CONTAINER SHIFT */}
      <div className="flex-1 flex overflow-hidden relative" id="shell-mid-section">

        {/* SIDE BAR LAYOUT FOR DESKTOPS */}
        <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-gray-150 p-4 shrink-0 transition" id="desktop-sidebar">
          <div className="space-y-6" id="sidebar-top">
            
            <div className="space-y-1.5" id="nav-group-title">
              <span className="text-[9px] font-bold text-gray-450 uppercase tracking-widest block px-2.5">Corporate Operations Desk</span>
              <div className="space-y-1" id="sidebar-tabs-list">
                {allowedTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      id={`sidebar-link-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-left transition ${
                        activeTab === tab.id 
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/10' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Helper keys */}
            <div className="bg-gray-50/60 p-3 rounded-lg border text-[10px] text-gray-400 font-mono space-y-1" id="shortcut-helper-keys">
              <span className="text-gray-500 font-bold block pb-1 border-b">POS Terminal Keys:</span>
              <div>• Press <kbd className="bg-white px-1 border rounded shadow-xxs">F2</kbd> for quick billing</div>
              <div>• Press <kbd className="bg-white px-1 border rounded shadow-xxs">/</kbd> for command box</div>
            </div>
          </div>

          {/* Sidebar current credentials footer */}
          <div className="border-t border-gray-100 pt-4" id="sidebar-bottom">
            <div className="flex items-center gap-3 text-xs" id="sidebar-footer-credentials">
              <div className="h-8 w-8 bg-gray-50 border rounded-lg flex items-center justify-center text-gray-500">
                <Terminal className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="font-extrabold text-gray-900 block leading-none">BS Calendar:</span>
                <span className="text-[10px] text-emerald-600 block mt-1 font-semibold">{formatBSDate(getTodayBS()).split(',')[0]}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MOBILE DRAWER WINDOW OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-black/40 backdrop-blur-xs" id="mobile-menu-drawer-wrapper">
            <div className="bg-white w-64 h-full p-4 flex flex-col justify-between" id="mobile-menu-drawer">
              <div className="space-y-5" id="mobile-drawer-top">
                <div className="flex justify-between items-center" id="mobile-drawer-header">
                  <span className="font-bold text-xs uppercase text-gray-400">Main Drawer Menu</span>
                  <button 
                    id="btn-close-mobile-menu"
                    onClick={() => setMobileMenuOpen(false)} 
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="space-y-1.5" id="mobile-drawer-tabs-list">
                  {allowedTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        id={`mobile-link-${tab.id}`}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left transition ${
                          activeTab === tab.id 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4" id="mobile-drawer-bottom">
                <span className="text-[10px] text-gray-400 block pb-1">Logged operator context:</span>
                <span className="text-xs font-extrabold text-blue-700 block">{currentUserRole} Portal Desk</span>
              </div>
            </div>
          </div>
        )}

        {/* MAIN ROUTE CONTENT COMPONENT SCROLLER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" id="route-main-scroller">
          
          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            key={activeTab}
            className="w-full"
            id={`main-route-wrapper-${activeTab}`}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                setActiveTab={setActiveTab} 
                openQuickBill={() => setActiveTab('billing')} 
              />
            )}
            {activeTab === 'billing' && <Billing />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'contacts' && <CustomerContacts />}
            {activeTab === 'expenses' && <Expenses />}
            {activeTab === 'accounting' && <Bookkeeping />}
            {activeTab === 'settings' && <Settings />}
          </motion.div>

        </main>

      </div>

      {/* BOTTOM FLOATING COMMAND SPOTLIGHT POPUP */}
      <CommandPalette 
        isOpen={paletteOpen} 
        onClose={() => setPaletteOpen(false)} 
        setActiveTab={setActiveTab} 
      />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <SajiloAppContent />
    </AppProvider>
  );
}
