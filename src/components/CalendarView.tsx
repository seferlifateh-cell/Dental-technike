/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, CurrencyRate, UserProfile } from '../types';
import { 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  X, 
  Coins, 
  TrendingUp, 
  HelpCircle,
  PiggyBank,
  Check
} from 'lucide-react';

interface CalendarViewProps {
  transactions: Transaction[];
  userProfile: UserProfile;
  currencyRates: CurrencyRate;
  onAddTransaction: (type: 'income' | 'expense', amount: number, currency: 'AZN' | 'USD' | 'EUR', description: string, category: string, date: string) => void;
}

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CalendarView({ 
  transactions, 
  userProfile, 
  currencyRates, 
  onAddTransaction 
}: CalendarViewProps) {
  const isDentist = userProfile.role === 'dentist';

  // State
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayDateString());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<'income' | 'expense'>('income');
  const [newAmountStr, setNewAmountStr] = useState('');
  const [newCurrency, setNewCurrency] = useState<'AZN' | 'USD' | 'EUR'>('AZN');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Dynamic Dates Generation for the actual current month
  const todayDate = new Date();
  const currentYear = todayDate.getFullYear();
  const currentMonthIdx = todayDate.getMonth();
  
  const monthNamesAz = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
    "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
  ];
  const currentMonthName = monthNamesAz[currentMonthIdx];

  const daysInCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const currentDaysList = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateString = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return {
      dayNum,
      dateString,
      isToday: dateString === getTodayDateString()
    };
  });

  // Categories helper based on roles
  const incomeCategories = isDentist 
    ? ['Ortodontiya / Ortopediya', 'Terapevtik Müalicə', 'Cərrahi Müdaxilə', 'Estetik Diş Həkimliyi', 'Digər']
    : ['Zirkon işləri', 'Metal-Keramika işləri', 'Akril Protezlər', 'İmplantüstü işlər', 'Digər'];

  const expenseCategories = isDentist
    ? ['Material Xərcləri', 'Sərfiyyat Xərcləri', 'Ofis/Klinika Xərcləri', 'Texnik Haqqı', 'Maaşlar', 'Digər']
    : ['Laboratoriya Sərfiyyatı', 'Avadanlıq/Alət Xərcləri', 'Material Alışı', 'Maaşlar', 'İcarə haqqı', 'Digər'];

  // Current selected categories
  const activeCategoriesSelect = newType === 'income' ? incomeCategories : expenseCategories;

  // Group transactions by date for calendar visual representation
  const getTransactionsForDate = (dateStr: string) => {
    return transactions.filter(t => t.date === dateStr);
  };

  const getDailiesTotal = (dateStr: string) => {
    const dailies = getTransactionsForDate(dateStr);
    let income = 0;
    let expense = 0;
    dailies.forEach(t => {
      if (t.type === 'income') income += t.amountInAzn;
      else expense += t.amountInAzn;
    });
    return { income, expense, balance: income - expense };
  };

  const selectedDateTx = selectedDate ? getTransactionsForDate(selectedDate) : [];
  const selectedDateSummary = selectedDate ? getDailiesTotal(selectedDate) : { income: 0, expense: 0, balance: 0 };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !newAmountStr) return;

    const amount = parseFloat(newAmountStr) || 0;
    const finalCategory = newCategory || activeCategoriesSelect[0];
    const finalDescription = newDescription.trim() || `${finalCategory} əməliyyatı`;

    onAddTransaction(
      newType,
      amount,
      newCurrency,
      finalDescription,
      finalCategory,
      selectedDate
    );

    // Reset Form
    setNewAmountStr('');
    setNewDescription('');
    setNewCategory('');
    setShowAddForm(false);
  };

  // Convert on the fly
  const currentEstAzn = () => {
    const amt = parseFloat(newAmountStr) || 0;
    if (newCurrency === 'AZN') return amt;
    const rte = newCurrency === 'USD' ? currencyRates.usdToAzn : currencyRates.eurToAzn;
    return amt * rte;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="calendar-section-container">
      
      {/* LEFT: Complete Calendar Grid (8 cols) */}
      <div className="xl:col-span-8 bg-slate-900 border border-slate-805 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="text-teal-400" size={18} />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest font-sans">
              {currentMonthName} {currentYear} Təqvimi (Maliyyə Qeydləri)
            </h2>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Hər hansı bir günə klikləyərək tranzaksiya əlavə edin və ya siyahıya baxın.
          </p>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-slate-500 font-semibold bg-slate-955 py-2 rounded-lg mb-2">
          <span>B.E (Mon)</span>
          <span>Ç.A (Tue)</span>
          <span>Ç. (Wed)</span>
          <span>C.A (Thu)</span>
          <span>C. (Fri)</span>
          <span>Ş. (Sat)</span>
          <span>B. (Sun)</span>
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-2">
          {currentDaysList.map(day => {
            const dailies = getDailiesTotal(day.dateString);
            const isSelected = selectedDate === day.dateString;
            const sizeOfTxList = getTransactionsForDate(day.dateString).length;

            return (
              <button
                key={day.dayNum}
                onClick={() => {
                  setSelectedDate(day.dateString);
                  setShowAddForm(false);
                }}
                className={`min-h-16 text-left p-1.5 rounded-lg border flex flex-col justify-between transition-all outline-none ${
                  isSelected 
                    ? 'border-teal-500 bg-teal-950/20 shadow-md shadow-teal-950/10' 
                    : day.isToday 
                      ? 'border-sky-500 bg-slate-950 text-sky-200' 
                      : 'border-slate-805 bg-slate-950/50 hover:bg-slate-900/40 text-slate-400'
                }`}
              >
                {/* Day indicator, today alert */}
                <div className="flex justify-between items-center w-full">
                  <span className={`text-[10px] font-mono leading-none font-semibold ${day.isToday ? 'bg-sky-500/20 px-1 py-0.5 rounded text-sky-450' : 'text-slate-350'}`}>
                    {day.dayNum}
                  </span>
                  {sizeOfTxList > 0 && (
                    <span className="text-[8px] bg-slate-850 border border-slate-750 text-slate-300 font-bold px-1 rounded-full leading-none">
                      {sizeOfTxList}
                    </span>
                  )}
                </div>

                {/* Day finance mini badges */}
                <div className="mt-2 space-y-0.5">
                  {dailies.income > 0 && (
                    <div className="text-[8px] font-mono leading-none text-emerald-400 font-medium">
                      +{Math.round(dailies.income)} AZN
                    </div>
                  )}

                  {dailies.expense > 0 && (
                    <div className="text-[8px] font-mono leading-none text-rose-400 font-medium">
                      -{Math.round(dailies.expense)} AZN
                    </div>
                  )}
                </div>

              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-850 pt-3">
          <span>📅 Təqvim cari vaxt zonasına uyğun tənzimlənir: <strong>{currentMonthName} {currentYear}</strong></span>
          <div className="flex gap-2">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Sifariş gəliri / Beh</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Alət / Material xərci</span>
          </div>
        </div>

      </div>

      {/* RIGHT: Detail drawer list & transaction recorder for the selected day (4 cols) */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-805 rounded-xl p-5 flex flex-col justify-between">
        
        <div>
          {/* Header of selected day */}
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">GÜNLÜK ƏMƏLİYYATLAR</p>
              <h3 className="text-sm font-bold text-slate-200 mt-0.5">{selectedDate}</h3>
            </div>

            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (!newCategory) setNewCategory(activeCategoriesSelect[0]);
              }}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-teal-400 hover:text-teal-350 p-1.5 rounded transition-colors"
              title="Yeni gəlir/xərc əlavə et"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Quick Balance Summary for selected day */}
          <div className="grid grid-cols-2 gap-2 my-4 bg-slate-950 p-2.5 rounded-lg border border-slate-850/80">
            <div className="text-center border-r border-slate-900">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Günlük Gəlir</span>
              <span className="text-xs text-emerald-400 font-mono font-bold mt-1 block">+{selectedDateSummary.income.toFixed(1)} AZN</span>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Günlük Xərc</span>
              <span className="text-xs text-rose-400 font-mono font-bold mt-1 block">-{selectedDateSummary.expense.toFixed(1)} AZN</span>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-2 mt-2 max-h-72 overflow-y-auto pr-1">
            {selectedDateTx.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Bu gün üçün hər hansı bir qeyd daxil edilməyib.
              </div>
            ) : (
              selectedDateTx.map((tx) => (
                <div key={tx.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <span className={`p-1.5 rounded mt-0.5 ${tx.type === 'income' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30' : 'bg-rose-950/40 text-rose-450 border border-rose-900/30'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                    </span>
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-250 leading-snug">{tx.description}</h4>
                      <div className="flex gap-1.5 mt-1">
                        <span className="text-[9px] bg-slate-900 border border-slate-850 text-slate-450 px-1.5 rounded-md uppercase font-semibold font-mono">
                          {tx.category}
                        </span>
                        {tx.jobId && (
                          <span className="text-[8px] bg-teal-950 text-teal-400 px-1 py-0.5 rounded font-mono">
                            🔗 Sifarişlə bağlı
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and conversion */}
                  <div className="text-right flex-shrink-0 ml-4 font-mono">
                    <span className={`text-xs font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount} {tx.currency}
                    </span>
                    {tx.currency !== 'AZN' && (
                      <span className="text-[8px] text-slate-550 block">
                        ~{tx.amountInAzn.toFixed(1)} AZN
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Form add on fly (collapsible overlay inside side pane) */}
        {showAddForm && (
          <div className="border border-slate-805 bg-slate-950 p-4 rounded-xl mt-4 space-y-4">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-900">
              <span className="text-xs font-bold text-slate-300">Yeni Tranzaksiya daxil et</span>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-200">
                <X size={12} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3.5">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setNewType('income');
                    setNewCategory(incomeCategories[0]);
                  }}
                  className={`py-1 text-xs font-semibold rounded cursor-pointer ${newType === 'income' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  GƏLİR (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewType('expense');
                    setNewCategory(expenseCategories[0]);
                  }}
                  className={`py-1 text-xs font-semibold rounded cursor-pointer ${newType === 'expense' ? 'bg-rose-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  XƏRC (-)
                </button>
              </div>

              {/* Amount and currency */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Məbləğ</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="200"
                    value={newAmountStr}
                    onChange={(e) => setNewAmountStr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Valyuta</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-teal-400 font-bold"
                  >
                    <option value="AZN">AZN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* AZN estimated preview */}
              {newCurrency !== 'AZN' && (
                <div className="text-[10px] text-amber-400 font-mono flex justify-between bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <span>Məzənnə qarşılığı:</span>
                  <strong>{currentEstAzn().toFixed(1)} AZN</strong>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Kateqoriya</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300"
                >
                  {activeCategoriesSelect.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                  Səbəb / İzah <span className="text-slate-600 font-medium font-sans text-[8px] lowercase">(istəyə bağlı)</span>
                </label>
                <input
                  type="text"
                  placeholder="Məsələn: Orto tənzimləmə qapağı behi"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-250 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Submit transaction */}
              <button
                type="submit"
                className="w-full py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded text-xs font-extrabold flex items-center justify-center gap-1 shadow-md shadow-teal-500/10"
              >
                <Check size={11} />
                Qeyd et
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}
