import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle, Info } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { UserRole } from '../../types';

import { useAuth } from '../../context/AuthContext';

interface LoginScreenProps {
  onLogin?: (role: UserRole) => void;
  onLoginSuccess?: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onLoginSuccess }) => {
  const [email, setEmail] = useState('inspector@inspectmate.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('inspector');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.accessToken, data.refreshToken, data.user);
      
      const handler = onLogin || onLoginSuccess;
      if (handler) {
        handler(data.user.role.toLowerCase() as UserRole);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Glass Card */}
        <GlassCard className="border border-white/90 shadow-2xl p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-indigo-400/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-teal-400/15 blur-2xl pointer-events-none" />

          {/* Logo & Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-teal-500 text-white shadow-lg shadow-indigo-600/25 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <circle cx="11" cy="11" r="3" />
                <path d="m16 16 2.5 2.5" />
                <path d="m10 11 1.5 1.5 3-3" stroke="#2DD4BF" strokeWidth="2" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              InspectMate
            </h1>
            <p className="text-sm font-semibold text-teal-700 mt-1">
              Evidence you can trust.
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              AI-assisted Legal Metrology & Packaged Commodity Inspection
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('inspector');
                setEmail('inspector@inspectmate.com');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                selectedRole === 'inspector'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Field Inspector
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('regulator');
                setEmail('admin@inspectmate.com');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                selectedRole === 'regulator'
                  ? 'bg-white text-teal-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Regulator / Admin
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Government Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium"
                  placeholder="name@regulatory.gov.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Secure Password / Token
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium"
                />
              </div>
            </div>

            <GlassButton
              type="submit"
              size="lg"
              className="w-full mt-2"
              icon={<ArrowRight size={16} />}
            >
              Authenticate & Launch Session
            </GlassButton>
          </form>

          {/* JWT-Auth Security Note */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-[11px] font-medium text-slate-600 border border-slate-200">
              <ShieldCheck size={13} className="text-teal-600" />
              <span>Secured by Ed25519 JWT Cryptographic Signatures</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Role-aware redirect to {selectedRole === 'inspector' ? 'Mobile Inspector Dashboard' : 'Regulator Analytics Portal'}
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
