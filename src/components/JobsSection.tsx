/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Job, UserProfile, CurrencyRate, PaymentStatus } from '../types';
import { 
  Briefcase, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Coins, 
  UserPlus, 
  ChevronRight, 
  Search, 
  Info,
  Layers,
  Wrench,
  Stethoscope,
  Filter,
  X
} from 'lucide-react';

interface JobsSectionProps {
  jobs: Job[];
  userProfile: UserProfile;
  currencyRates: CurrencyRate;
  onAddJob: (job: Job) => void;
  onUpdateJobStatus: (id: string, nextStatus: string) => void;
  onUpdateJobPayment: (id: string, paidAmount: number, status: PaymentStatus) => void;
  onAddTransaction: (type: 'income' | 'expense', amount: number, currency: 'AZN' | 'USD' | 'EUR', description: string, category: string, jobId?: string) => void;
}

const getOffsetDate = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function JobsSection({ 
  jobs, 
  userProfile, 
  currencyRates, 
  onAddJob, 
  onUpdateJobStatus,
  onUpdateJobPayment,
  onAddTransaction
}: JobsSectionProps) {
  const isDentist = userProfile.role === 'dentist';

  // Role workflows
  const dentistStatuses = ['İş götürülüb', 'Texnikdədi', 'Davam edir', 'İş hazırdır'];
  const techStatuses = ['İş gəlib', 'İş hazırlanır', 'Təhvil verilib'];
  const activeWorkflow = isDentist ? dentistStatuses : techStatuses;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'not_paid' | 'partial'>('all');
  const [overdueFilter, setOverdueFilter] = useState<boolean>(false);

  // Form states for adding a new job
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDeadline, setNewDeadline] = useState(getOffsetDate(3));
  const [newTotalStr, setNewTotalStr] = useState('');
  const [newCurrency, setNewCurrency] = useState<'AZN' | 'USD' | 'EUR'>('AZN');

  // Form states for adding payment (registering payment in job)
  const [selectedJobForPayment, setSelectedJobForPayment] = useState<Job | null>(null);
  const [paymentInputStr, setPaymentInputStr] = useState('');

  // Validate deadline (dynamically check against current date)
  const checkIsOverdue = (job: Job) => {
    if (job.isDelivered || job.status === 'İş hazırdır' || job.status === 'Təhvil verilib') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(job.deadline);
    return deadlineDate < today;
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.trim() || !newTitle.trim() || !newTotalStr) return;

    const total = parseFloat(newTotalStr) || 0;
    const rate = newCurrency === 'AZN' ? 1 : newCurrency === 'USD' ? currencyRates.usdToAzn : currencyRates.eurToAzn;
    const amountInAzn = total * rate;

    const created: Job = {
      id: 'job-' + Date.now(),
      patientName: newPatient.trim(),
      providerName: newProvider.trim() || (isDentist ? 'Laboratoriya (Usta)' : 'Sifarişçi Həkim'),
      title: newTitle.trim(),
      description: newDesc.trim(),
      startDate: newStartDate,
      deadline: newDeadline,
      status: activeWorkflow[0],
      paymentStatus: 'not_paid',
      totalAmount: total,
      paidAmount: 0,
      currency: newCurrency,
      amountInAzn: amountInAzn,
      isDelivered: false
    };

    onAddJob(created);
    
    // Reset form
    setNewPatient('');
    setNewProvider('');
    setNewTitle('');
    setNewDesc('');
    setNewTotalStr('');
    setNewCurrency('AZN');
    setShowAddForm(false);
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForPayment || !paymentInputStr) return;

    const newPaymentVal = parseFloat(paymentInputStr) || 0;
    const currentPaid = selectedJobForPayment.paidAmount;
    const updatedPaid = Math.min(selectedJobForPayment.totalAmount, currentPaid + newPaymentVal);
    
    let nextPaymentStatus: PaymentStatus = 'not_paid';
    if (updatedPaid >= selectedJobForPayment.totalAmount) {
      nextPaymentStatus = 'paid';
    } else if (updatedPaid > 0) {
      nextPaymentStatus = 'partial';
    }

    onUpdateJobPayment(selectedJobForPayment.id, updatedPaid, nextPaymentStatus);

    // Create a corresponding transaction
    const rate = selectedJobForPayment.currency === 'AZN' ? 1 : selectedJobForPayment.currency === 'USD' ? currencyRates.usdToAzn : currencyRates.eurToAzn;
    const incomeAzn = newPaymentVal * rate;

    const desc = `${selectedJobForPayment.patientName} - ` + (isDentist ? `Ödəniş / Həkim gəliri : ${selectedJobForPayment.title}` : `Ödənis / Texnik laboratoriya təhvili: ${selectedJobForPayment.title}`);
    const cat = isDentist ? 'Ortodontiya / Ortopediya' : 'Diş Protez Sifarişi';

    onAddTransaction(
      'income',
      newPaymentVal,
      selectedJobForPayment.currency,
      desc,
      cat,
      selectedJobForPayment.id
    );

    setSelectedJobForPayment(null);
    setPaymentInputStr('');
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      job.patientName.toLowerCase().includes(term) ||
      job.providerName.toLowerCase().includes(term) ||
      job.title.toLowerCase().includes(term) ||
      (job.description && job.description.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || job.paymentStatus === paymentFilter;
    const matchesOverdue = !overdueFilter || checkIsOverdue(job);

    return matchesSearch && matchesStatus && matchesPayment && matchesOverdue;
  });

  return (
    <div className="space-y-6" id="jobs-section-container">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="text-teal-400" size={18} />
            Həkim/Texnik İş Prosesləri (Zaborat)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rolunuz: <strong className="text-teal-400 uppercase">{isDentist ? 'Diş Həkimi' : 'Diş Texniki'}</strong>. {isDentist ? 'Texnikə göndərilən və klinika daxili bütün diş sifarişləriniz.' : 'Həkimlərdən aldığınız laboratoriya protez ştampları.'}
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            // Pre-seed some ideas
            if (isDentist) {
              setNewProvider('Elite Protez Lab');
            } else {
              setNewProvider('Dr. Rauf Məmmədov');
            }
          }}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-md transition-colors"
        >
          <Plus size={14} />
          Yeni Sifariş daxil et
        </button>
      </div>

      {/* Add Job Form Grid */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl transition-all duration-300">
          <h3 className="text-sm font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            {isDentist ? <Stethoscope size={16} className="text-teal-400" /> : <Wrench size={16} className="text-blue-400" />}
            Yeni {isDentist ? 'Klinika Pasiyent İşinin' : 'Həkim Sifarişinin'} Qeydiyyatı
          </h3>

          <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">{isDentist ? 'Pasiyentin Adı Soyadı' : 'Sifarişçi Həkim və Klinikası'}</label>
              <input
                type="text"
                required
                value={newPatient}
                onChange={(e) => setNewPatient(e.target.value)}
                placeholder={isDentist ? 'Kamran Əliyev' : 'Dr. Vaqif Həsənov (Modern Dent)'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">{isDentist ? 'İcraçı Laboratoriya / Texnik' : 'Pasiyent / Xəstə Adı'}</label>
              <input
                type="text"
                required
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
                placeholder={isDentist ? 'Elite Protez Lab (Kənan Usta)' : 'Pasiyent: Lalə Məmmədova'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Təyinat / İşin Adı</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Məsələn: Zirkon Tac, Vinir və ya Akril Protez"
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded p-2 text-xs text-slate-200"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Rəng kodu və əlavə tibbi detallar (Rəng, Ştamp, Forma)</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Rəng tonu: A2, Üst üstü 11 nömrəli diş, fərdi ştamp və s."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">İşin başlama tarixi</label>
              <input
                type="date"
                required
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold text-rose-300">Təhvil tarixi (Günü/Deadline)</label>
              <input
                type="date"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded p-2 text-xs text-slate-200 text-rose-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Ümumi Razılaşma Məbləği</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  required
                  placeholder="250"
                  value={newTotalStr}
                  onChange={(e) => setNewTotalStr(e.target.value)}
                  className="w-2/3 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded p-2 text-xs text-slate-200 font-mono text-center"
                />
                <select
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value as any)}
                  className="w-1/3 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded p-2 text-xs text-teal-400 font-bold"
                >
                  <option value="AZN">AZN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded text-xs font-semibold"
              >
                Ləğv et
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded text-xs font-bold"
              >
                Sifarişi Yadda Saxla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pay Partial Form Modal */}
      {selectedJobForPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 relative">
            <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Coins className="text-amber-400" size={16} />
              Ödəniş / Qismən Beh daxil et
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              <strong>{selectedJobForPayment.patientName}</strong> üçün {selectedJobForPayment.title} işinə ödəniş əlavə edin. Ümumi qiymət: {selectedJobForPayment.totalAmount} {selectedJobForPayment.currency}. Hal-hazırda ödənilən: {selectedJobForPayment.paidAmount} {selectedJobForPayment.currency}.
            </p>

            <form onSubmit={handleRegisterPayment} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Daxil edilən Məbləğ ({selectedJobForPayment.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder={`Maksimum ${selectedJobForPayment.totalAmount - selectedJobForPayment.paidAmount}`}
                  max={selectedJobForPayment.totalAmount - selectedJobForPayment.paidAmount}
                  value={paymentInputStr}
                  onChange={(e) => setPaymentInputStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 font-mono text-center text-lg focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                ℹ️ Bu ödəniş avtomatik olaraq tətbiqin daxili maliyyə (gəlir) hesabatlarına {new Date().toISOString().split('T')[0]} tarixli olaraq keçiriləcək.
              </div>

              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedJobForPayment(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg"
                >
                  Bağla
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-lg font-bold"
                >
                  Ödənişi Təsdiqlə
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Search & Filtering Bento Panel */}
      <div className="bg-slate-900 border border-slate-805 rounded-xl p-5 space-y-4 shadow-xl shadow-slate-950/25 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="text-teal-400" size={16} />
            <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">Sürətli Axtarış və Süzgəclər</span>
          </div>
          {(searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || overdueFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPaymentFilter('all');
                setOverdueFilter(false);
              }}
              className="px-2.5 py-1 text-[10px] font-bold text-teal-400 hover:text-teal-350 bg-teal-950/40 hover:bg-teal-950/80 border border-teal-900/40 rounded-lg flex items-center gap-1 transition-all"
            >
              <X size={11} />
              Filtrləri təmizlə
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Pasiyent adı, həkim, klinika və ya iş adı ilə axtarın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 rounded-lg text-xs pl-8.5 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Overdue/Gecikənlər Filter Switch */}
          <div className="lg:col-span-3 flex items-center justify-start lg:justify-center">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={overdueFilter}
                onChange={(e) => setOverdueFilter(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-8.5 h-5 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[3px] after:bg-slate-400 peer-checked:after:bg-rose-500 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-rose-950/40 peer-checked:border-rose-900" />
              <span className={`text-xs font-semibold transition-colors duration-150 ${overdueFilter ? 'text-rose-400 font-bold' : 'text-slate-400 group-hover:text-slate-300'}`}>
                ⚠️ Gecikmiş işlər ({jobs.filter(j => checkIsOverdue(j)).length})
              </span>
            </label>
          </div>

          {/* Results Badge counter matching */}
          <div className="lg:col-span-4 flex items-center justify-start lg:justify-end text-[11px] font-mono text-slate-500 bg-slate-950/50 lg:bg-transparent p-2 lg:p-0 rounded-lg border border-slate-850 lg:border-none">
            {filteredJobs.length === jobs.length ? (
              <span>Cəmi: <strong className="text-slate-350">{jobs.length} sifariş</strong> qeydə alınıb</span>
            ) : (
              <span>Tapıldı: <strong className="text-teal-400 font-bold">{filteredJobs.length}</strong> / cəmi {jobs.length} sifariş</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5 border-t border-slate-800/50">
          {/* Status filter workflow pills */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">İş Prosesi (Status)</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${statusFilter === 'all' ? 'bg-slate-950 border-teal-900/60 text-teal-400 font-bold' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'}`}
              >
                Hamısı ({jobs.length})
              </button>
              {activeWorkflow.map(status => {
                const count = jobs.filter(j => j.status === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${statusFilter === status ? 'bg-slate-950 border-teal-900/60 text-teal-400 font-bold' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'}`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment filter status pills with matching symbol designs */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Maliyyə (Ödəniş) Statusu</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setPaymentFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${paymentFilter === 'all' ? 'bg-slate-950 border-teal-900/60 text-teal-400 font-bold' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'}`}
              >
                Hamısı
              </button>
              <button
                onClick={() => setPaymentFilter('paid')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border flex items-center gap-1 ${paymentFilter === 'paid' ? 'bg-emerald-950/50 border-emerald-900/60 text-emerald-400 font-bold' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'}`}
              >
                <span className="text-emerald-500 font-bold">+</span>
                Tam Ödənilib ({jobs.filter(j => j.paymentStatus === 'paid').length})
              </button>
              <button
                onClick={() => setPaymentFilter('not_paid')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border flex items-center gap-1 ${paymentFilter === 'not_paid' ? 'bg-rose-950/50 border-rose-900/60 text-rose-400 font-bold' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'}`}
              >
                <span className="text-rose-500 font-bold">-</span>
                Borclu ({jobs.filter(j => j.paymentStatus === 'not_paid').length})
              </button>
              <button
                onClick={() => setPaymentFilter('partial')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border flex items-center gap-1 ${paymentFilter === 'partial' ? 'bg-amber-950/50 border-amber-900/60 text-amber-400 font-bold' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'}`}
              >
                <span className="text-amber-500 font-bold">/</span>
                Qismən ödənilən ({jobs.filter(j => j.paymentStatus === 'partial').length})
              </button>
            </div>
          </div>
        </div>

        {/* If filtered list has different items than complete database and active filter labels exist */}
        {(searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || overdueFilter) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] text-slate-400">
            <span className="text-slate-500 font-medium">Aktiv Süzgəclər:</span>
            {searchTerm && (
              <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-teal-400 flex items-center gap-1">
                Axtarış: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-350 font-bold">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-teal-400 flex items-center gap-1">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="text-slate-500 hover:text-slate-350 font-bold">×</button>
              </span>
            )}
            {paymentFilter !== 'all' && (
              <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-teal-400 flex items-center gap-1">
                Ödəniş: {paymentFilter === 'paid' ? 'Tam Ödənilib' : paymentFilter === 'not_paid' ? 'Borclu' : 'Qismən Ödənilən'}
                <button onClick={() => setPaymentFilter('all')} className="text-slate-500 hover:text-slate-350 font-bold">×</button>
              </span>
            )}
            {overdueFilter && (
              <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-rose-400 flex items-center gap-1">
                Gecikmişlər
                <button onClick={() => setOverdueFilter(false)} className="text-slate-500 hover:text-rose-350 font-bold">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid of job cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.length === 0 ? (
          <div className="col-span-2 bg-slate-900/40 border border-slate-805 rounded-xl py-12 text-center p-6 text-slate-450 text-xs">
            Axtarışa və ya kateqoriyaya uyğun heç bir sifariş tapılmadı.
          </div>
        ) : (
          filteredJobs.map(job => {
            const isOverdue = checkIsOverdue(job);

            return (
              <div 
                key={job.id} 
                className={`bg-slate-900 border rounded-xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between relative ${isOverdue ? 'border-rose-950/80 bg-rose-950/5' : 'border-slate-805'}`}
              >
                
                {/* Overdue alert indicator with visual '!' and sound player button */}
                {isOverdue && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const osc = audioCtx.createOscillator();
                          const gainNode = audioCtx.createGain();
                          
                          osc.connect(gainNode);
                          gainNode.connect(audioCtx.destination);
                          
                          osc.type = 'sine';
                          osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                          gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05);
                          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                          
                          osc.start();
                          osc.stop(audioCtx.currentTime + 0.35);
                        } catch (err) {
                          console.warn("Audio Context blocked by browser sandbox gesture restriction:", err);
                        }
                      }}
                      className="bg-rose-500 text-rose-950 font-extrabold font-mono text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border border-rose-400/30 hover:bg-rose-400 active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-500/20"
                      title="Səsi oxutmaq üçün klikləyin"
                    >
                      <span className="font-black text-xs mr-0.5 animate-bounce">!</span> GECİKİR 🔊
                    </button>
                  </div>
                )}

                {/* Card Top */}
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <span className="text-[10px] text-teal-400 font-mono uppercase bg-teal-950/40 border border-teal-900/30 px-2 py-0.5 rounded-lg">
                        {job.status}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-200 mt-1.5 flex items-center gap-1.5">
                        {job.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        Sifarişçi: {job.patientName}
                      </p>
                    </div>

                    {/* Cost conversion / Pricing Badge */}
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-300">
                        {job.totalAmount} {job.currency}
                      </div>
                      {job.currency !== 'AZN' && (
                        <div className="text-[9px] text-slate-550 font-mono">
                          ~ {job.amountInAzn.toFixed(1)} AZN
                        </div>
                      )}
                    </div>
                  </div>

                  {job.description && (
                    <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 my-2 pt-2.5 font-sans leading-relaxed">
                      🎨 {job.description}
                    </p>
                  )}

                  {/* Dates information */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-slate-850/60 pt-2.5 max-w-full">
                    <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-ellipsis">
                      <Calendar size={11} className="flex-shrink-0" />
                      <span>Start: {job.startDate}</span>
                    </div>

                    <div className={`flex items-center gap-1 overflow-hidden whitespace-nowrap text-ellipsis font-mono ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                      <Clock size={11} className="flex-shrink-0" />
                      <span>Son Gün: {job.deadline}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Controls */}
                <div className="mt-4 pt-3 border-t border-slate-850/80 flex items-center justify-between gap-2">
                  
                  {/* Financial mark with the requested symbols: +, -, / */}
                  <div className="flex items-center gap-1.5">
                    {job.paymentStatus === 'paid' && (
                      <span id={`status-paid-${job.id}`} className="bg-emerald-500/10 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1" title="Ödəniş tam alınıb">
                        <span className="font-extrabold text-xs text-emerald-500">+</span> Tam Ödənilib
                      </span>
                    )}

                    {job.paymentStatus === 'not_paid' && (
                      <span id={`status-unpaid-${job.id}`} className="bg-rose-500/10 text-rose-400 border border-rose-900/40 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1" title="Ödəniş heç alınmayıb">
                        <span className="font-extrabold text-xs text-rose-500">-</span> Borclu ({job.totalAmount} {job.currency})
                      </span>
                    )}

                    {job.paymentStatus === 'partial' && (
                      <span id={`status-partial-${job.id}`} className="bg-amber-500/10 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1" title="Ödəniş qismən/hissə-hissə alınıb">
                        <span className="font-extrabold text-xs text-amber-500">/</span> Ödənilib ({job.paidAmount}/{job.totalAmount})
                      </span>
                    )}

                    {/* Quick Payment register icon trigger */}
                    {job.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => setSelectedJobForPayment(job)}
                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        title="Beh daxil et"
                      >
                        <Coins size={13} />
                      </button>
                    )}
                  </div>

                  {/* Workflow transitioner buttons */}
                  <div className="flex items-center gap-1">
                    {activeWorkflow.indexOf(job.status) < activeWorkflow.length - 1 ? (
                      <button
                        onClick={() => {
                          const currentIndex = activeWorkflow.indexOf(job.status);
                          onUpdateJobStatus(job.id, activeWorkflow[currentIndex + 1]);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-0.5 transition-colors"
                      >
                        Növbəti mərhələ
                        <ChevronRight size={10} />
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 px-1 py-1">
                        <CheckCircle2 size={11} />
                        Təhvil verildi
                      </span>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
