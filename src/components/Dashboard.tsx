/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Job, Transaction, UserProfile, CurrencyRate } from '../types';
import { 
  DollarSign, 
  Layers, 
  Briefcase, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Stethoscope, 
  Wrench, 
  BellRing,
  ArrowRight,
  TrendingDown,
  CheckCircle,
  HelpCircle,
  LogOut,
  Calendar
} from 'lucide-react';

interface DashboardProps {
  userProfile: UserProfile;
  jobs: Job[];
  transactions: Transaction[];
  currencyRates: CurrencyRate;
  onLogout: () => void;
  onNavigateToTab: (tab: 'calendar' | 'jobs' | 'finance') => void;
}

export default function Dashboard({ 
  userProfile, 
  jobs, 
  transactions, 
  currencyRates, 
  onLogout,
  onNavigateToTab
}: DashboardProps) {
  const isDentist = userProfile.role === 'dentist';

  // Stats calculation
  const totalJobsCount = jobs.length;
  
  // Overdue calculation (against today's date)
  const checkIsOverdue = (job: Job) => {
    if (job.isDelivered || job.status === 'İş hazırdır' || job.status === 'Təhvil verilib') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(job.deadline);
    return deadlineDate < today;
  };

  const overdueJobs = jobs.filter(checkIsOverdue);
  const overdueCount = overdueJobs.length;

  // Active in-progress jobs (excluding final stages)
  const activeJobs = jobs.filter(j => {
    if (isDentist) {
      return j.status !== 'İş hazırdır';
    } else {
      return j.status !== 'Təhvil verilib';
    }
  });

  // Calculate gross income and expenses in AZN for current month
  const todayDate = new Date();
  const currentYear = todayDate.getFullYear();
  const currentMonthIdx = todayDate.getMonth();
  const currentMonthPrefix = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;

  const currentMonthTx = transactions.filter(t => t.date.startsWith(currentMonthPrefix));
  const grossIncomeAzn = currentMonthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amountInAzn, 0);
  const grossExpenseAzn = currentMonthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amountInAzn, 0);

  // Total outstanding debit from patients/doctors (unpaid amount in AZN equivalent)
  const outstandingDebtAzn = jobs.reduce((sum, job) => {
    const debtNominal = job.totalAmount - job.paidAmount;
    if (debtNominal <= 0) return sum;
    const rate = job.currency === 'AZN' ? 1 : job.currency === 'USD' ? currencyRates.usdToAzn : currencyRates.eurToAzn;
    return sum + (debtNominal * rate);
  }, 0);

  // Helper to offset days relative to current local date
  const getOffsetDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const monthNamesAz = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
    "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
  ];

  // Charting Data prep (Daily totals relative to today)
  const chartDays = [
    getOffsetDate(-8),
    getOffsetDate(-6),
    getOffsetDate(-4),
    getOffsetDate(-3),
    getOffsetDate(-1),
    getOffsetDate(0)
  ];
  
  const chartPoints = chartDays.map(dateStr => {
    const dayIncome = transactions.filter(t => t.date === dateStr && t.type === 'income').reduce((s, t) => s + t.amountInAzn, 0);
    const dayExpense = transactions.filter(t => t.date === dateStr && t.type === 'expense').reduce((s, t) => s + t.amountInAzn, 0);
    
    const parts = dateStr.split('-');
    const dayNum = parseInt(parts[2], 10);
    const mIdx = parseInt(parts[1], 10) - 1;
    const mName = monthNamesAz[mIdx];

    return {
      label: `${dayNum} ${mName}`,
      income: dayIncome,
      expense: dayExpense
    };
  });

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-container">
      
      {/* Top Banner with profile summary and alert message */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800">
        
        <div className="lg:col-span-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className={`p-4 rounded-xl ${isDentist ? 'bg-teal-500/10 text-teal-400 border border-teal-850' : 'bg-blue-500/10 text-blue-400 border border-blue-850'}`}>
            {isDentist ? <Stethoscope size={36} /> : <Wrench size={36} />}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded-lg text-[9px] font-mono text-slate-450 uppercase font-bold tracking-wider mb-2">
              <span>Masaüstü Rəqəmsal İşçi • {isDentist ? 'Diş Həkimi Rejimi' : 'Texnik Laboratoriya Rejimi'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
              Salam, {userProfile.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Məkan: <strong>{userProfile.clinicOrLab}</strong> • {monthNamesAz[currentMonthIdx]} {currentYear} ayı üzrə hesabatlar və kross-valyuta tranzaksiyaları tam yüklənmişdir.
            </p>
          </div>
        </div>

        {/* Action switch user role button inside banner */}
        <div className="lg:col-span-4 flex flex-col gap-2 self-stretch justify-center items-end">
          <div className="text-[10px] text-slate-500 font-mono tracking-wider text-right uppercase w-full">
            Tənzimləmələr
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => onNavigateToTab('jobs')}
              className="flex-1 py-1.5 px-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold rounded-lg text-center"
            >
              Yeni Sifariş daxil et
            </button>
            <button
              onClick={onLogout}
              className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 font-semibold rounded-lg flex items-center justify-center gap-1.5 border border-rose-950"
              title="Profilə qayıt"
            >
              <LogOut size={13} />
              Rol Dəyiş
            </button>
          </div>
        </div>

      </div>

      {/* METRIC CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: June Gross Revenues */}
        <div className="bg-slate-900 border border-slate-805 p-5 rounded-xl hover:border-slate-800 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">İyun Gəliri (Gros)</span>
            <span className="p-1 rounded bg-emerald-500/10 border border-emerald-950 text-emerald-400">
              <TrendingUp size={13} />
            </span>
          </div>
          <h3 className="text-lg font-bold font-mono text-slate-100 mt-1">
            {grossIncomeAzn.toFixed(1)} AZN
          </h3>
          <p className="text-[9.5px] text-slate-450 mt-1.5 leading-snug">
            Cari ay ərzində kross-valyutada qəbul edilmiş ümumi bexlər.
          </p>
        </div>

        {/* Metric 2: June Total Expenses */}
        <div className="bg-slate-900 border border-slate-805 p-5 rounded-xl hover:border-slate-800 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">İyun Xərci (Gros)</span>
            <span className="p-1 rounded bg-rose-500/10 border border-rose-950 text-rose-400">
              <TrendingDown size={13} />
            </span>
          </div>
          <h3 className="text-lg font-bold font-mono text-slate-100 mt-1">
            {grossExpenseAzn.toFixed(1)} AZN
          </h3>
          <p className="text-[9.5px] text-slate-450 mt-1.5 leading-snug">
            Klinika/Lab icarələri, material xərci daxil olmaqla.
          </p>
        </div>

        {/* Metric 3: Active Orders status counts */}
        <div className="bg-slate-900 border border-slate-805 p-5 rounded-xl hover:border-slate-800 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Davam edən işlər</span>
            <span className="p-1 rounded bg-teal-505/10 text-teal-400">
              <Layers size={13} />
            </span>
          </div>
          <h3 className="text-lg font-bold font-mono text-slate-100 mt-1">
            {activeJobs.length} / {totalJobsCount} Sifariş
          </h3>
          <p className="text-[9.5px] text-slate-450 mt-1.5 leading-snug">
            {isDentist ? 'Mərhələsi: "Texnikdədi" və ya "Davam edir".' : 'Laboratoriyada hazırlanan növbəti protezlər.'}
          </p>
        </div>

        {/* Metric 4: Debits outstanding */}
        <div className="bg-slate-900 border border-slate-805 p-5 rounded-xl hover:border-slate-800 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Gözlənilən Borclar</span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-500">
              <DollarSign size={13} />
            </span>
          </div>
          <h3 className="text-lg font-bold font-mono text-amber-500 mt-1">
            {outstandingDebtAzn.toFixed(1)} AZN
          </h3>
          <p className="text-[9.5px] text-slate-450 mt-1.5 leading-snug">
            Ödəniş statusu hissəli (/) və ya ödənilməmiş (-) olan sifariş borcları.
          </p>
        </div>

      </div>

      {/* OVERDUE SYSTEM WARNERS AND DESKTOP SYSTEM NOTIFICATION */}
      {overdueCount > 0 && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/60 rounded-xl relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-rose-950/10">
          
          <div className="flex gap-3 items-start">
            <span className="p-2.5 bg-rose-500 text-rose-950 rounded-lg flex items-center justify-center animate-bounce flex-shrink-0">
              <AlertTriangle size={18} />
            </span>
            <div>
              <h4 className="text-xs font-bold text-rose-450 uppercase tracking-wider">
                ⚠️ Sifariş Təhvil Vaxtı Gecikir! (Masaüstü Bildiriş Tətiyi)
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {isDentist ? `Mövcud ${overdueCount} pasiyent işinin təhvil deadline vaxtı keçib. Zəhmət olmasa icraçı protez laboratoriyası ilə əlaqə yaradın.` : `Baza üzrə ${overdueCount} sifarişin təhvil müddəti arxada qalıb! İşi təhvil verib statusunu dəyişdikdən sonra bildiriş sönəcəkdir.`}
              </p>
            </div>
          </div>

          {/* List of overdue names in small tags */}
          <div className="flex flex-wrap gap-1.5 max-w-sm justify-end">
            {overdueJobs.map(job => (
              <span key={job.id} className="text-[10px] bg-rose-900/40 text-rose-350 px-2 py-1 rounded border border-rose-800 font-semibold font-mono" title={job.title}>
                🚨 {job.patientName}
              </span>
            ))}
          </div>

        </div>
      )}

      {/* MID PANEL: CUSTOM CHART AND INJECTED REAL-ALERTS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Custom animated SVG Chart (8 columns equivalent) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-805 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-4 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
                Maliyyə Sürəti & Cari Tranzaksiya Dinamikası
              </h3>
              <p className="text-[10px] text-slate-450 mt-1">
                İyun ayının son fəal günləri üçün gəlir və xərc hərəkətliliyi (AZN karşılığı)
              </p>
            </div>

            <div className="flex gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                Gəlir (Income)
              </span>
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
                Xərc (Expense)
              </span>
            </div>
          </div>

          {/* SVG Custom Render Graph */}
          <div className="relative h-64 w-full flex items-end justify-between px-4 pb-6 pt-4 bg-slate-950/60 border border-slate-850 rounded-xl overflow-hidden shadow-inner font-mono">
            
            {/* Background Gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between py-6 px-1 pointer-events-none">
              <div className="w-full border-b border-slate-900/60 text-[8px] text-slate-650 text-left pl-2">3500 AZN</div>
              <div className="w-full border-b border-slate-900/60 text-[8px] text-slate-650 text-left pl-2">2500 AZN</div>
              <div className="w-full border-b border-slate-900/60 text-[8px] text-slate-650 text-left pl-2">1500 AZN</div>
              <div className="w-full border-b border-slate-900/60 text-[8px] text-slate-650 text-left pl-2">500 AZN</div>
              <div className="w-full text-[8px] text-slate-650 text-left pl-2">0 AZN</div>
            </div>

            {/* Bars Column representation */}
            <div className="absolute inset-x-8 bottom-6 top-8 flex justify-around items-end z-10">
              {chartPoints.map((pt, i) => {
                // max is 3500 for scaling heights
                const incomePercent = Math.min(100, (pt.income / 3500) * 100);
                const expensePercent = Math.min(100, (pt.expense / 3500) * 100);

                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full w-12 group transition-all">
                    
                    {/* Visual Hover Tooltip detail bubble */}
                    <div className="absolute bottom-28 bg-slate-905 border border-slate-800 text-slate-300 rounded p-2 text-[9px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl z-30 whitespace-nowrap text-center">
                      <p className="font-bold text-slate-200">{pt.label}</p>
                      <p className="text-emerald-450">Gəlir: +{pt.income.toFixed(0)} AZN</p>
                      <p className="text-rose-455">Xərc: -{pt.expense.toFixed(0)} AZN</p>
                    </div>

                    {/* Side-by-side comparative column bars with gradients */}
                    <div className="flex gap-1 items-end w-full h-full">
                      {/* Income Bar */}
                      <div 
                        style={{ height: `${incomePercent}%` }}
                        className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t shadow-inner min-h-[4px] hover:brightness-110 transition-all duration-300"
                      />

                      {/* Expense Bar */}
                      <div 
                        style={{ height: `${expensePercent}%` }}
                        className="w-1/2 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t shadow-inner min-h-[4px] hover:brightness-110 transition-all duration-300"
                      />
                    </div>

                    {/* Small tag labels bottom */}
                    <span className="text-[9px] text-slate-450 mt-2 block font-medium uppercase truncate text-center w-full">
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

          <div className="mt-4 text-[10px] text-slate-500 flex justify-between">
            <span>Sütunların üzərinə toxunaraq ətraflı detalları görə bilərsiniz.</span>
            <span>Konvertasiya sürəti: 1 USD = {currencyRates.usdToAzn.toFixed(2)} AZN</span>
          </div>

        </div>

        {/* RECENT NOTIFICATIONS & REAL-TIME ALERTS (4 columns equivalent) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-805 rounded-xl p-5 flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <BellRing size={13} className="text-amber-500" />
                Masaüstü Bildiriş jurnalı
              </h3>
              <span className="text-[8px] bg-amber-950 text-amber-500 font-mono px-2 py-0.5 rounded uppercase">
                FƏAL SİS
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {/* Alert 1 */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-xs">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-mono text-emerald-450 uppercase font-bold bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900/20">Bildiriş</span>
                  <span className="text-[9px] text-slate-600">Bugün 13:45</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  İyun 18 tarixi üçün daxil edilmiş <strong>Nərgiz Əliyeva</strong> vinir işinin statusu "İş Hazırdır" olaraq tamamlandı!
                </p>
              </div>

              {/* Alert 2 */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-xs">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-mono text-rose-455 uppercase font-bold bg-rose-950/40 px-1 py-0.5 rounded border border-rose-900/20">Xəbərdarlıq</span>
                  <span className="text-[9px] text-slate-600">Dünən 18:00</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isDentist ? "DiaDent Protez klinikasından göndərilən metal keramika sifarişinin son çatdırılma tarixi keçib!" : "Dr. Samirə Əliyevadan gələn zirkon sifarişinin təhvil vaxtı keçib, paneldə xatırlatma nişanı '!' yandırılıb."}
                </p>
              </div>

              {/* Alert 3 */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-xs">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold bg-slate-900 px-1 py-0.5 rounded">Sistem</span>
                  <span className="text-[9px] text-slate-600">14 İyun</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Valyuta məzənnələri Sandbox üzrə yeniləndi (USD: {currencyRates.usdToAzn}, EUR: {currencyRates.eurToAzn}). Bütün AZN ekvivalentləri yenidən hesablandı.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-850 text-[10px] text-slate-550 leading-snug">
            💡 Tauri və ya Electron masaüstü inteqrasiyası proqram fonda fəaliyyət göstərən vaxtda əməliyyat sisteminin sürətli push bildiriş panelinə zəng edəcəkdir.
          </div>

        </div>

      </div>

      {/* FOOTER SHORTCUT BUTTONS QUICK GUIDE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850/60">
        <button 
          onClick={() => onNavigateToTab('calendar')}
          className="p-3 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-805 text-left transition-colors flex items-center justify-between"
        >
          <div>
            <h4 className="text-xs font-bold text-slate-200">📅 Təqvim əsaslı Maliyyə</h4>
            <p className="text-[10px] text-slate-450 mt-1">Hər hansı bir günün məsrəfləri</p>
          </div>
          <ArrowRight size={13} className="text-teal-400" />
        </button>

        <button 
          onClick={() => onNavigateToTab('jobs')}
          className="p-3 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-805 text-left transition-colors flex items-center justify-between"
        >
          <div>
            <h4 className="text-xs font-bold text-slate-200">💼 Diş Sifarişləri & Mərhələlər</h4>
            <p className="text-[10px] text-slate-450 mt-1">İş axını statusları və ödəniş yoxlamaları</p>
          </div>
          <ArrowRight size={13} className="text-teal-400" />
        </button>

        <button 
          onClick={() => onNavigateToTab('finance')}
          className="p-3 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-805 text-left transition-colors flex items-center justify-between"
        >
          <div>
            <h4 className="text-xs font-bold text-slate-200">💰 Detallı Maliyyə Süzgəcləri</h4>
            <p className="text-[10px] text-slate-450 mt-1">Günlük, həftəlik, aylıq və illik balanslar</p>
          </div>
          <ArrowRight size={13} className="text-teal-400" />
        </button>
      </div>

    </div>
  );
}
