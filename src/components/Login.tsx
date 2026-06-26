import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.warning('Please fill in both email and password fields.');
      return;
    }

    setLoading(true);
    try {
      if (!supabase) {
        toast.error('Supabase client is not initialized. Please verify configuration.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Incorrect email or password. Please verify credentials.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Access granted. Initializing system desk...');
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/70 p-4 font-sans select-none relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background abstract ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-200/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-gray-150/70 shadow-xl relative z-10 animate-slide-up">
        {/* Brand/App Identity */}
        <div className="text-center space-y-3 mb-8">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-display text-lg font-black">
            S
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight uppercase font-display">
              SajiloBiz
            </h1>
            <p className="text-xs text-gray-400 font-medium">Nepal Corporate Administration Operating Desk</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-gray-600 text-[10px] block font-bold uppercase tracking-wider">
              Operator Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                placeholder="operator@sajilobiz.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-white/70 border border-gray-200 focus:border-blue-500 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 font-bold transition disabled:opacity-50 text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-gray-600 text-[10px] block font-bold uppercase tracking-wider">
                Security Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.5 bg-white/70 border border-gray-200 focus:border-blue-500 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 font-bold transition disabled:opacity-50 text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-xs shadow-md shadow-blue-500/10 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <>
                <span>Access System Desk</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Badge */}
        <div className="mt-8 border-t border-gray-150/40 pt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-mono">
          <Terminal className="h-3.5 w-3.5" />
          <span>Secured with Supabase Encryption</span>
        </div>
      </div>
    </div>
  );
};
