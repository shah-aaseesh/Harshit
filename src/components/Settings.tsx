import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings as SettingsIcon, ShieldAlert, Sliders, Database, Save, 
  RefreshCw, Info, Store, FileText, UserCheck, AlertCircle,
  Cloud, Download, Upload, CheckCircle, XCircle
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    businessConfig, setBusinessConfig, currentUserRole, setCurrentUserRole, 
    resetToDefault,
    isSupabaseConfigured, isAutoSyncEnabled, setIsAutoSyncEnabled,
    supabaseStatus, checkSupabaseConnection, backupToSupabase,
    restoreFromSupabase, lastSyncedAt, isSyncing
  } = useApp();

  const handleBackupManual = async () => {
    const res = await backupToSupabase();
    alert(res.message + (res.error ? '\n\nError details: ' + res.error : ''));
  };

  const handleRestoreManual = async () => {
    if (confirm("⚠️ WARNING: Syncing down from your cloud backup will completely overwrite your current browser data. Are you sure you wish to pull data from Supabase?")) {
      const res = await restoreFromSupabase();
      alert(res.message + (res.error ? '\n\nError details: ' + res.error : ''));
    }
  };

  // Profile forms
  const [name, setName] = useState<string>(businessConfig.name);
  const [nepaliName, setNepaliName] = useState<string>(businessConfig.nepaliName || '');
  const [address, setAddress] = useState<string>(businessConfig.address);
  const [phone, setPhone] = useState<string>(businessConfig.phone);
  const [panVat, setPanVat] = useState<string>(businessConfig.panVat || '');
  const [isVat, setIsVat] = useState<boolean>(businessConfig.isVatRegistered);
  const [vatRate, setVatRate] = useState<number>(businessConfig.vatRate);
  const [slogan, setSlogan] = useState<string>(businessConfig.slogan || '');
  const [headerN, setHeaderN] = useState<string>(businessConfig.invoiceHeaderNotes || '');
  const [footerN, setFooterN] = useState<string>(businessConfig.invoiceFooterNotes || '');

  const [saving, setSaving] = useState<boolean>(false);


  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      setBusinessConfig({
        name,
        nepaliName: nepaliName || undefined,
        address,
        phone,
        panVat: panVat || undefined,
        isVatRegistered: isVat,
        vatRate,
        slogan: slogan || undefined,
        invoiceHeaderNotes: headerN || undefined,
        invoiceFooterNotes: footerN || undefined,
        currencySymbol: "Rs."
      });
      setSaving(false);
      alert("Business Settings and invoice print templates updated successfully!");
    }, 400); // quick fake delay for sleek feeling
  };

  const handleHardReset = () => {
    if (confirm("🚨 WARNING: This will permanently wipe all local billing transactions, audited stock history, custom client lists, and restore the default state. Continue?")) {
      resetToDefault();
      window.location.reload(); // refresh to load standard seeds cleanly
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="settings-module-container">
      
      {/* Page header */}
      <div className="border-b border-gray-100 pb-4" id="settings-header">
        <h1 className="text-xl font-semibold text-gray-950 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-blue-500" /> Sajilo Configuration Panel
        </h1>
        <p className="text-xs text-gray-400">Configure corporate tax indices, toggle mockup staff accounts permissions, and manage sandbox resets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="settings-layout-grid">
        
        {/* COLUMN LEFT: ROLES & DEMO PLAYGROUND */}
        <div className="space-y-4 md:col-span-1" id="roles-playground-panel">
          
          {/* Mock Accounts */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xxs space-y-3" id="role-selection-card">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-blue-500" /> Account Permission Swapper
            </span>
            <p className="text-xs text-gray-500 leading-snug">
              Swap user roles instantly to test custom permissions! SajiloBiz locks specific actions depending on who is logged in:
            </p>

            <div className="space-y-2 pt-1" id="roles-radio-group">
              {(['Owner', 'Manager', 'Staff'] as const).map((role) => (
                <label 
                  key={role}
                  id={`label-role-${role}`}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    currentUserRole === role 
                      ? 'bg-blue-50/40 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    id={`radio-role-${role}`}
                    name="currentUserRole"
                    value={role}
                    checked={currentUserRole === role}
                    onChange={() => setCurrentUserRole(role)}
                    className="sr-only"
                  />
                  <div>
                    <span className="block">{role} Desk</span>
                    <span className="text-[9px] text-gray-400 font-normal block leading-none mt-0.5">
                      {role === 'Owner' && 'Unrestricted access (Clear stock, void journals, full balance sheet)'}
                      {role === 'Manager' && 'Product creation, checking POS, settling client dues limit'}
                      {role === 'Staff' && 'Strict billing & checkouts only (Reports/bookkeeping hidden)'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Supabase Cloud Secure Backup & Sync */}
          <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4 text-xs" id="supabase-sync-card">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block flex items-center gap-1.5">
              <Cloud className="h-4 w-4 text-blue-500" /> Supabase Secure Sync
            </span>
            
            {/* Connection state banner */}
            {!isSupabaseConfigured ? (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-[11px] text-amber-800 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Cloud Database Not Switched On
                </div>
                <p className="leading-normal">
                  Connect your custom Supabase project! Please assign database properties in your environment settings:
                </p>
                <div className="font-mono text-[9px] bg-white p-1.5 rounded border border-amber-100 mt-1 select-all break-all text-xs">
                  VITE_SUPABASE_URL<br/>
                  VITE_SUPABASE_ANON_KEY
                </div>
              </div>
            ) : supabaseStatus && !supabaseStatus.success ? (
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 text-[11px] text-rose-800 space-y-1">
                <div className="font-semibold flex items-center gap-1 flex-wrap">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" /> Connection Error
                </div>
                <p className="leading-normal">{supabaseStatus.message}</p>
                <button 
                  type="button"
                  onClick={checkSupabaseConnection}
                  className="mt-1.5 px-2 py-1 bg-white hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold rounded text-[9px] transition"
                >
                  Retry Connection
                </button>
              </div>
            ) : supabaseStatus && !supabaseStatus.tableExists ? (
              <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-[11px] text-amber-850 space-y-2">
                <div className="font-semibold flex items-center gap-1">
                  <Database className="h-3.5 w-3.5 text-amber-600" /> State Table Missing
                </div>
                <p className="leading-relaxed text-gray-500">
                  Connected to raw Supabase! However, the table <code className="bg-white px-1 py-0.5 rounded font-mono border text-[10px]">app_state</code> is missing. Execute this raw query inside your Supabase SQL Editor:
                </p>
                <pre className="text-[9px] bg-white p-2 rounded border border-amber-205 overflow-x-auto font-mono select-all text-gray-600 leading-normal text-xs whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`}
                </pre>
                <button 
                  type="button"
                  onClick={checkSupabaseConnection}
                  className="w-full py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-700 font-bold rounded transition text-center text-[10px]"
                >
                  Verify Table Existence
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-[11px] text-emerald-800 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Fully Connected to Cloud Db!
                </div>
                <p className="leading-normal text-xs text-emerald-700">
                  Your business bookkeeping ledger is secured with redundant cloud encryption safely.
                </p>
                <div className="flex items-center justify-between mt-1 text-[9px] text-emerald-600 font-medium pt-1 border-t border-emerald-100">
                  <span>Status: Operational (OK)</span>
                  <button 
                    type="button"
                    onClick={checkSupabaseConnection}
                    className="underline hover:text-emerald-800"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}

            {/* Sync Controls */}
            {isSupabaseConfigured && supabaseStatus && supabaseStatus.success && supabaseStatus.tableExists && (
              <div className="space-y-3 pt-1">
                {/* Auto-sync Toggle */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-semibold text-gray-700 block text-[11px]">Realtime Cloud Sync</span>
                    <span className="text-[9px] text-gray-400 block leading-tight">Back up changes to Supabase instantly</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAutoSyncEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isAutoSyncEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Pull / Push Manual buttons */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleBackupManual}
                    className="py-2 px-2.5 bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-700 font-bold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50 transition"
                  >
                    <Upload className="h-3.5 w-3.5" /> Push State
                  </button>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleRestoreManual}
                    className="py-2 px-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50 transition"
                  >
                    <Download className="h-3.5 w-3.5" /> Pull Sync
                  </button>
                </div>

                {/* Synced banner */}
                {lastSyncedAt && (
                  <div className="text-[10px] text-gray-400 font-medium flex items-center justify-between px-1 pt-1 border-t border-gray-50">
                    <span>Cloud Sync History</span>
                    <span className="font-bold text-gray-500">{lastSyncedAt}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sandbox Controls */}
          <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-xxs space-y-3" id="sandbox-reset-card">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block flex items-center gap-1">
              <Database className="h-3.5 w-3.5 text-rose-500 animate-pulse" /> Emergency Sandbox Systems
            </span>
            <p className="text-xs text-gray-400 leading-snug">
              Clear test cash receipts, inventory changes, added supplier credits and restore the original clean default templates in Kathmandu.
            </p>
            <button
              id="btn-hard-reset-data"
              onClick={handleHardReset}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold border border-rose-100 rounded-lg text-xs transition duration-200 shadow-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Wipe & Restore Seeds
            </button>
          </div>

        </div>

        {/* COLUMN RIGHT: CORPORATE CONFIG FORM */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-150 shadow-xxs" id="business-config-panel">
          <span className="text-[10px] font-bold text-gray-405 uppercase tracking-wider block mb-4 flex items-center gap-1">
            <Store className="h-3.5 w-3.5 text-blue-500" /> Corporate Profile Configuration & Invoice Print Settings
          </span>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs" id="business-profile-form">
            <div className="grid grid-cols-2 gap-3" id="profile-names-grid">
              <div className="space-y-1">
                <label className="text-gray-600 block">Business Registered Name *</label>
                <input
                  type="text"
                  id="input-biz-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 p-2.5 outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Registered Name in Nepali Script *</label>
                <input
                  type="text"
                  id="input-biz-name-np"
                  value={nepaliName}
                  onChange={(e) => setNepaliName(e.target.value)}
                  placeholder="सजिलो ट्रेडर्स काठमाडौं"
                  className="w-full border border-gray-200 rounded-lg p-2 p-2.5 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" id="profile-contacts-grid">
              <div className="space-y-1">
                <label className="text-gray-600 block">Headquarters Address *</label>
                <input
                  type="text"
                  id="input-biz-addr"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 p-2.5 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Customer Hotline Phone *</label>
                <input
                  type="text"
                  id="input-biz-phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 p-2.5 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-gray-50 pt-3" id="tax-registration-grid">
              <div className="space-y-1">
                <label className="text-gray-600 block">PAN / VAT Reg ID *</label>
                <input
                  type="text"
                  id="input-biz-pan-vat"
                  required
                  value={panVat}
                  onChange={(e) => setPanVat(e.target.value)}
                  placeholder="9 digit number code"
                  className="w-full border border-gray-200 rounded-lg p-2 p-2.5 font-mono tracking-widest outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block font-semibold">VAT Taxable Register *</label>
                <select
                  id="select-biz-vat-status"
                  value={isVat ? "yes" : "no"}
                  onChange={(e) => setIsVat(e.target.value === "yes")}
                  className="w-full border border-gray-200 rounded-lg p-2 p-2.5 bg-white outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-700"
                >
                  <option value="yes">VAT Registered (13% Standard)</option>
                  <option value="no">Non-VAT Commercial</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Standard VAT percentage (%)</label>
                <input
                  type="number"
                  id="input-biz-vat-rate"
                  required
                  disabled={!isVat}
                  value={vatRate}
                  onChange={(e) => setVatRate(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg p-2 p-2.5 font-mono outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-1 border-t border-gray-50 pt-3" id="invoice-custom-notes">
              <label className="text-gray-655 block">Invoice Header Slogan tagline</label>
              <input
                type="text"
                id="input-biz-slogan"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Providing best agricultural logistics directly from farms..."
                className="w-full border border-gray-200 rounded-lg p-2 p-2.5 outline-none focus:ring-1 focus:ring-blue-500 italic"
              />
            </div>

            <div className="grid grid-cols-2 gap-3" id="invoice-printout-fineprints-grid">
              <div className="space-y-1">
                <label className="text-gray-600 block">Header Fineprint Term</label>
                <input
                  type="text"
                  id="input-biz-header-notes"
                  value={headerN}
                  onChange={(e) => setHeaderN(e.target.value)}
                  placeholder="Authorized signs required for returns."
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Footer Greeting Caption</label>
                <input
                  type="text"
                  id="input-biz-footer-notes"
                  value={footerN}
                  onChange={(e) => setFooterN(e.target.value)}
                  placeholder="Thank you for doing business with us! धन्यवाद।"
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-confirm-save-settings"
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-98 transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving System Changes...' : 'Commit Settings Config'}
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
