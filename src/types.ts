/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'dentist' | 'technician';

export interface CurrencyRate {
  usdToAzn: number;
  eurToAzn: number;
  lastUpdated: string;
}

export interface UserProfile {
  name: string;
  role: UserRole;
  clinicOrLab: string;
  email: string;
}

export type PaymentStatus = 'paid' | 'not_paid' | 'partial';

export interface Job {
  id: string;
  patientName: string;
  providerName: string; // dentist uses this for the technician, technician for the dentist
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD (delivery date)
  status: string; // Role-specific status string
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  currency: 'AZN' | 'USD' | 'EUR';
  amountInAzn: number;
  isDelivered: boolean; // helper to check if done
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  amount: number;
  currency: 'AZN' | 'USD' | 'EUR';
  amountInAzn: number;
  description: string;
  category: string;
  jobId?: string; // Optional reference to a specific job
}

export interface DbTableInfo {
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    constraints?: string;
    description: string;
  }[];
}
