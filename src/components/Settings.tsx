import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings as SettingsIcon, Save, Store, Upload, XCircle
} from 'lucide-react';
import { toast } from 'sonner';

const getProfileName = (id: 'b1' | 'b2'): string => {
  try {
    const key = id === 'b1' ? 'sb_business_config' : 'sb_business_config_b2';
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored).name || (id === 'b1' ? 'Primary Business' : 'Secondary Business');
    }
  } catch (e) {}
  return id === 'b1' ? 'Primary Business' : 'Secondary Business';
};

export const Settings: React.FC = () => {
  const { 
    businessConfig, setBusinessConfig, hasSecondBusiness, enableSecondBusiness, activeBusinessId, switchBusinessProfile
  } = useApp();

  const [secName, setSecName] = useState('');

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
  const [logo, setLogo] = useState<string>(businessConfig.logo || '');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);

  const handleFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size exceeds 2MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setLogo(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

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
        currencySymbol: "Rs.",
        logo: logo || undefined
      });
      setSaving(false);
      toast.success('Business settings and invoice templates saved successfully!');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="settings-module-container">
      
      {/* Page header */}
      <div className="border-b border-gray-100 pb-4" id="settings-header">
        <h1 className="text-xl font-semibold text-gray-950 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-blue-500" /> Sajilo Configuration Panel
        </h1>
        <p className="text-xs text-gray-400 font-sans">Configure corporate profile details, standard tax indices, and corporate brand logo settings</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-xxs" id="business-config-panel">
        <span className="text-[10px] font-bold text-gray-405 uppercase tracking-wider block mb-4 flex items-center gap-1">
          <Store className="h-3.5 w-3.5 text-blue-500" /> Corporate Profile Configuration &amp; Invoice Print Settings
        </span>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs" id="business-profile-form">
            {/* Logo Upload Section */}
            <div className="space-y-1.5 border-b border-gray-100 pb-4" id="logo-upload-section">
              <label className="text-gray-600 block font-semibold">Corporate Brand Logo (व्यापारिक लोगो)</label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Preview Box */}
                <div className="relative h-20 w-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner" id="logo-preview-box">
                  {logo ? (
                    <img 
                      src={logo} 
                      alt="Uploaded Business Logo" 
                      className="h-full w-full object-contain p-1" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-black text-2xl shadow-inner">
                      S
                    </div>
                  )}
                </div>

                {/* Drag and Drop Zone */}
                <div 
                  className={`flex-1 w-full border-2 border-dashed rounded-xl p-4 transition text-center cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : logo 
                        ? 'border-gray-200 bg-gray-50/30 hover:bg-gray-50/60' 
                        : 'border-gray-300 hover:border-blue-400 bg-white hover:bg-gray-50/40'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('logo-file-input')?.click()}
                >
                  <input 
                    type="file"
                    id="logo-file-input"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-750 font-bold text-xs">
                    {logo ? 'Replace Logo Image' : 'Select Logo Image'}
                  </span>
                  <span className="text-[10px] text-gray-400 leading-none">
                    Drag &amp; drop or click to browse. Max 2MB image.
                  </span>
                </div>

                {/* Remove button if logo exists */}
                {logo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogo('');
                    }}
                    className="py-2 px-3 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-bold border border-rose-100 rounded-lg text-xs transition duration-200 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Remove Logo
                  </button>
                )}
              </div>
            </div>

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

      <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-xxs space-y-4 animate-fade-in" id="multiple-businesses-panel">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Store className="h-4 w-4 text-blue-500" /> Multiple Business Profiles
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Manage separate business entities, ledgers, inventory, and invoices within the same workspace.</p>
        </div>

        <div className="space-y-3 text-xs" id="profile-management-body">
          {/* Business 1 */}
          <div className="p-3 border border-gray-150 rounded-xl bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                1
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{getProfileName('b1')}</h4>
                <p className="text-[10px] text-gray-400">Primary Business Profile</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeBusinessId === 'b1' ? (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-extrabold rounded-md uppercase tracking-wider">Active</span>
              ) : (
                <button
                  type="button"
                  onClick={() => switchBusinessProfile('b1')}
                  className="px-2.5 py-1 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 text-[10px] font-bold rounded-lg transition"
                >
                  Switch Profile
                </button>
              )}
            </div>
          </div>

          {/* Business 2 */}
          {hasSecondBusiness ? (
            <div className="p-3 border border-gray-150 rounded-xl bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{getProfileName('b2')}</h4>
                  <p className="text-[10px] text-gray-400">Secondary Business Profile</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeBusinessId === 'b2' ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-extrabold rounded-md uppercase tracking-wider">Active</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchBusinessProfile('b2')}
                    className="px-2.5 py-1 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 text-[10px] font-bold rounded-lg transition"
                  >
                    Switch Profile
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/30 text-center space-y-3">
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="font-bold text-gray-800 text-xs">Add a Second Business Profile</h4>
                <p className="text-[10px] text-gray-400">Perfect for managing a separate branch, secondary brand, or independent trading account without having to log out.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  placeholder="Enter Secondary Business Name..."
                  value={secName}
                  onChange={(e) => setSecName(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!secName.trim()) {
                      toast.error('Please provide a name for the second business.');
                      return;
                    }
                    enableSecondBusiness(secName);
                    setSecName('');
                    toast.success('Second business profile activated! Switch profiles via the sidebar anytime.');
                  }}
                  className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 text-xs transition duration-150 whitespace-nowrap cursor-pointer"
                >
                  ➕ Activate Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
