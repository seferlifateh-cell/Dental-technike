/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole, UserProfile, CurrencyRate } from '../types';
import { Stethoscope, Wrench, ArrowRight, DollarSign, Activity, Sparkles } from 'lucide-react';
import { isFirebaseConfigured, signInWithGoogle } from '../firebase';

interface LoginScreenProps {
  onLogin: (profile: UserProfile, rates: CurrencyRate, firebaseUser?: any) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [role, setRole] = useState<UserRole>('dentist');
  const [name, setName] = useState('');
  const [clinicOrLab, setClinicOrLab] = useState('');
  const [email, setEmail] = useState('');
  
  // Editable exchange rates
  const [usdToAzn, setUsdToAzn] = useState('1.70');
  const [eurToAzn, setEurToAzn] = useState('1.85');

  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      const user = await signInWithGoogle();
      if (user) {
        const userProfile: UserProfile = {
          name: user.displayName || name.trim() || (role === 'dentist' ? 'Dr. Rəşad Məmmədov' : 'Kənan Usta'),
          role,
          clinicOrLab: clinicOrLab.trim() || (role === 'dentist' ? 'DentEstetik Klinikası' : 'Elite Protez Laboratoriyası'),
          email: user.email || 'user@dentsuite.com'
        };

        const rates: CurrencyRate = {
          usdToAzn: parseFloat(usdToAzn) || 1.70,
          eurToAzn: parseFloat(eurToAzn) || 1.85,
          lastUpdated: new Date().toISOString().split('T')[0]
        };

        onLogin(userProfile, rates, user);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Google hesabı ilə əlaqə qurulmadı. Zəhmət olmasa təkrarlayın.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userProfile: UserProfile = {
      name: name.trim() || (role === 'dentist' ? 'Dr. Rəşad Məmmədov' : 'Kənan Usta'),
      role,
      clinicOrLab: clinicOrLab.trim() || (role === 'dentist' ? 'DentEstetik Klinikası' : 'Elite Protez Laboratoriyası'),
      email: email.trim() || (role === 'dentist' ? 'dr.resad@dentsuite.az' : 'kenan.lab@dentsuite.az')
    };

    const rates: CurrencyRate = {
      usdToAzn: parseFloat(usdToAzn) || 1.70,
      eurToAzn: parseFloat(eurToAzn) || 1.85,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    onLogin(userProfile, rates);
  };

  return (
    <div id="login-screen-container" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Main card */}
      <div id="login-panel" className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-950/40 border border-teal-800/40 text-teal-400 rounded-full text-xs font-mono mb-4">
            <Activity size={12} className="animate-pulse" />
            MASAÜSTÜ PORTAL KONSEPTİ • DESKTOP SUITE v1.2
          </div>
          <h1 className="text-3xl font-sans tracking-tight font-bold text-slate-100 mb-2">
            DentSuite Portalı
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Diş həkimləri və diş texnikləri üçün tam fərdiləşdirilmiş maliyyə rəqəmsallaşdırılması və iş prosesi idarəetmə sistemi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: Choose Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              1. Sahənizi seçin (Sistem buna əsasən tam uyğunlaşacaq)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <button
                type="button"
                id="select-dentist-role"
                onClick={() => setRole('dentist')}
                className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 outline-none ${
                  role === 'dentist'
                    ? 'bg-teal-950/30 border-teal-500 text-teal-200 shadow-md shadow-teal-950/30'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className={`p-3 rounded-lg ${role === 'dentist' ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm">Diş Həkimi (Dentist)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Orto-klinika idarəetməsi, pasiyent işləri, xarici texniklər, gəlir/xərc hesabatı.
                  </p>
                </div>
              </button>

              <button
                type="button"
                id="select-technician-role"
                onClick={() => setRole('technician')}
                className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 outline-none ${
                  role === 'technician'
                    ? 'bg-blue-950/30 border-blue-500 text-blue-200 shadow-md shadow-blue-950/30'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className={`p-3 rounded-lg ${role === 'technician' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Wrench size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm">Diş Texniki (Technician)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Laboratoriya daxilolmaları, sifarişçi həkimlər, material xərcləri, vaxtlı təhvil və bildiriş.
                  </p>
                </div>
              </button>

            </div>
          </div>

          <div className="border-t border-slate-800/80 my-4" />

          {/* STEP 2: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Ad Soyad
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'dentist' ? 'Dr. Rəşad Məmmədov' : 'Kənan Usta'}
                className="w-full bg-slate-900/80 border border-slate-800 focus:border-teal-500 text-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {role === 'dentist' ? 'Klinikanın Adı' : 'Laboratoriyanın Adı'}
              </label>
              <input
                type="text"
                required
                value={clinicOrLab}
                onChange={(e) => setClinicOrLab(e.target.value)}
                placeholder={role === 'dentist' ? 'DentEstetik Klinikası' : 'Elite Protez Laboratoriyası'}
                className="w-full bg-slate-900/80 border border-slate-800 focus:border-teal-500 text-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* STEP 3: Currency Rates Configuration */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={16} className="text-amber-500" />
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Valyuta Məzənnələri (Cari Tarif)
              </h4>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded ml-auto">
                Yenilənir
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Azərbaycanda xarici material və protez sifarişləri tez-tez xarici valyutayla hesablanır. Cari məzənnələri fərdi şəkildə dəyişdirə bilərsiniz:
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  1 USD = ? AZN
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={usdToAzn}
                  onChange={(e) => setUsdToAzn(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-teal-500 text-teal-400 text-sm font-mono px-3 py-1.5 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  1 EUR = ? AZN
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={eurToAzn}
                  onChange={(e) => setEurToAzn(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-teal-500 text-teal-400 text-sm font-mono px-3 py-1.5 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

           {/* Firebase auth education & Google platform login */}
          {!isFirebaseConfigured ? (
            <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-slate-400 leading-relaxed font-sans shadow-inner">
              <span className="text-teal-400 font-bold block mb-1">💡 Buludda Saxlanma (Cihazlararası Sinxronizasiya):</span>
              Google hesabı ilə eyni datanı başqa kompüter/telefonlarda da görmək üçün AI Studio panelindən <strong className="text-slate-200">"Set Up Firebase"</strong> edib təsdiqləməlisiniz. Hazırda yerli rejim (LocalStorage) ilə fəaliyyət göstərir.
            </div>
          ) : (
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold tracking-wide rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99]"
              >
                <svg className="w-4 h-4 mr-1 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google Hesabı ilə Sinxronizasiyalı Giriş
              </button>
              
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="h-px bg-slate-800 w-full" />
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono whitespace-nowrap">və ya yerli hesabla daxil olun</span>
                <span className="h-px bg-slate-800 w-full" />
              </div>
            </div>
          )}

          {authError && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/50 rounded-xl text-rose-350 text-xs text-center font-bold font-sans">
              ⚠️ {authError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            id="start-session-button"
            className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-slate-950 font-bold tracking-wide rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all"
          >
            Sistemə Giriş et (Yerli Rejim)
            <ArrowRight size={16} />
          </button>

          <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest mt-2">
            Təhlükəsizlik • Bulud verilənləriniz Firebase Firestore bazasında şifrəli qorunur
          </div>

        </form>

      </div>
    </div>
  );
}
