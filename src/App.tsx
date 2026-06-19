/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, CurrencyRate, Job, Transaction, PaymentStatus } from './types';
import { 
  DEFAULT_CURRENCY_RATES, 
  INITIAL_DENTIST_JOBS, 
  INITIAL_DENTIST_TRANSACTIONS, 
  INITIAL_TECHNICIAN_JOBS, 
  INITIAL_TECHNICIAN_TRANSACTIONS 
} from './mockData';

import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import JobsSection from './components/JobsSection';
import FinanceSection from './components/FinanceSection';
import DbSchemaSection from './components/DbSchemaSection';
import AdviceSection from './components/AdviceSection';

import { 
  isFirebaseConfigured, 
  auth, 
  db, 
  logoutFirebase 
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc 
} from 'firebase/firestore';

import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Layers, 
  DollarSign, 
  Database, 
  Sparkles, 
  LogOut, 
  Volume2, 
  Activity, 
  Square, 
  Minus, 
  X, 
  Bell,
  CheckCircle2,
  Stethoscope,
  Wrench,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Authentication & Settings State
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('dentsuite_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [rates, setRates] = useState<CurrencyRate>(() => {
    const saved = localStorage.getItem('dentsuite_rates');
    return saved ? JSON.parse(saved) : DEFAULT_CURRENCY_RATES;
  });

  // Business Data States
  const [jobs, setJobs] = useState<Job[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // System UI States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'jobs' | 'finance' | 'database' | 'advice'>('dashboard');
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: 'success' | 'warn' | 'info' }[]>([]);

  // Firebase integration states
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Audio system warning chime (sine dual-wave high contrast alert)
  const playOverdueChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Tone 1: High tone
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.4);
      
      // Tone 2: Slightly staggered mid tone
      setTimeout(() => {
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 note
          gain2.gain.setValueAtTime(0, audioCtx.currentTime);
          gain2.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          
          osc2.start(audioCtx.currentTime);
          osc2.stop(audioCtx.currentTime + 0.45);
        } catch (e) {
          console.error("Delayed audio failure:", e);
        }
      }, 140);
    } catch (err) {
      console.warn("AudioContext is blocked or not supported by browser inside this environment:", err);
    }
  };

  // Trigger system notification toasts
  const triggerToast = (msg: string, type: 'success' | 'warn' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Overdue check trigger state to prevent infinite sound looping
  const [lastOverdueCount, setLastOverdueCount] = useState<number>(0);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const overdueCount = jobs.filter(j => {
    if (j.isDelivered || j.status === 'İş hazırdır' || j.status === 'Təhvil verilib') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(j.deadline);
    return deadlineDate < today;
  }).length;

  // Monitor jobs database for overdue deadlines and trigger buzzer alert
  useEffect(() => {
    if (!profile || jobs.length === 0) return;

    if (overdueCount > lastOverdueCount) {
      playOverdueChime();
      triggerToast(`🚨 Diqqət! Təhvil deadline vaxtı keçmiş və icra olunmayan ${overdueCount} ədəd sifarişiniz var!`, 'warn');
    }
    setLastOverdueCount(overdueCount);
  }, [jobs, profile, overdueCount, lastOverdueCount]);

  const jobToDeadline = (j: Job): string => {
    return j.deadline;
  };

  // Firebase auth state observer
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentAuthUser) => {
      if (currentAuthUser) {
        setFirebaseUser(currentAuthUser);
        await syncFromFirestore(currentAuthUser.uid);
      } else {
        setFirebaseUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Upload/Restore state data helper
  const syncFromFirestore = async (uid: string) => {
    if (!db) return;
    setIsSyncing(true);
    try {
      // 1. Fetch profile
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      let loadedProfile: UserProfile | null = null;
      if (userSnap.exists()) {
        loadedProfile = userSnap.data() as UserProfile;
        setProfile(loadedProfile);
        localStorage.setItem('dentsuite_profile', JSON.stringify(loadedProfile));
      }

      // 2. Fetch jobs
      const jobsQuery = query(collection(db, 'jobs'), where('userId', '==', uid));
      const jobsSnap = await getDocs(jobsQuery);
      const loadedJobs: Job[] = [];
      jobsSnap.forEach(d => {
        loadedJobs.push(d.data() as Job);
      });

      // 3. Fetch transactions
      const txQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
      const txSnap = await getDocs(txQuery);
      const loadedTx: Transaction[] = [];
      txSnap.forEach(d => {
        loadedTx.push(d.data() as Transaction);
      });

      // Update state
      if (loadedJobs.length > 0 || loadedTx.length > 0) {
        setJobs(loadedJobs);
        setTransactions(loadedTx);
        if (loadedProfile) {
          localStorage.setItem(`dentsuite_jobs_${loadedProfile.role}`, JSON.stringify(loadedJobs));
          localStorage.setItem(`dentsuite_transactions_${loadedProfile.role}`, JSON.stringify(loadedTx));
        }
        triggerToast("Bulud verilənlər bazası ilə sinxronizasiya tam olundu!", "success");
      } else {
        // First login: upload existing client data to Firestore
        const roleToUse = loadedProfile?.role || profile?.role || 'dentist';
        const initialJobs = jobs.length > 0 ? jobs : (roleToUse === 'dentist' ? INITIAL_DENTIST_JOBS : INITIAL_TECHNICIAN_JOBS);
        const initialTx = transactions.length > 0 ? transactions : (roleToUse === 'dentist' ? INITIAL_DENTIST_TRANSACTIONS : INITIAL_TECHNICIAN_TRANSACTIONS);
        
        await uploadToFirestore(uid, loadedProfile || profile, initialJobs, initialTx);
        setJobs(initialJobs);
        setTransactions(initialTx);
      }
    } catch (err) {
      console.error("Firestore sync error: ", err);
      triggerToast("Bulud ilə əlaqə qurularkən və məlumatlar yoxlanılarkən verilən xətası.", "warn");
    } finally {
      setIsSyncing(false);
    }
  };

  const uploadToFirestore = async (uid: string, currentProfile: UserProfile | null, currentJobs: Job[], currentTx: Transaction[]) => {
    if (!db) return;
    try {
      if (currentProfile) {
        await setDoc(doc(db, 'users', uid), {
          ...currentProfile,
          lastLogin: new Date().toISOString()
        });
      }

      for (const j of currentJobs) {
        await setDoc(doc(db, 'jobs', j.id), {
          ...j,
          userId: uid,
          updatedAt: new Date().toISOString()
        });
      }

      for (const t of currentTx) {
        await setDoc(doc(db, 'transactions', t.id), {
          ...t,
          userId: uid
        });
      }
    } catch (err) {
      console.error("Firestore write batch error: ", err);
    }
  };

  // Synchronize dynamic role dataset on login or reload
  useEffect(() => {
    if (firebaseUser) {
      // If Firebase user is logged in, syncFromFirestore handles this
      return;
    }

    if (!profile) {
      setJobs([]);
      setTransactions([]);
      return;
    }

    const keyJobs = `dentsuite_jobs_${profile.role}`;
    const keyTx = `dentsuite_transactions_${profile.role}`;

    const savedJobs = localStorage.getItem(keyJobs);
    const savedTx = localStorage.getItem(keyTx);

    if (savedJobs && savedTx) {
      setJobs(JSON.parse(savedJobs));
      setTransactions(JSON.parse(savedTx));
    } else {
      // Seeding database based on selected profile role
      const seedJobs = profile.role === 'dentist' ? INITIAL_DENTIST_JOBS : INITIAL_TECHNICIAN_JOBS;
      const seedTx = profile.role === 'dentist' ? INITIAL_DENTIST_TRANSACTIONS : INITIAL_TECHNICIAN_TRANSACTIONS;
      
      setJobs(seedJobs);
      setTransactions(seedTx);

      localStorage.setItem(keyJobs, JSON.stringify(seedJobs));
      localStorage.setItem(keyTx, JSON.stringify(seedTx));

      triggerToast(`Uğurla giriş edildi! ${profile.name} üçün nümunəvi verilənlər bazası loqu yükləndi.`, 'success');
    }
  }, [profile, firebaseUser]);

  // Persist jobs changes
  const saveJobsToLocalStorage = async (updatedJobs: Job[]) => {
    if (!profile) return;
    setJobs(updatedJobs);
    localStorage.setItem(`dentsuite_jobs_${profile.role}`, JSON.stringify(updatedJobs));

    if (firebaseUser && db) {
      try {
        // Bulk upload individual items safely
        for (const j of updatedJobs) {
          await setDoc(doc(db, 'jobs', j.id), {
            ...j,
            userId: firebaseUser.uid,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Firebase sync error: ", err);
      }
    }
  };

  // Persist transactions changes
  const saveTransactionsToLocalStorage = async (updatedTx: Transaction[]) => {
    if (!profile) return;
    setTransactions(updatedTx);
    localStorage.setItem(`dentsuite_transactions_${profile.role}`, JSON.stringify(updatedTx));

    if (firebaseUser && db) {
      try {
        for (const t of updatedTx) {
          await setDoc(doc(db, 'transactions', t.id), {
            ...t,
            userId: firebaseUser.uid
          });
        }
      } catch (err) {
        console.error("Firebase transaction sync error: ", err);
      }
    }
  };

  // USER ACCESS HANDLERS
  const handleLogin = async (userProfile: UserProfile, currencyRates: CurrencyRate, loggedFirebaseUser?: any) => {
    localStorage.setItem('dentsuite_profile', JSON.stringify(userProfile));
    localStorage.setItem('dentsuite_rates', JSON.stringify(currencyRates));
    
    setProfile(userProfile);
    setRates(currencyRates);

    if (loggedFirebaseUser) {
      setFirebaseUser(loggedFirebaseUser);
      // Wait for firestore upload/download trigger
      if (db) {
        await uploadToFirestore(loggedFirebaseUser.uid, userProfile, jobs, transactions);
        await syncFromFirestore(loggedFirebaseUser.uid);
      }
    }

    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    if (window.confirm('Hazırki roldan çıxış etməyə və ya digər rol seçməyə əminsiniz?')) {
      try {
        await logoutFirebase();
      } catch (err) {
        console.error("Firebase logout error:", err);
      }
      localStorage.removeItem('dentsuite_profile');
      setProfile(null);
      setFirebaseUser(null);
    }
  };

  // RATES UPDATE HANDLER
  const handleUpdateRates = (usd: number, eur: number) => {
    const updated: CurrencyRate = {
      usdToAzn: usd,
      eurToAzn: eur,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setRates(updated);
    localStorage.setItem('dentsuite_rates', JSON.stringify(updated));

    // Recalculate AZN values in jobs & transactions based on revised target rates
    const updatedJobs = jobs.map(j => {
      const rate = j.currency === 'AZN' ? 1 : j.currency === 'USD' ? usd : eur;
      return { ...j, amountInAzn: j.totalAmount * rate };
    });
    saveJobsToLocalStorage(updatedJobs);

    const updatedTx = transactions.map(t => {
      const rate = t.currency === 'AZN' ? 1 : t.currency === 'USD' ? usd : eur;
      return { ...t, amountInAzn: t.amount * rate };
    });
    saveTransactionsToLocalStorage(updatedTx);

    triggerToast(`Kross-məzənnələr redaktə olundu. Bütün hesablar yenidən hesablandı (USD: ${usd}, EUR: ${eur})`, 'info');
  };

  // JOBS MODIFICATION FUNCTIONS
  const handleAddJob = (newJob: Job) => {
    const updated = [newJob, ...jobs];
    saveJobsToLocalStorage(updated);
    triggerToast(`"${newJob.patientName}" pasiyenti üçün yeni diş sifarişi uğurla bazaya əlavə edildi.`, 'success');
  };

  const handleUpdateJobStatus = (id: string, nextStatus: string) => {
    const updated = jobs.map(j => {
      if (j.id === id) {
        const isDone = nextStatus === 'İş hazırdır' || nextStatus === 'Təhvil verilib';
        return { ...j, status: nextStatus, isDelivered: isDone };
      }
      return j;
    });
    saveJobsToLocalStorage(updated);
    triggerToast(`Sifariş iş statusu yeniləndi: "${nextStatus}"`, 'info');
  };

  const handleUpdateJobPayment = (id: string, paidAmount: number, paymentStatus: PaymentStatus) => {
    const updated = jobs.map(j => {
      if (j.id === id) {
        return { ...j, paidAmount, paymentStatus };
      }
      return j;
    });
    saveJobsToLocalStorage(updated);
    triggerToast(`Sifariş üzrə ödəniş yeniləndi! Yeni status: ${paymentStatus === 'paid' ? 'Tam ödənilib (+)' : 'Qismən ödənilib (/)'}`, 'success');
  };

  // TRANSACTIONS MODIFICATION FUNCTIONS
  const handleAddTransaction = (
    type: 'income' | 'expense',
    amount: number,
    currency: 'AZN' | 'USD' | 'EUR',
    description: string,
    category: string,
    dateOrJobId?: string
  ) => {
    // Check if the 6th argument is a date (string starting with YYYY-MM) or a jobId string
    const isDate = dateOrJobId && dateOrJobId.match(/^\d{4}-\d{2}-\d{2}$/);
    const dateStr = isDate ? dateOrJobId : new Date().toISOString().split('T')[0];
    const jobId = isDate ? undefined : dateOrJobId;

    const currentRate = currency === 'AZN' ? 1 : currency === 'USD' ? rates.usdToAzn : rates.eurToAzn;
    const amountInAzn = amount * currentRate;

    const newTx: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      date: dateStr,
      type,
      amount,
      currency,
      amountInAzn,
      description,
      category,
      jobId
    };

    const updated = [newTx, ...transactions];
    saveTransactionsToLocalStorage(updated);
    triggerToast(`Yeni ${type === 'income' ? 'gəlir' : 'xərc'} qeydə alındı: +${amount} ${currency}`, 'success');
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    saveTransactionsToLocalStorage(updated);
    triggerToast('Tranzaksiya qeydi uğurla silindi.', 'warn');
  };

  // Render Login state if profile is not established yet
  if (!profile) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 select-none">
      
      {/* Toast systems */}
      <div className="fixed bottom-5 right-5 space-y-2 z-50 max-w-sm w-full">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`p-3.5 rounded-xl border shadow-xl flex items-start gap-2.5 transition-all duration-300 transform translate-y-0 scale-100 ${
              toast.type === 'success' 
                ? 'bg-slate-900 border-emerald-900/60 text-emerald-100' 
                : toast.type === 'warn' 
                  ? 'bg-slate-900 border-rose-900/60 text-rose-100'
                  : 'bg-slate-900 border-teal-900/60 text-teal-100'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-450 mt-0.5 flex-shrink-0" />}
            {toast.type === 'warn' && <AlertCircle size={16} className="text-rose-455 mt-0.5 flex-shrink-0" />}
            {toast.type === 'info' && <Bell size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />}
            <p className="text-xs font-semibold leading-relaxed">{toast.msg}</p>
          </div>
        ))}
      </div>

      {/* DESKTOP APP SHELL HEADER RULER */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between z-20 text-slate-400 text-xs select-none">
        <div id="desktop-window-title" className="flex items-center gap-2.5 font-mono">
          {/* Faux desktop window markers */}
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="w-3 h-3 rounded-full bg-rose-500/20 hover:bg-rose-500 cursor-pointer transition-colors flex items-center justify-center text-[7px] text-rose-950 font-bold">×</span>
            <span className="w-3 h-3 rounded-full bg-amber-500/20 hover:bg-amber-500 cursor-pointer transition-colors flex items-center justify-center text-[7px] text-amber-950 font-bold">-</span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/20 hover:bg-emerald-500 cursor-pointer transition-colors flex items-center justify-center text-[7px] text-emerald-950 font-bold">+</span>
          </div>
          <span className="text-slate-500 text-[10px] font-sans">|</span>
          <span className="font-bold text-slate-300 flex items-center gap-1.5 font-sans">
            <Activity size={13} className="text-teal-400 animate-pulse" />
            DentSuite Desktop Console
          </span>
          <span className="text-slate-600 font-mono text-[9px] bg-slate-950 px-2 py-0.5 rounded border border-slate-850 truncate max-w-[200px]">
            {firebaseUser ? `BULUD SİNXRON: ${firebaseUser.email}` : 'YERLİ REJİM • OFFLINE'}
          </span>
        </div>

        {/* Global metadata system parameters */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 uppercase">
          {overdueCount > 0 && (
            <button
              onClick={playOverdueChime}
              className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold border border-rose-900/50 rounded flex items-center gap-1 cursor-pointer animate-pulse"
              title="Səsi təkrar oxutmaq üçün klikləyin"
            >
              <AlertCircle size={10} className="text-rose-500" />
              <span>! {overdueCount} SİFARİŞ GECİKİR</span>
            </button>
          )}

          {isSyncing && (
            <span className="flex items-center gap-1 text-teal-400 animate-pulse font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              Sinxron...
            </span>
          )}

          <span className="hidden sm:inline">Məzənnə: 1 USD ~ {rates.usdToAzn.toFixed(2)} AZN</span>
          <span className="p-1 px-2.5 bg-slate-950 rounded text-slate-400 font-bold border border-slate-850 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Cari Tarix: {getTodayDateString()}
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER: SIDEBAR + MAIN CONTENT COMPONENT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* DESKTOP SIDEBAR PANEL */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800/85 flex flex-col justify-between p-4 z-10 select-none">
          
          <div className="space-y-6">
            {/* User credentials summary mini-card */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-2 relative">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${profile.role === 'dentist' ? 'bg-teal-500/10 text-teal-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {profile.role === 'dentist' ? <Stethoscope size={18} /> : <Wrench size={18} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 truncate pr-4">{profile.name}</h4>
                  <span className="text-[9px] bg-slate-900 text-slate-450 border border-slate-850 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider block mt-1 w-max">
                    {profile.role === 'dentist' ? 'Diş Həkimi' : 'Diş Texniki'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic truncate border-t border-slate-900 pt-2 block">
                🏢 {profile.clinicOrLab}
              </p>
            </div>

            {/* Navigation links grouped */}
            <nav className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2 block mb-2 font-mono">
                Əsas Menyu
              </span>

              {/* Tab 1: Dashboard */}
              <button
                id="tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeTab === 'dashboard' 
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                }`}
              >
                <LayoutDashboard size={14} />
                İdarəetmə Paneli
              </button>

              {/* Tab 2: Finance Calendar */}
              <button
                id="tab-calendar"
                onClick={() => setActiveTab('calendar')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeTab === 'calendar' 
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                }`}
              >
                <CalendarIcon size={14} />
                Təqvimli Maliyyə
              </button>

              {/* Tab 3: Dental Jobs */}
              <button
                id="tab-jobs"
                onClick={() => setActiveTab('jobs')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeTab === 'jobs' 
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                }`}
              >
                <Layers size={14} />
                Sifarişlər & İşlər
              </button>

              {/* Tab 4: Finance ledger ledger */}
              <button
                id="tab-finance"
                onClick={() => setActiveTab('finance')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeTab === 'finance' 
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                }`}
              >
                <DollarSign size={14} />
                Balans & Hesabatlar
              </button>

              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2 block pt-4 pb-2 font-mono">
                Texniki Struktur
              </span>

              {/* Tab 5: DB Schema */}
              <button
                id="tab-database"
                onClick={() => setActiveTab('database')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeTab === 'database' 
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                }`}
              >
                <Database size={14} />
                Bazanın Sxemi (DB)
              </button>

              {/* Tab 6: UX advice guidelines */}
              <button
                id="tab-advice"
                onClick={() => setActiveTab('advice')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeTab === 'advice' 
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                }`}
              >
                <Sparkles size={14} />
                UI/UX Tövsiyələr
              </button>
            </nav>
          </div>

          {/* Sidebar bottom: profile exit triggers */}
          <div className="space-y-2 text-center">
            <div className="p-2.5 bg-slate-950 rounded-lg text-[10px] text-slate-550 italic border border-slate-850 leading-relaxed font-sans">
              Biznes idarəetməsində gəlirlərin çoxu həftəlik tənzimlənir.
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2 bg-slate-955 border border-slate-850 hover:bg-rose-950/20 text-slate-400 hover:text-rose-450 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
            >
              <LogOut size={13} />
              Hesabdan Çıxış
            </button>
          </div>

        </aside>

        {/* CONTAINER VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950" id="main-app-viewport">
          {activeTab === 'dashboard' && (
            <Dashboard 
              userProfile={profile} 
              jobs={jobs} 
              transactions={transactions} 
              currencyRates={rates}
              onLogout={handleLogout}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView 
              transactions={transactions} 
              userProfile={profile} 
              currencyRates={rates}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsSection 
              jobs={jobs} 
              userProfile={profile} 
              currencyRates={rates} 
              onAddJob={handleAddJob}
              onUpdateJobStatus={handleUpdateJobStatus}
              onUpdateJobPayment={handleUpdateJobPayment}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceSection 
              transactions={transactions} 
              userProfile={profile} 
              currencyRates={rates} 
              onUpdateRates={handleUpdateRates}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'database' && (
            <DbSchemaSection />
          )}

          {activeTab === 'advice' && (
            <AdviceSection />
          )}
        </main>

      </div>
    </div>
  );
}
