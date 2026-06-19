/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, FileCode, Check, Copy, ArrowRight, ShieldAlert, Key, Link2 } from 'lucide-react';

export default function DbSchemaSection() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<'jobs' | 'transactions' | 'users'>('jobs');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sqlSchema = `-- =======================================================
-- DENTSUITE VERİLƏNLƏR BAZASI SXEMİ (POSTGRESQL / SQLITE)
-- =======================================================

-- 1. İSTİFADƏÇİ ROL VƏ PROFİLLƏRİ CƏDVƏLİ
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'dentist' (Həkim) və ya 'technician' (Texnik)
    clinic_or_lab VARCHAR(150),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. İŞLƏR VƏ SİFARİŞLƏR CƏDVƏLİ (MÜQAVİLƏLƏR)
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(50) PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,     -- Pasiyent və ya Xəstə adı
    provider_name VARCHAR(150) NOT NULL,    -- Sifarişçi Həkim və ya İcraçı Texnik/Laboratoriya
    title VARCHAR(150) NOT NULL,            -- İşin qısa başlığı (məs. Zirkon Qapaq)
    description TEXT,                       -- İşin fərdi vizual təsviri (rəng, anatomik forma və s.)
    start_date DATE NOT NULL,
    deadline TIMESTAMP NOT NULL,            -- Təhvil verilməli olan son vaxt (Bildiriş idarəçiliyi üçün)
    status VARCHAR(50) NOT NULL,            -- 'götürülüb', 'texnikdə', 'gəlib', 'hazırlanır' və s.
    payment_status VARCHAR(20) NOT NULL,    -- 'paid' (+), 'not_paid' (-), 'partial' (/)
    total_amount DECIMAL(10, 2) NOT NULL,   -- Ümumi razılaşdırılmış məbləğ
    paid_amount DECIMAL(10, 2) DEFAULT 0,   -- Faktiki ödənilən qondarma beh məbləği
    currency VARCHAR(3) NOT NULL,           -- 'AZN', 'USD', 'EUR'
    amount_in_azn DECIMAL(10, 2) NOT NULL,  -- Daxil edilmə anındakı məzənnəylə AZN qarşılığı
    is_delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. MALİYYƏ TRANZAKSİYALARI CƏDVƏLİ (GƏLİR VƏ XƏRCLƏR)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,                     -- Tranzaksiyanın baş verdiyi gün (Təqvim əlaqəsi)
    type VARCHAR(10) NOT NULL,              -- 'income' (Gəlir) və ya 'expense' (Xərc)
    amount DECIMAL(10, 2) NOT NULL,         -- Məbləğ
    currency VARCHAR(3) NOT NULL,           -- 'AZN', 'USD', 'EUR'
    amount_in_azn DECIMAL(10, 2) NOT NULL,  -- Sistem daxili AZN məzənnə qarşılığı
    description TEXT NOT NULL,              -- Səbəb, detal açıqlaması
    category VARCHAR(50) NOT NULL,          -- Kateqoriya (məs: Material, İcarə, İmplant Gəliri)
    job_id VARCHAR(50),                     -- Əgər müvafiq bir işlə bağlıdırsa FK
    FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL
);`;

  const drizzleSchema = `import { pgTable, text, varchar, timestamp, pgEnum, decimal, boolean, date } from "drizzle-orm/pg-core";

// İstifadəçi Rolları və Ödəniş Tipləri Enumu
export const roleEnum = pgEnum('user_role', ['dentist', 'technician']);
export const paymentStatusEnum = pgEnum('payment_status', ['paid', 'not_paid', 'partial']);

// 1. Users Cədvəli
export const users = pgTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  role: roleEnum('role').notNull(),
  clinicOrLab: varchar('clinic_or_lab', { length: 150 }),
  email: varchar('email', { length: 100 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Jobs (İşlər) Cədvəli
export const jobs = pgTable('jobs', {
  id: varchar('id', { length: 50 }).primaryKey(),
  patientName: varchar('patient_name', { length: 100 }).notNull(),
  providerName: varchar('provider_name', { length: 150 }).notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  deadline: timestamp('deadline').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('not_paid').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0.00'),
  currency: varchar('currency', { length: 3 }).notNull(), // 'AZN', 'USD', 'EUR'
  amountInAzn: decimal('amount_in_azn', { precision: 10, scale: 2 }).notNull(),
  isDelivered: boolean('is_delivered').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Transactions (Maliyyə gəlir/xərc tranzaksiyaları) Cədvəli
export const transactions = pgTable('transactions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  date: date('date').notNull(),
  type: text('type').$type<'income' | 'expense'>().notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  amountInAzn: decimal('amount_in_azn', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  jobId: varchar('job_id', { length: 50 }).references(() => jobs.id, { onDelete: 'cascade' }),
});`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6" id="db-schema-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-100 flex items-center gap-2">
            <Database className="text-teal-400" size={20} />
            Məlumat Bazası Arxitekturası (DB Schema)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Həkim və texniklərin maliyyə tranzaksiyalarının, iş statuslarının və qismən ödənişlərinin əlaqəli (Relational) saxlanması modeli.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setSelectedTable('jobs')}
            className={`px-3 py-1 bg-transparent rounded text-xs font-medium transition-colors ${
              selectedTable === 'jobs' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            JOBS (İşlər)
          </button>
          <button
            onClick={() => setSelectedTable('transactions')}
            className={`px-3 py-1 bg-transparent rounded text-xs font-medium transition-colors ${
              selectedTable === 'transactions' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            TRANSACTIONS (Maliyyə)
          </button>
          <button
            onClick={() => setSelectedTable('users')}
            className={`px-3 py-1 bg-transparent rounded text-xs font-medium transition-colors ${
              selectedTable === 'users' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            USERS (Şəxslər)
          </button>
        </div>
      </div>

      {/* Relational diagram helper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Table Schema Inspector Card */}
        <div className="lg:col-span-5 bg-slate-950 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 bg-slate-900 rounded border border-slate-800 text-teal-400">
              <Database size={14} />
            </span>
            <span className="text-xs font-mono font-bold text-slate-300">
              Cədvəl: {selectedTable.toUpperCase()}
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono ml-auto">
              Primary Key aktiv
            </span>
          </div>

          {selectedTable === 'jobs' && (
            <div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Bu cədvəl həkimlə texnik arasındakı ortopedik/terapevtik sifarişləri (Müqavilə statusunu, rəngi, istifadə olunan materialı) və işin təhvil tarixini tənzimləyir.
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-teal-200 font-medium">id</span>
                  <span className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                    <Key size={10} className="text-amber-500" /> VARCHAR(50) (PK)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">patient_name</span>
                  <span className="font-mono text-slate-500 text-[11px]">VARCHAR(100) (Xəstə adı)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">provider_name</span>
                  <span className="font-mono text-slate-500 text-[11px]">VARCHAR(150) (Lab/Həkim)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">status</span>
                  <span className="font-mono text-slate-500 text-[11px]">VARCHAR(50) (Rol dinamik)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">payment_status</span>
                  <span className="font-mono text-amber-400 text-[11px]">VARCHAR(20) (+, -, /)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">amount_in_azn</span>
                  <span className="font-mono text-slate-500 text-[11px]">DECIMAL(10,2) (Yekun)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-rose-300">deadline</span>
                  <span className="font-mono text-rose-500 text-[11px] flex items-center gap-1">
                    <ShieldAlert size={10} /> TIMESTAMP (Xəbərdarlıq)
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedTable === 'transactions' && (
            <div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Hər hansı bir günə daxil edilən gəlir/xərc tranzaksiyasını saxlayır. Tranzaksiyalar multi-valyuta dəstəklidir və əgər bir diş protez sifarişi ilə bağlıdırsa, `job_id` vasitəsilə həmin sifarişə bağlanır.
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-teal-200 font-medium">id</span>
                  <span className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                    <Key size={10} className="text-amber-500" /> VARCHAR(50) (PK)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-teal-300">job_id</span>
                  <span className="font-mono text-teal-500 text-[11px] flex items-center gap-1">
                    <Link2 size={10} /> {"VARCHAR(50) (FK -> JOBS)"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">type</span>
                  <span className="font-mono text-slate-500 text-[11px]">VARCHAR(10) (income / expense)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">amount</span>
                  <span className="font-mono text-slate-500 text-[11px]">DECIMAL(10,2) (Əsas tranzit)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">currency</span>
                  <span className="font-mono text-slate-500 text-[11px]">VARCHAR(3) (AZN, USD, EUR)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-emerald-400">amount_in_azn</span>
                  <span className="font-mono text-slate-500 text-[11px]">DECIMAL(10,2) (AZN hesabat üçün)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">category</span>
                  <span className="font-mono text-slate-500 text-[11px]">VARCHAR(50) (Məs: Material, İcarə)</span>
                </div>
              </div>
            </div>
          )}

          {selectedTable === 'users' && (
            <div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Tətbiqdən qeydiyyatdan keçən həkim və ya texnik profilləri. Bu profil seçiminə əsasən tətbiqin dizayn fərdiləşdirilməsi işləyir.
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-teal-200 font-medium">id</span>
                  <span className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                    <Key size={10} className="text-amber-500" /> VARCHAR(50) (PK)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">name</span>
                  <span className="font-mono text-slate-500 text-[11px]">VARCHAR(100) (Ad Soyad)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">role</span>
                  <span className="font-mono text-amber-400 text-[11px]">VARCHAR(20) (dentist / technician)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-mono text-slate-300">clinic_or_lab</span>
                  <span className="font-mono text-slate-500 text-[11px]">VARCHAR(150) (Məkan adı)</span>
                </div>
              </div>
            </div>
          )}

          {/* Relation flow visual text */}
          <div className="mt-4 p-3 bg-slate-900/40 rounded-lg border border-slate-800/50 flex items-center gap-2 text-[10px] text-slate-400 leading-relaxed">
            <span className="flex-shrink-0 text-amber-500">⚡</span>
            <span>
              <strong>Arxitektura üstünlüyü:</strong> Bir sifariş partial (qismən) ödəniləndə, mütəmadi olaraq fərqli günlərdə ona aid gəlirlər <em>transactions</em> cədvəlinə xarici açarla bağlanır.
            </span>
          </div>

        </div>

        {/* Database relational visualization */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 rounded-xl border border-slate-800 p-5 overflow-hidden">
          
          <div>
            <div className="flex items-center justify-between space-x-2 text-xs text-slate-400 border-b border-slate-800 pb-2 mb-4">
              <span className="uppercase font-bold tracking-wider text-[11px]">Relational Məntiq Vizualizasiyası</span>
              <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">Drizzle + SQLite</span>
            </div>

            <div className="space-y-4 relative">
              {/* Table User representation */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="font-mono text-[11px] text-slate-400 block border-b border-slate-800 pb-1 mb-1">Cədvəl: users</span>
                <div className="text-xs text-slate-300 font-mono grid grid-cols-2">
                  <span>🔑 id: varchar [PK]</span>
                  <span className="text-right text-slate-500">role: 'dentist' | 'technician'</span>
                </div>
              </div>

              {/* Connector line user to jobs */}
              <div className="w-1 h-3 bg-slate-800 ml-6" />

              {/* Table Jobs representation */}
              <div className={`p-3 border rounded-lg transition-colors duration-200 ${selectedTable === 'jobs' ? 'bg-teal-950/20 border-teal-500' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex justify-between border-b border-slate-800 pb-1 mb-1 items-center">
                  <span className="font-mono text-[11px] text-slate-400">Cədvəl: jobs (İşlər)</span>
                  <span className="text-[9px] bg-sky-950 text-sky-400 px-1 rounded uppercase tracking-widest text-[8px]">Təhvil və Ödəniş</span>
                </div>
                <div className="text-xs font-mono grid grid-cols-2 gap-y-1">
                  <span className="text-teal-200 font-bold">🔑 id: varchar [PK]</span>
                  <span className="text-right text-slate-400 text-[11px]">total_amount: decimal</span>
                  <span className="text-slate-300">status: varchar</span>
                  <span className="text-right text-amber-400 text-[11px]">payment_status: '+', '-', '/'</span>
                </div>
              </div>

              {/* Connector line jobs to transactions */}
              <div className="w-1 h-4 bg-slate-800 ml-12 relative">
                <div className="absolute top-1/2 left-0 w-3 h-1 bg-slate-800" />
                <span className="absolute left-4 top-0 text-[9px] font-mono text-slate-500 uppercase">1-ə Çox (1:N) Əlaqə</span>
              </div>

              {/* Table Transactions representation */}
              <div className={`p-3 border rounded-lg transition-colors duration-200 ${selectedTable === 'transactions' ? 'bg-teal-950/20 border-teal-500' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex justify-between border-b border-slate-800 pb-1 mb-1 items-center">
                  <span className="font-mono text-[11px] text-slate-400">Cədvəl: transactions (Gəlir/Xərc)</span>
                  <span className="text-[9px] text-amber-500 bg-amber-950/40 px-1 rounded uppercase tracking-widest text-[8px]">Təqvim Əlaqəsi</span>
                </div>
                <div className="text-xs font-mono grid grid-cols-2 gap-y-1">
                  <span className="text-slate-300">🔑 id: varchar [PK]</span>
                  <span className="text-right text-slate-400">amount_in_azn: decimal</span>
                  <span className="text-emerald-300">🔗 job_id: varchar [FK]</span>
                  <span className="text-right text-slate-500 text-[11px]">date: date (Təqvimə çıxış)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
            <span>Server Tərəfi: PostgreSQL dildə</span>
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono">
              <span>İşarələr:</span>
              <span className="text-green-500 bg-green-950/50 px-1.5 rounded font-bold" title="Tam ödənib">+</span>
              <span className="text-amber-500 bg-amber-950/50 px-1.5 rounded font-bold" title="Hissəli ödənib">/</span>
              <span className="text-red-500 bg-red-950/50 px-1.5 rounded font-bold" title="Ödənilməyib">-</span>
            </div>
          </div>

        </div>
      </div>

      {/* Code panel for actual SQL or Drizzle ORM */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        
        {/* Code header selection */}
        <div className="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode size={16} className="text-amber-400" />
            <span className="text-xs font-bold text-slate-200">Arxitektur Kod Faylları (SQL & TypeScript Drizzle ORM)</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(sqlSchema, 'sql')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
            >
              {copiedText === 'sql' ? (
                <>
                  <Check size={12} className="text-green-500 animate-bounce" />
                  Kopyalandı!
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Pure SQL kopyala
                </>
              )}
            </button>

            <button
              onClick={() => copyToClipboard(drizzleSchema, 'drizzle')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
            >
              {copiedText === 'drizzle' ? (
                <>
                  <Check size={12} className="text-green-500 animate-bounce" />
                  Kopyalandı!
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Drizzle TS kopyala
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic code viewer split of files */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto">
          
          {/* SQL Card */}
          <div className="p-4 bg-slate-950">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center justify-between">
              <span>Pure SQL DB (PostgreSQL / SQLite)</span>
              <span className="text-[10px] text-slate-600">ansi format</span>
            </div>
            <pre className="text-slate-300 selection:bg-slate-800 whitespace-pre">
              {sqlSchema}
            </pre>
          </div>

          {/* Drizzle ORM Card */}
          <div className="p-4 bg-slate-950">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center justify-between">
              <span>TypeScript Drizzle ORM Schema</span>
              <span className="text-[10px] text-teal-500">modern stack</span>
            </div>
            <pre className="text-slate-300 selection:bg-slate-800 whitespace-pre">
              {drizzleSchema}
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
}
