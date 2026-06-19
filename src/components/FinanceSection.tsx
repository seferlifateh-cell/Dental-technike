/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, CurrencyRate, UserProfile } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Plus, 
  Trash2, 
  Calendar, 
  RefreshCw, 
  ChevronRight,
  Info
} from 'lucide-react';

interface FinanceSectionProps {
  transactions: Transaction[];
  userProfile: UserProfile;
  currencyRates: CurrencyRate;
  onUpdateRates: (usd: number, eur: number) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function FinanceSection({ 
  transactions, 
  userProfile, 
  currencyRates, 
  onUpdateRates,
  onDeleteTransaction
}: FinanceSectionProps) {
  const isDentist = userProfile.role === 'dentist';

  // Filters state
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Exchange rates settings
  const [usdRateInput, setUsdRateInput] = useState(currencyRates.usdToAzn.toString());
  const [eurRateInput, setEurRateInput] = useState(currencyRates.eurToAzn.toString());
  const [showRateSettings, setShowRateSettings] = useState(false);

  // Helper date parsing for filters
  // All transactions in seed data are in June 2026.
  // Daily -> June 18, 2026 (or selected most recent date)
  // Weekly -> June 11 to June 18
  // Monthly -> June 2026
  // Yearly -> 2026
  const getFilteredTransactions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getTodayDateString = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getCurrentMonthString = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    };

    const getCurrentYearString = () => {
      const d = new Date();
      return String(d.getFullYear());
    };
    
    return transactions.filter(t => {
      const txDate = new Date(t.date);
      txDate.setHours(0, 0, 0, 0);
      
      // Time boundaries checks
      let matchesTime = true;
      if (timeFilter === 'daily') {
        matchesTime = t.date === getTodayDateString();
      } else if (timeFilter === 'weekly') {
        const diffTime = Math.abs(today.getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchesTime = diffDays <= 7 && txDate <= today;
      } else if (timeFilter === 'monthly') {
        matchesTime = t.date.startsWith(getCurrentMonthString());
      } else if (timeFilter === 'yearly') {
        matchesTime = t.date.startsWith(getCurrentYearString());
      }

      // Type checks
      let matchesType = true;
      if (typeFilter !== 'all') {
        matchesType = t.type === typeFilter;
      }

      return matchesTime && matchesType;
    });
  };

  const filteredTx = getFilteredTransactions();

