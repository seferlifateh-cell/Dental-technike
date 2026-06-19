/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job, Transaction, CurrencyRate } from './types';

// Helper to calculate dynamic dates relative to today's date
const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DEFAULT_CURRENCY_RATES: CurrencyRate = {
  usdToAzn: 1.70,
  eurToAzn: 1.85,
  lastUpdated: getRelativeDate(0)
};

// Initial Dentist (Həkim) Jobs
export const INITIAL_DENTIST_JOBS: Job[] = [
  {
    id: 'job-1',
    patientName: 'Aysel Quliyeva',
    providerName: 'Elite Protez Laboratoriyası (Kənan Usta)',
    title: 'Zirkon Tac/Körpü (Dental Crown)',
    description: '14, 15 və 16 nömrəli dişlər üçün estetik zirkon qapaqların hazırlanması. Rəng: A2.',
    startDate: getRelativeDate(-6),
    deadline: getRelativeDate(1),
    status: 'Texnikdədi', // Dentist Workflows: "İş götürülüb", "Texnikdədi", "Davam edir", "İş hazırdır"
    paymentStatus: 'partial', // "/"
    totalAmount: 450,
    paidAmount: 200,
    currency: 'AZN',
    amountInAzn: 450,
    isDelivered: false
  },
  {
    id: 'job-2',
    patientName: 'Fuad Məmmədov',
    providerName: 'DiaDent Lab',
    title: 'İmplantüstü Keramika',
    description: 'Sol alt çənə 36 nömrəli diş üçün fərdi dayaq və keramika qapaq.',
    startDate: getRelativeDate(-8),
    deadline: getRelativeDate(-1), // Overdue because current date is today and is not ready
    status: 'Davam edir',
    paymentStatus: 'not_paid', // "-"
    totalAmount: 380,
    paidAmount: 0,
    currency: 'USD',
    amountInAzn: 646, // 380 * 1.70
    isDelivered: false
  },
  {
    id: 'job-3',
    patientName: 'Nərgiz Əliyeva',
    providerName: 'BioEstet Lab',
    title: 'Vinir (Veneers) - 6 ədəd',
    description: 'Üst ön dişlərə ultra-nazik şüşə-keramika vinirlərin hazırlanması. Rəng: BL1.',
    startDate: getRelativeDate(-13),
    deadline: getRelativeDate(-3),
    status: 'İş hazırdır',
    paymentStatus: 'paid', // "+"
    totalAmount: 1800,
    paidAmount: 1800,
    currency: 'EUR',
    amountInAzn: 3330, // 1800 * 1.85
    isDelivered: true
  },
  {
    id: 'job-4',
    patientName: 'Elnur Qasımov',
    providerName: 'Həkim özü (Sakin işi)',
    title: 'Basion plomblama və kanalların müalicəsi',
    description: 'Sağ üst 27 nömrəli dişin endodontik müalicəsi və kompozit bərpası.',
    startDate: getRelativeDate(0),
    deadline: getRelativeDate(0),
    status: 'İş hazırdır',
    paymentStatus: 'paid',
    totalAmount: 120,
    paidAmount: 120,
    currency: 'AZN',
    amountInAzn: 120,
    isDelivered: true
  }
];

// Initial Technician (Texnik) Jobs
export const INITIAL_TECHNICIAN_JOBS: Job[] = [
  {
    id: 'job-tech-1',
    patientName: 'Dr. Rauf Məmmədov (Modern Dent)',
    providerName: 'Xəstə: Leyla Rəsulova',
    title: 'Metal-Keramika Körpü (4 vahid)',
    description: '33-36 nömrəli dişlər. Arxa dayaq metal-keramika körpü hazırlanması. Rəng: A3.',
    startDate: getRelativeDate(-3),
    deadline: getRelativeDate(2),
    status: 'İş hazırlanır', // Tech Workflows: "İş gəlib", "İş hazırlanır", "Təhvil verilib"
    paymentStatus: 'partial', // "/"
    totalAmount: 160,
    paidAmount: 85,
    currency: 'AZN',
    amountInAzn: 160,
    isDelivered: false
  },
  {
    id: 'job-tech-2',
    patientName: 'Dr. Samirə Əliyeva (Estet Klinikası)',
    providerName: 'Xəstə: Elvin Sadıqov',
    title: 'Zirkon Anatomik Qapaq - 2 ədəd',
    description: '11 və 21 nömrəli dişlər üçün estetik yüksək translyusent zirkon.',
    startDate: getRelativeDate(-7),
    deadline: getRelativeDate(-2), // Overdue in progress!
    status: 'İş hazırlanır',
    paymentStatus: 'not_paid', // "-"
    totalAmount: 150,
    paidAmount: 0,
    currency: 'USD',
    amountInAzn: 255, // 150 * 1.7
    isDelivered: false
  },
  {
    id: 'job-tech-3',
    patientName: 'Dr. Vaqif Həsənov (DentArt)',
    providerName: 'Xəstə: Kamil Baxşəliyev',
    title: 'Bütöv Akril Protez (Üst çənə)',
    description: 'Tam dişsiz üst çənə üçün akrilik çıxan protez. Mumlu sınaq hissəsi uğurla keçdi.',
    startDate: getRelativeDate(-10),
    deadline: getRelativeDate(-4),
    status: 'Təhvil verilib',
    paymentStatus: 'paid', // "+"
    totalAmount: 220,
    paidAmount: 220,
    currency: 'AZN',
    amountInAzn: 220,
    isDelivered: true
  }
];

