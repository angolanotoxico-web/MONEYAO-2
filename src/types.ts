export interface User {
  phone: string; // ID único (Número de telefone)
  name: string;
  passwordHash: string;
  inviteCode: string; // Código de convite usado para registrar
  myInviteCode: string; // Próprio código de convite para convidar outros (derivado do telefone)
  balance: number; // Saldo Disponível (Kwanza - Kz)
  totalInvested: number; // Total atualmente investido
  totalEarnings: number; // Lucros acumulados
  registeredAt: string; // ISO Date string
  status: 'active' | 'blocked';
  failedAttempts: number;
  lockoutUntil: string | null; // ISO Date string, null se não bloqueado
  referredBy: string | null; // ID (phone) de quem convidou
  role?: 'admin' | 'user'; // Nível de acesso ao sistema
}

export type ProductType = 'daily' | 'fixed_30' | 'fixed_60' | 'fixed_90';

export interface Investment {
  id: string;
  phone: string;
  productType: ProductType;
  productId: string; // AO1 a AO7, ou 'fixed_30', 'fixed_60', 'fixed_90'
  name: string;
  amount: number; // Valor investido
  dailyProfit: number; // Lucro diário prometido (Kz)
  totalProfitEarned: number; // Lucros já creditados
  createdAt: string; // ISO Date
  lastPayoutAt: string; // ISO Date da última vez que pagou lucro diário
  status: 'pending' | 'active' | 'paused' | 'matured';
  maturityAt: string | null; // ISO Date da data de vencimento (30, 60 ou 90 dias, ou null se vitalício/AO)
}

export interface Deposit {
  id: string;
  phone: string;
  amount: number;
  method: 'reference' | 'bank' | 'crypto';
  provider: string; // Unitel Money, PayPay, BAI, Standard Bank, BFA, BIC
  reference: string; // Número de referência ou IBAN do fundador
  receiptUrl: string; // URL fictícia ou comprovante em base64
  transactionId?: string; // ID da Transação do comprovativo (Nº de referência bancária)
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO Date
  processedAt?: string; // ISO Date de quando foi aprovado ou rejeitado
}

export interface Withdrawal {
  id: string;
  phone: string;
  amount: number; // Bruto (solicitado)
  fee?: number;   // Taxa de 15%
  netAmount?: number; // Líquido (a receber)
  bankName: string;
  accountHolder: string;
  iban: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO Date
  processedAt?: string;
}

export interface Commission {
  id: string;
  referrerPhone: string; // Quem ganhou a comissão
  referredPhone: string; // Quem gerou a comissão (quem se cadastrou)
  depositId: string; // Depósito que gerou a comissão
  level: 1 | 2 | 3;
  percentage: number; // 15%, 10%, 5%
  amount: number; // Valor ganho em Kz
  status: 'credited' | 'refunded';
  createdAt: string;
}

export interface ProfitLog {
  id: string;
  phone: string;
  investmentId: string;
  amount: number;
  createdAt: string;
}

export interface SecurityLog {
  id: string;
  phone: string | null;
  action: string; // ex: "LOGIN_SUCCESS", "LOGIN_FAILED", "USER_REGISTER", "DEPOSIT_APPROVED"
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface RecoveryRequest {
  id: string;
  phone: string;
  name: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  newPasswordTemp?: string; // Temporário se redefinido
}

// Configuração dos motores de investimento
export interface ProductConfig {
  id: string;
  name: string;
  aporte: number; // Valor de aporte em Kz
  dailyReturn: number; // Rendimento diário em Kz
  monthlyReturn: number; // Rendimento mensal calculado (30 dias)
  oneHundredDaysReturn: number; // Rendimento de 100 dias calculado
  annualReturn: number; // Rendimento anual calculado (365 dias)
}

export const PRODUCTS_AO_CONFIG: ProductConfig[] = [
  { id: 'AO1', name: 'AO1', aporte: 8000, dailyReturn: 600, monthlyReturn: 18000, oneHundredDaysReturn: 60000, annualReturn: 219000 },
  { id: 'AO2', name: 'AO2', aporte: 20000, dailyReturn: 2000, monthlyReturn: 60000, oneHundredDaysReturn: 200000, annualReturn: 730000 },
  { id: 'AO3', name: 'AO3', aporte: 55000, dailyReturn: 4300, monthlyReturn: 129000, oneHundredDaysReturn: 430000, annualReturn: 1569500 },
  { id: 'AO4', name: 'AO4', aporte: 150000, dailyReturn: 11000, monthlyReturn: 330000, oneHundredDaysReturn: 1100000, annualReturn: 4015000 },
  { id: 'AO5', name: 'AO5', aporte: 300000, dailyReturn: 24000, monthlyReturn: 720000, oneHundredDaysReturn: 2400000, annualReturn: 8760000 },
  { id: 'AO6', name: 'AO6', aporte: 500000, dailyReturn: 50000, monthlyReturn: 1500000, oneHundredDaysReturn: 5000000, annualReturn: 18250000 },
  { id: 'AO7', name: 'AO7', aporte: 1000000, dailyReturn: 100000, monthlyReturn: 3000000, oneHundredDaysReturn: 10000000, annualReturn: 36500000 }
];

export interface GiftCode {
  id: string;
  code: string;
  amount: number;
  maxUses: number;
  usesCount: number;
  usedBy: string[]; // telefones dos utilizadores que já usaram
  createdAt: string;
  createdBy: string;
  status: 'active' | 'inactive';
}

