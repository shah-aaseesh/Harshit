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
  Settings as SettingsIcon, Bell, Search, Menu, X, Terminal, LogOut
} from 'lucide-react';
import { Login } from './components/Login';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { formatBSDate, getTodayBS } from './utils/nepaliCalendar';

// Inner App with context bound
const SajiloAppContent: React.FC = () => {
  const { 
    businessConfig, notifications, markNotificationRead, 
    currentUserRole, toggleRole, activeBusinessId, switchBusinessProfile,
    hasSecondBusiness, enableSecondBusiness,
    session, user, loadingAuth, signOut, isSupabaseConfigured
  } = useApp();

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/70">
        <div className="text-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-xs text-gray-500 font-bold tracking-wide uppercase">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return <Login />;
  }

  const getProfileName = (id: 'b1' | 'b2') => {
    try {
      const key = id === 'b1' ? 'sb_business_config' : 'sb_business_config_b2';
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored).name || (id === 'b1' ? 'Primary Business' : 'Secondary Business');
      }
    } catch (e) {
      console.error(e);
    }
    return id === 'b1' ? 'Primary Business' : 'Secondary Business';
  };

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [showAddBusinessModal, setShowAddBusinessModal] = useState<boolean>(false);
  const [newBusinessName, setNewBusinessName] = useState<string>('');

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

  // Storage full warning listener
  useEffect(() => {
    const handleStorageFull = () => {
      toast.error('Local storage is full! Go to Settings and backup your data to Supabase to free up space.', {
        duration: 8000,
      });
    };
    window.addEventListener('sajilobiz:storage-full', handleStorageFull);
    return () => window.removeEventListener('sajilobiz:storage-full', handleStorageFull);
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
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row md:h-screen md:overflow-hidden font-sans selection:bg-blue-600 selection:text-white" id="sajilobiz-app-shell">
      
      {/* SIDE BAR LAYOUT FOR DESKTOPS - Beautiful floating glass dock */}
      <aside className="hidden md:flex flex-col justify-between w-64 sidebar-glass m-3 mr-0 rounded-2xl p-5 shrink-0 shadow-lg shadow-gray-200/40 max-h-[calc(100vh-24px)]" id="desktop-sidebar">
        <div className="space-y-6 overflow-y-auto flex-1 pr-1 min-h-0" id="sidebar-top">
          
          {/* Brand Panel inside Sidebar */}
          <div className="flex items-center gap-3 border-b border-gray-150/50 pb-4" id="brand-logo-panel">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20 overflow-hidden shrink-0 font-display" id="brand-icon">
              S
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase font-display truncate">
                SajiloBiz
              </h1>
              <span className="text-[9px] text-gray-400 font-sans font-semibold block mt-1" id="nepali-brand-caption">SaaS Operating Desk</span>
            </div>
          </div>

          {/* Business Profile Quick Switcher */}
          <div className="bg-gray-50/70 p-1 rounded-xl border border-gray-150/50 flex gap-1 shadow-3xs shrink-0" id="profile-quick-switcher">
            <button
              onClick={() => switchBusinessProfile('b1')}
              className={`flex-1 py-1.5 px-1 rounded-lg text-[9px] font-bold transition duration-150 text-center truncate ${
                activeBusinessId === 'b1'
                  ? 'bg-white text-blue-600 shadow-xs font-extrabold ring-1 ring-black/[0.04]'
                  : 'text-gray-450 hover:text-gray-950 hover:bg-white/40'
              }`}
              title={getProfileName('b1')}
            >
              💼 {getProfileName('b1')}
            </button>
            {hasSecondBusiness ? (
              <button
                onClick={() => switchBusinessProfile('b2')}
                className={`flex-1 py-1.5 px-1 rounded-lg text-[9px] font-bold transition duration-150 text-center truncate ${
                  activeBusinessId === 'b2'
                    ? 'bg-white text-blue-600 shadow-xs font-extrabold ring-1 ring-black/[0.04]'
                    : 'text-gray-450 hover:text-gray-955 hover:bg-white/40'
                }`}
                title={getProfileName('b2')}
              >
                🏭 {getProfileName('b2')}
              </button>
            ) : (
              <button
                onClick={() => setShowAddBusinessModal(true)}
                className="flex-1 py-1.5 px-1 rounded-lg text-[9px] font-bold transition duration-150 text-center truncate text-blue-600 hover:bg-blue-50/60 cursor-pointer"
                title="Add second business profile"
              >
                ➕ Add 2nd
              </button>
            )}
          </div>

          <div className="space-y-2" id="nav-group-title">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block px-2.5 font-display">Corporate Operations</span>
            <div className="space-y-1" id="sidebar-tabs-list">
              {allowedTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    id={`sidebar-link-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs text-left transition duration-150 active:scale-[0.98] ${
                      activeTab === tab.id 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                        : 'text-gray-550 hover:bg-gray-100/50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="tracking-tight">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Helper keys */}
          <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-150/40 text-[10px] text-gray-405 font-mono space-y-1.5" id="shortcut-helper-keys">
            <span className="text-gray-600 font-bold block pb-1 border-b border-gray-150/45">POS Terminal Keys:</span>
            <div className="flex justify-between items-center">
              <span>Quick Billing</span>
              <kbd className="bg-white px-1.5 py-0.5 border border-gray-200 rounded text-gray-700 shadow-2xs font-extrabold text-[9px]">F2</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Command Palette</span>
              <kbd className="bg-white px-1.5 py-0.5 border border-gray-200 rounded text-gray-700 shadow-2xs font-extrabold text-[9px]">/</kbd>
            </div>
          </div>
        </div>

        {/* Sidebar current credentials footer */}
        <div className="border-t border-gray-150/50 pt-4 space-y-3" id="sidebar-bottom">
          <div className="flex items-center justify-between text-xs" id="sidebar-footer-credentials">
            <div className="flex items-center gap-3">
              <div className="h-8.5 w-8.5 bg-gray-50 border border-gray-150/50 rounded-xl flex items-center justify-center text-gray-500 shadow-2xs">
                <Terminal className="h-4 w-4" />
              </div>
              <div>
                <span className="font-extrabold text-gray-800 block leading-none font-display">BS Calendar:</span>
                <span className="text-[10px] text-emerald-600 block mt-1 font-bold">{formatBSDate(getTodayBS()).split(',')[0]}</span>
              </div>
            </div>
            {isSupabaseConfigured && session && (
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition border border-transparent hover:border-rose-100 cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT WORKSPACE WORKBENCH AREA */}
      <div className="flex-1 flex flex-col md:overflow-hidden p-3 min-h-0" id="workspace-workbench">
        
        {/* GLOBAL TOP NAV BAR - Nested inside the right workbench */}
        <header className="glass-panel rounded-2xl px-4 py-2.5 flex justify-between items-center shadow-xs shrink-0 mb-3" id="global-header-bar">
          
          {/* Mobile Header Toggle burger & Title */}
          <div className="flex items-center gap-3" id="global-header-left">
            <button
              id="btn-mobile-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo brand for mobile only, and workspace name on desktop */}
            <div className="flex items-center gap-2.5 md:hidden" id="brand-logo-panel-mobile">
              <div className="h-8.5 w-8.5 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20 overflow-hidden font-display" id="brand-icon-mobile">
                S
              </div>
              <div>
                <h1 className="text-xs font-black text-gray-900 tracking-tight leading-none uppercase font-display">
                  SajiloBiz
                </h1>
                <span className="text-[8px] text-gray-400 font-sans font-medium block mt-0.5" id="nepali-brand-caption">SaaS Portal</span>
              </div>
            </div>

            {/* Breadcrumb Workspace Slug for Desktops */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-400" id="desktop-breadcrumbs">
              <span className="hover:text-gray-600 transition cursor-pointer font-display">SajiloBiz System</span>
              <span className="text-gray-300">/</span>
              <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md capitalize font-display">{activeTab === 'contacts' ? 'Ledgers' : activeTab === 'accounting' ? 'Bookkeeping' : activeTab}</span>
            </div>
          </div>

          {/* Universal controls: search, notification, profile */}
          <div className="flex items-center gap-3" id="global-header-right">
            
            {/* Mock Spotlight Search button */}
            <button
              id="btn-trigger-search-palette"
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-gray-50 border border-gray-150 hover:border-gray-300 hover:bg-gray-100/50 rounded-lg text-xs text-gray-400 transition cursor-pointer select-none active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium text-[11px]">Search or command...</span>
              </div>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono text-gray-450 bg-white border border-gray-150 rounded shadow-2xs leading-none">
                /
              </kbd>
            </button>

            {/* Notifications Alerts bell */}
            <div className="relative" id="notifications-bell-container">
              <button
                id="btn-toggle-notifications-dropdown"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-450 hover:text-gray-700 transition"
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
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3.5 space-y-3 animate-fade-in" id="notifications-popover">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="font-bold text-xs text-gray-900 font-display">Sajilo Notifications ({unreadNotifCount})</span>
                    <button 
                      id="btn-close-notif-dropdown"
                      onClick={() => setShowNotifications(false)} 
                      className="text-[10px] text-gray-450 hover:text-gray-600 font-medium"
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
                              ? 'bg-white border-gray-100 text-gray-550' 
                              : n.type === 'danger' 
                              ? 'bg-rose-50/60 border-rose-100 text-rose-800 font-semibold' 
                              : 'bg-amber-50/60 border-amber-100 text-amber-805'
                          }`}
                        >
                          <span className="font-extrabold block mb-0.5 font-display">{n.title}</span>
                          <p className="font-normal text-gray-600 leading-snug">{n.message}</p>
                          <span className="text-[8px] text-gray-405 font-mono mt-1 block">{formatBSDate(n.date)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Business Profile Pulsing Badge */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 bg-blue-50/60 border border-blue-100 text-blue-700 rounded-xl font-bold text-[10px] shadow-3xs uppercase tracking-wider" id="header-profile-badge">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
              </span>
              <span className="max-w-[140px] truncate leading-none font-display">{businessConfig.name}</span>
            </div>

            {/* Quick Active user indicator */}
            <div className="flex items-center gap-2.5 border-l border-gray-200 pl-3.5 text-xs" id="quick-user-pill">
              <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center border border-blue-100 shadow-2xs">
                {user?.email ? user.email.charAt(0).toUpperCase() : currentUserRole.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <span className="font-extrabold text-gray-800 block line-clamp-1 font-display">
                  {user?.email ? user.email.split('@')[0] : 'Operator'}
                </span>
              </div>
            </div>

          </div>
        </header>

        {/* ACTIVE SCROLLING ROUTE CONTAINER */}
        <main className="flex-1 md:overflow-y-auto overflow-y-visible glass-panel rounded-2xl p-4 sm:p-5 md:p-6 min-h-0" id="route-main-scroller">
          
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            key={activeTab}
            className="w-full min-h-full flex flex-col"
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

      {/* MOBILE DRAWER WINDOW OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/40 backdrop-blur-xs" id="mobile-menu-drawer-wrapper">
          <div className="bg-white w-64 h-full p-4 flex flex-col justify-between shadow-2xl animate-fade-in" id="mobile-menu-drawer">
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

              {/* Mobile Business Profile Switcher */}
              <div className="bg-gray-100/80 p-1 rounded-xl border border-gray-150 flex gap-1" id="mobile-profile-quick-switcher">
                <button
                  onClick={() => switchBusinessProfile('b1')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition duration-150 text-center truncate ${
                    activeBusinessId === 'b1'
                      ? 'bg-white text-blue-600 shadow-xs ring-1 ring-black/[0.02]'
                      : 'text-gray-450 hover:text-gray-900'
                  }`}
                >
                  💼 {getProfileName('b1')}
                </button>
                {hasSecondBusiness ? (
                  <button
                    onClick={() => switchBusinessProfile('b2')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition duration-150 text-center truncate ${
                      activeBusinessId === 'b2'
                        ? 'bg-white text-blue-600 shadow-xs ring-1 ring-black/[0.02]'
                        : 'text-gray-450 hover:text-gray-900'
                    }`}
                  >
                    🏭 {getProfileName('b2')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowAddBusinessModal(true);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition duration-150 text-center truncate text-blue-600 hover:bg-white"
                  >
                    ➕ Add Profile
                  </button>
                )}
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
                          ? 'bg-blue-600 text-white font-bold' 
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

            <div className="border-t pt-4 flex items-center justify-between" id="mobile-drawer-bottom">
              <div>
                <span className="text-[10px] text-gray-400 block pb-1">Logged operator context:</span>
                <span className="text-xs font-extrabold text-blue-700 block">{currentUserRole} Portal Desk</span>
              </div>
              {isSupabaseConfigured && session && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 font-bold text-[10px] rounded-lg transition active:scale-[0.98]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM FLOATING COMMAND SPOTLIGHT POPUP */}
      <CommandPalette 
        isOpen={paletteOpen} 
        onClose={() => setPaletteOpen(false)} 
        setActiveTab={setActiveTab} 
      />

      {/* ADD SECONDARY BUSINESS PROFILE MODAL */}
      {showAddBusinessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-add-second-business">
          <div className="bg-white rounded-2xl border border-gray-150 p-6 max-w-sm w-full space-y-4 shadow-xl animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">Add Second Business Profile</h3>
                <p className="text-[10px] text-gray-400">Initialize a secondary ledger and inventory context</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddBusinessModal(false);
                  setNewBusinessName('');
                }}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-gray-600 text-[10px] block font-bold">Business Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Nepal Stationery & Prints"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-[10px] text-blue-750 space-y-1">
                <span className="font-bold block">💡 Multi-Ledger Support Enabled</span>
                <span>You will be able to manage separate billing, inventory, suppliers, clients, journal entries, and reporting for this entity.</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddBusinessModal(false);
                  setNewBusinessName('');
                }}
                className="flex-1 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold rounded-lg text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newBusinessName.trim()) {
                    toast.error('Please enter a valid business name.');
                    return;
                  }
                  enableSecondBusiness(newBusinessName);
                  setShowAddBusinessModal(false);
                  setNewBusinessName('');
                  toast.success('Secondary business profile created! Toggle profiles via the sidebar or Settings page.');
                }}
                className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-xs shadow-md shadow-blue-500/10 transition"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}

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