// Seed Transactions (both Income and Expense)
export const INITIAL_DENTIST_TRANSACTIONS: Transaction[] = [
  {
    id: 't-1',
    date: getRelativeDate(0),
    type: 'income',
    amount: 200,
    currency: 'AZN',
    amountInAzn: 200,
    description: 'Aysel Quliyeva - Zirkon tac beh ödənişi',
    category: 'Ortodontiya / Ortopediya',
    jobId: 'job-1'
  },
  {
    id: 't-2',
    date: getRelativeDate(0),
    type: 'expense',
    amount: 150,
    currency: 'USD',
    amountInAzn: 255,
    description: 'Almaniya istehsalı implant vintləri və dayaq dəstinin alınması',
    category: 'Material Xərcləri'
  },
  {
    id: 't-3',
    date: getRelativeDate(-1),
    type: 'expense',
    amount: 80,
    currency: 'AZN',
    amountInAzn: 80,
    description: 'Sterilizasiya mayeləri və birdəfəlik əlcək/maska tədarükü',
    category: 'Sərfiyyat Xərcləri'
  },
  {
    id: 't-4',
    date: getRelativeDate(-3),
    type: 'income',
    amount: 1800,
    currency: 'EUR',
    amountInAzn: 3330,
    description: 'Nərgiz Əliyeva - 6 ədəd Vinir tam ödəniş',
    category: 'Estetik Diş Həkimliyi',
    jobId: 'job-3'
  },
  {
    id: 't-5',
    date: getRelativeDate(-4),
    type: 'income',
    amount: 300,
    currency: 'AZN',
    amountInAzn: 300,
    description: 'Konsultasiya, rentgen və diş daşlarının təmizlənməsi (2 pasiyent)',
    category: 'Terapevtik Müalicə'
  },
  {
    id: 't-6',
    date: getRelativeDate(-8),
    type: 'expense',
    amount: 1500,
    currency: 'AZN',
    amountInAzn: 1500,
    description: 'Klinika icarə haqqı və kommunal xərclər (Aylıq sabit)',
    category: 'Ofis/Klinika Xərcləri'
  },
  {
    id: 't-7',
    date: getRelativeDate(-16),
    type: 'income',
    amount: 700,
    currency: 'USD',
    amountInAzn: 1190,
    description: 'İmplantat əməliyyatı - Dr. Rauf cərrahiyyə gəliri',
    category: 'Cərrahi Müdaxilə'
  }
];

export const INITIAL_TECHNICIAN_TRANSACTIONS: Transaction[] = [
  {
    id: 't-tech-1',
    date: getRelativeDate(0),
    type: 'income',
    amount: 85,
    currency: 'AZN',
    amountInAzn: 85,
    description: 'Tehsil alınan beh: Metal-keramika körpü (Dr. Rauf)',
    category: 'Metal-Keramika işləri',
    jobId: 'job-tech-1'
  },
  {
    id: 't-tech-2',
    date: getRelativeDate(-1),
    type: 'expense',
    amount: 120,
    currency: 'AZN',
    amountInAzn: 120,
    description: 'Alçı (super gips) və zirkon disklərin frezlənmə mayesi satın alınması',
    category: 'Laboratoriya Sərfiyyatı'
  },
  {
    id: 't-tech-3',
    date: getRelativeDate(-4),
    type: 'income',
    amount: 220,
    currency: 'AZN',
    amountInAzn: 220,
    description: 'Kamil Baxşəliyev - Akrilik protez tam ödəniş',
    category: 'Akril Protezlər',
    jobId: 'job-tech-3'
  },
  {
    id: 't-tech-4',
    date: getRelativeDate(-6),
    type: 'expense',
    amount: 200,
    currency: 'USD',
    amountInAzn: 340,
    description: 'CAD/CAM frez aparatının ucları (bur) dəsti - 5 ədəd',
    category: 'Avadanlıq/Alət Xərcləri'
  },
  {
    id: 't-tech-5',
    date: getRelativeDate(-13),
    type: 'income',
    amount: 500,
    currency: 'AZN',
    amountInAzn: 500,
    description: 'Dr. Vaqif Həsənov - Keçən aydan qalan zirkon borcu',
    category: 'Zirkon işləri'
  },
  {
    id: 't-tech-6',
    date: getRelativeDate(-17),
    type: 'expense',
    amount: 400,
    currency: 'AZN',
    amountInAzn: 400,
    description: 'Laboratoriya mütəxəssis köməkçisinin həftəlik maaşı',
    category: 'Maaşlar'
  }
];