  // Aggregate stats in AZN (all converted via stored rate in transaction)
  const stats = filteredTx.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.income += t.amountInAzn;
      } else {
        acc.expense += t.amountInAzn;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const profitLoss = stats.income - stats.expense;

  const handleUpdateRates = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = parseFloat(usdRateInput) || 1.70;
    const eur = parseFloat(eurRateInput) || 1.85;
    onUpdateRates(usd, eur);
    setShowRateSettings(false);
  };

  // Currencies breakdowns (count how many AZN, USD, EUR transactions are registered)
  const currencyBreakdown = filteredTx.reduce(
    (acc, t) => {
      acc[t.currency] = (acc[t.currency] || 0) + t.amount;
      return acc;
    },
    { AZN: 0, USD: 0, EUR: 0 } as Record<string, number>
  );

  return (
    <div className="space-y-6" id="finance-section-container">
      
      {/* Top finance analytics card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Dynamic Label for Period Header */}
        <div className="bg-slate-900 border border-slate-805 p-5 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Seçilmiş Hesabat Dövrü</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 font-mono text-[11px] rounded uppercase font-bold">
                {timeFilter === 'daily' && 'Bugün'}
                {timeFilter === 'weekly' && 'Həftəlik'}
                {timeFilter === 'monthly' && 'Aylıq'}
                {timeFilter === 'yearly' && 'İllik'}
              </span>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-400 leading-snug">
            Maliyyə hesabatı cari məzənnələrlə avtomatik olaraq kross-konvertasiya edilərək AZN valyutasında ölçülür.
          </div>
        </div>

        {/* Aggregate Income */}
        <div className="bg-slate-900 border border-slate-805 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ümumi Gəlir</span>
            <TrendingUp size={16} className="text-emerald-450" />
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-mono text-emerald-400">
              +{stats.income.toFixed(2)} AZN
            </h3>
            <p className="text-[9px] text-slate-550 mt-1 uppercase font-semibold">
              Kross həkim qatqısı daxildir
            </p>
          </div>
        </div>

        {/* Aggregate Expense */}
        <div className="bg-slate-900 border border-slate-805 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ümumi Xərc</span>
            <TrendingDown size={16} className="text-rose-450" />
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-mono text-rose-400">
              -{stats.expense.toFixed(2)} AZN
            </h3>
            <p className="text-[9px] text-slate-550 mt-1 uppercase font-semibold text-rose-500/85">
              Material və ofis icarəsi xərci
            </p>
          </div>
        </div>

        {/* Bottom Line profit */}
        <div className={`border p-5 rounded-xl flex flex-col justify-between ${profitLoss >= 0 ? 'bg-teal-950/10 border-teal-850/80' : 'bg-rose-950/10 border-rose-850/80'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Xalis Balans</span>
            <span className={`text-[10px] font-bold font-mono ${profitLoss >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {profitLoss >= 0 ? 'SƏMƏRƏLİ' : 'ZƏRƏR'}
            </span>
          </div>
          <div className="mt-2 text-right">
            <h3 className={`text-xl font-bold font-mono ${profitLoss >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(2)} AZN
            </h3>
            <p className="text-[9px] text-slate-550 mt-1 leading-snug">
              Hazırki daxili maliyyə səmərəliliyi
            </p>
          </div>
        </div>

      </div>

      {/* Exchange rates panel & setup */}
      <div className="bg-slate-900 border border-slate-805 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <RefreshCw size={15} className="text-amber-500 animate-spin-slow" />
            <span className="text-xs font-bold text-slate-200">Kross Valyuta Məzənnə Tənzimləmələri</span>
          </div>

          <button
            onClick={() => {
              setUsdRateInput(currencyRates.usdToAzn.toString());
              setEurRateInput(currencyRates.eurToAzn.toString());
              setShowRateSettings(!showRateSettings);
            }}
            className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-teal-400 px-3 py-1.5 rounded-lg font-semibold transition"
          >
            {showRateSettings ? 'Bağla' : 'Məzənnələri Redaktə et'}
          </button>
        </div>

        {showRateSettings ? (
          <form onSubmit={handleUpdateRates} className="p-4 bg-slate-950/60 border border-slate-805 rounded-lg mt-3.5 space-y-4">
            <p className="text-xs text-slate-400">
              Bu tənzimləmələrdə qeyd edilən məzənnələr rəqəmsal olaraq bütün kross hesabatlarda olan gəlir/xərc (USD və ya EUR) tranzaksiyalarını daxili olaraq yeniləyəcəkdir.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-450 mb-1 font-semibold">1 USD = ? AZN (Dollar məzənnəsi)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={usdRateInput}
                  onChange={(e) => setUsdRateInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-450 mb-1 font-semibold">1 EUR = ? AZN (Evro məzənnəsi)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={eurRateInput}
                  onChange={(e) => setEurRateInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono p-2 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowRateSettings(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded"
              >
                İmtina
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded"
              >
                Məzənnələri Yenilə
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3.5">
            <div className="text-xs p-3 bg-slate-955 rounded border border-slate-850">
              <span className="text-slate-500 block">USD Məzənnəsi:</span>
              <strong className="text-slate-250 font-mono text-sm mt-1 block">1 USD = {currencyRates.usdToAzn.toFixed(2)} AZN</strong>
            </div>

            <div className="text-xs p-3 bg-slate-955 rounded border border-slate-850">
              <span className="text-slate-500 block">EUR Məzənnəsi:</span>
              <strong className="text-slate-250 font-mono text-sm mt-1 block">1 EUR = {currencyRates.eurToAzn.toFixed(2)} AZN</strong>
            </div>

            <div className="text-xs p-3 bg-sky-950/20 rounded border border-sky-900/30 flex items-center gap-2">
              <Info size={14} className="text-sky-400 flex-shrink-0" />
              <p className="text-[10px] text-slate-400 leading-snug">
                Xarici implant və crown material alışı hesablarında bu rəsmi məlumatlara istinad olunur.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Main transactions list of values with timeline filter and currency breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEDGER & LIST IN TABLE (8 cols equivalent - span 2) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-xl p-5">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-850 pb-4 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Əməliyyat Tarixçəsi Loqu</h3>
              <p className="text-[10px] text-slate-450 mt-1">Dövr üzrə cəmi tapılan: <strong>{filteredTx.length} tranzaksiya</strong></p>
            </div>

            {/* Time period filter controls */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 select-none">
              <button
                onClick={() => setTimeFilter('daily')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer uppercase tracking-wider transition ${timeFilter === 'daily' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Günlük
              </button>
              <button
                onClick={() => setTimeFilter('weekly')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer uppercase tracking-wider transition ${timeFilter === 'weekly' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Həftəlik
              </button>
              <button
                onClick={() => setTimeFilter('monthly')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer uppercase tracking-wider transition ${timeFilter === 'monthly' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Aylıq
              </button>
              <button
                onClick={() => setTimeFilter('yearly')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer uppercase tracking-wider transition ${timeFilter === 'yearly' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                İllik
              </button>
            </div>
          </div>

          {/* Quick type filters */}
          <div className="flex gap-2 mb-4 select-none">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold border transition ${
                typeFilter === 'all' ? 'bg-slate-850 text-slate-200 border-slate-700' : 'bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-350'
              }`}
            >
              HƏR İKİSİ
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold border transition ${
                typeFilter === 'income' ? 'bg-emerald-950/40 text-emerald-450 border-emerald-900/40' : 'bg-slate-950 text-slate-500 border-slate-850 hover:text-emerald-400'
              }`}
            >
              ANCAQ GƏLİRLƏR
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold border transition ${
                typeFilter === 'expense' ? 'bg-rose-950/40 text-rose-450 border-rose-900/40' : 'bg-slate-950 text-slate-500 border-slate-850 hover:text-rose-400'
              }`}
            >
              ANCAQ XƏRCLƏR
            </button>
          </div>

          {/* Ledger of records table list */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredTx.length === 0 ? (
              <div className="text-center py-14 text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg bg-slate-950/40">
                Seçilən süzgəc meyarlarına uyğun heç bir tranzaksiya tapılmadı.
              </div>
            ) : (
              filteredTx.map(tx => (
                <div key={tx.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-between hover:border-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-lg flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30' : 'bg-rose-950/40 text-rose-450 border border-rose-900/30'}`}>
                      {tx.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{tx.description}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono font-bold text-slate-500 flex items-center gap-0.5">
                          <Calendar size={10} />
                          {tx.date}
                        </span>
                        <span className="text-[9.5px] bg-slate-900 border border-slate-850 text-slate-400 px-1.5 py-0.5 rounded uppercase font-semibold">
                          {tx.category}
                        </span>
                        {tx.jobId && (
                          <span className="text-[9.5px] bg-teal-950 text-teal-400 px-1 py-0.5 rounded font-mono">
                            🔗 Sifarişlə bağlı
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <span className={`text-xs font-extrabold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount} {tx.currency}
                      </span>
                      {tx.currency !== 'AZN' && (
                        <span className="text-[9px] text-slate-550 block">
                          ~{tx.amountInAzn.toFixed(1)} AZN
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* VALYUTA BREAKDOWNS (4 cols equivalent - span 1) */}
        <div className="bg-slate-900 border border-slate-805 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono border-b border-slate-850 pb-3 mb-4">
              Valyuta Üzrə Struktur
            </h3>
            <p className="text-[11px] text-slate-450 mb-4 leading-relaxed">
              Hesabat müddəti üzrə sistemə fərqli valyutalarda daxil edilmiş nominal müqavilə ödənişləri:
            </p>

            <div className="space-y-4">
              {/* AZN value */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                <span className="text-[9px] font-bold text-slate-500 font-mono">AZN NOMİNAL NAĞD</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold font-mono text-slate-200">
                    {currencyBreakdown.AZN.toFixed(1)} AZN
                  </span>
                  <span className="text-[10px] text-slate-550">Milli Valyuta</span>
                </div>
              </div>

              {/* USD value */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                <span className="text-[9px] font-bold text-amber-500 font-mono">USD NOMİNAL HESAB</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold font-mono text-slate-200">
                    $ {currencyBreakdown.USD.toFixed(1)} USD
                  </span>
                  <span className="text-[10px] text-amber-500 font-mono">
                    ~{(currencyBreakdown.USD * currencyRates.usdToAzn).toFixed(1)} AZN
                  </span>
                </div>
              </div>

              {/* EUR value */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                <span className="text-[9px] font-bold text-indigo-400 font-mono font-bold">EUR NOMİNAL SƏNƏD</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold font-mono text-slate-200">
                    € {currencyBreakdown.EUR.toFixed(1)} EUR
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    ~{(currencyBreakdown.EUR * currencyRates.eurToAzn).toFixed(1)} AZN
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-slate-950 border border-slate-850/80 rounded-lg text-[10px] text-slate-500 leading-snug">
            💡 Həkimlər implant material xərclərini əsasən USD, texniklər isə avropa keramika material alqılarını əsasən EUR ilə daxil etdiklərini nəzərə alaraq, kross konvertasiyaların dəqiqliyini sayğacdan yoxlayın.
          </div>

        </div>

      </div>

    </div>
  );
}
