import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, MessageCircle, Send, 
  HelpCircle, Sparkles, Building2, Upload, FileText, CheckCircle2, AlertCircle, Clock, ShieldCheck,
  Calculator, Coins, Copy, Smartphone, Download, Bell, BellRing, Gift, X, RefreshCw, Database, FolderOpen, Landmark,
  Crown, Award, RotateCw, Cpu, Wifi, CreditCard
} from 'lucide-react';
import { motion } from 'motion/react';
import { PRODUCTS_AO_CONFIG } from '../types.js';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AnimatedCounter } from './AnimatedCounter.tsx';
import { compressImage } from '../utils/imageCompressor.ts';

const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const isProj = payload[0].payload && 'lucroDiario' in payload[0].payload;
    return (
      <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-3 shadow-2xl text-xs font-mono space-y-1">
        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
          {isProj ? `Projeção: ${payload[0].payload.dia}` : payload[0].payload.dia}
        </p>
        <div>
          <span className="text-slate-500 text-[10px] block font-sans">
            {isProj ? 'Lucro Acumulado' : 'Rendimento Recebido'}:
          </span>
          <span className="text-emerald-400 font-extrabold text-sm">
            {payload[0].value.toLocaleString('pt-PT')} Kz
          </span>
        </div>
        {isProj && (
          <div className="border-t border-slate-800/80 pt-1 mt-1">
            <span className="text-slate-400 text-[10px] block font-sans">Lucro Diário Estimado:</span>
            <span className="text-white font-bold text-xs">
              {payload[0].payload.lucroDiario.toLocaleString('pt-PT')} Kz/dia
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
});

const StatCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl relative overflow-hidden animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <div className="h-4 w-4 rounded-full bg-slate-800" />
      <div className="h-3 w-28 rounded bg-slate-800" />
    </div>
    <div className="h-9 w-44 rounded bg-slate-800 mb-4" />
    <div className="h-3.5 w-32 rounded bg-slate-800" />
  </div>
);

const PlanSkeleton = () => (
  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-4 animate-pulse relative">
    <div className="absolute top-3 right-3 h-4 w-24 rounded bg-slate-800" />
    <div className="space-y-1.5">
      <div className="h-4 w-32 rounded bg-slate-800" />
      <div className="h-3 w-40 rounded bg-slate-800" />
    </div>
    <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-800/60 py-3">
      <div className="space-y-1.5">
        <div className="h-2 w-16 rounded bg-slate-800" />
        <div className="h-4 w-20 rounded bg-slate-800" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-16 rounded bg-slate-800" />
        <div className="h-4 w-20 rounded bg-slate-800" />
      </div>
    </div>
    <div className="flex justify-between items-center">
      <div className="h-3.5 w-24 rounded bg-slate-800" />
      <div className="h-3.5 w-16 rounded bg-slate-800" />
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="h-64 w-full flex flex-col justify-between bg-slate-950/40 rounded-xl border border-slate-800/80 p-4 animate-pulse">
    <div className="flex-1 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => {
        const heights = ["h-16", "h-32", "h-24", "h-44", "h-28", "h-36", "h-40"];
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className={`w-full max-w-[32px] bg-slate-800/60 rounded-t-md ${heights[i - 1]}`} />
          </div>
        );
      })}
    </div>
    <div className="flex justify-between border-t border-slate-800/80 pt-3 px-2">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="h-2 w-8 rounded bg-slate-800/60" />
      ))}
    </div>
  </div>
);

const TransactionsTableSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/20 animate-pulse">
    <div className="bg-slate-950/60 border-b border-slate-800 p-4 h-11 flex items-center justify-between">
      <div className="h-3 w-24 rounded bg-slate-800" />
      <div className="h-3 w-16 rounded bg-slate-800" />
    </div>
    <div className="p-4 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4 border-b border-slate-800/40 pb-3 last:border-0 last:pb-0">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-28 rounded bg-slate-800" />
            <div className="h-2.5 w-48 rounded bg-slate-800/70" />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="h-5 w-16 rounded bg-slate-800" />
            <div className="h-4 w-20 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface DashboardProps {
  userProfile: any;
  onActionComplete: () => void;
  simulatedTime: string;
  activeSection: 'overview' | 'invest' | 'fixed_funds' | 'funds' | 'withdraw' | 'history' | 'cards';
}

function Dashboard({ userProfile, onActionComplete, simulatedTime, activeSection }: DashboardProps) {
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // CARD STATES
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<'multicaixa_virtual' | 'visa_virtual' | 'visa_physical'>('multicaixa_virtual');
  const [customCardHolder, setCustomCardHolder] = useState('');
  const [isRequestingCard, setIsRequestingCard] = useState(false);
  const [cardRequestSuccess, setCardRequestSuccess] = useState<string | null>(null);

  // GIFT REDEEM STATE
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCodeInput) return;
    setRedeemLoading(true);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      const res = await fetch('/api/user/redeem-gift-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone,
          code: giftCodeInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemSuccess(data.message);
        onActionComplete();
      } else {
        setRedeemError(data.error || 'Erro ao resgatar o código.');
      }
    } catch (err) {
      console.error(err);
      setRedeemError('Erro de conexão ao servidor.');
    } finally {
      setRedeemLoading(false);
    }
  };

  // DEPOSIT STATE
  const [depositAmount, setDepositAmount] = useState('8000');
  const [selectedMethod, setSelectedMethod] = useState<'reference' | 'bank' | 'crypto'>('reference');
  const [selectedProvider, setSelectedProvider] = useState('Unitel Money');
  const [receiptName, setReceiptName] = useState('');
  const [receiptBase64, setReceiptBase64] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Validador de ID da Transação / Referência de bancos angolanos
  const validateTransactionId = (id: string, provider: string, method: string) => {
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) {
      return { isValid: false, errorMsg: 'O ID da transação é obrigatório.', formatExample: '' };
    }

    if (method === 'crypto') {
      const cryptoRegex = /^[A-Z0-9]{8,64}$/i;
      if (!cryptoRegex.test(cleanId)) {
        return { 
          isValid: false, 
          errorMsg: 'ID de transação inválido para Cripto. Deve conter entre 8 a 64 caracteres alfanuméricos.',
          formatExample: 'Exemplo: TX98273645HBA2 ou Hash da blockchain'
        };
      }
      return { isValid: true, formatExample: 'Formato verificado com sucesso.' };
    }

    if (provider === 'BFA') {
      const bfaRegex = /^(FT\d{10,12}|\d{10,16})$/i;
      if (!bfaRegex.test(cleanId)) {
        return {
          isValid: false,
          errorMsg: 'ID de transação inválido para o Banco BFA. Deve iniciar com FT seguido de 10-12 dígitos ou conter de 10-16 números.',
          formatExample: 'Exemplo: FT2607051234 ou 202610293847'
        };
      }
    } else if (provider === 'BAI') {
      const baiRegex = /^(REF\d{9,13}|BAI\d{8,12}|\d{10,16})$/i;
      if (!baiRegex.test(cleanId)) {
        return {
          isValid: false,
          errorMsg: 'ID de transação inválido para o Banco BAI. Deve iniciar com REF, BAI ou ser uma sequência de 10-16 números.',
          formatExample: 'Exemplo: REF9876543210 ou 1048293029182'
        };
      }
    } else if (provider === 'Unitel Money') {
      const unitelRegex = /^(UM-)?[A-Z0-9]{8,14}$/i;
      if (!unitelRegex.test(cleanId)) {
        return {
          isValid: false,
          errorMsg: 'ID de transação inválido para Unitel Money. Deve conter de 8 a 14 caracteres alfanuméricos.',
          formatExample: 'Exemplo: UM-48293847 ou 94827384'
        };
      }
    } else if (provider === 'PayPay') {
      const paypayRegex = /^(PP-)?[A-Z0-9]{8,14}$/i;
      if (!paypayRegex.test(cleanId)) {
        return {
          isValid: false,
          errorMsg: 'ID de transação inválido para PayPay. Deve conter de 8 a 14 caracteres alfanuméricos.',
          formatExample: 'Exemplo: PP-92837482 ou 19283748'
        };
      }
    } else {
      const generalRegex = /^[A-Z0-9.\-\/]{8,24}$/i;
      if (!generalRegex.test(cleanId)) {
        return {
          isValid: false,
          errorMsg: 'ID de Transação inválido. Deve ter entre 8 a 24 caracteres contendo apenas letras, números, pontos ou hífens.',
          formatExample: 'Exemplo: 987654321, 2026.07.05.123'
        };
      }
    }

    return { isValid: true, formatExample: 'Formato verificado com sucesso.' };
  };



  // WITHDRAW STATE
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('BAI');
  const [accountHolder, setAccountHolder] = useState(userProfile?.user?.name || '');
  const [iban, setIban] = useState('');

  // FIXED TERM INVESTMENT STATE
  const [fixedTermAmount, setFixedTermAmount] = useState('50000');
  const [selectedFundDuration, setSelectedFundDuration] = useState<'fixed_30' | 'fixed_60' | 'fixed_90'>('fixed_30');

  // INVESTMENT SIMULATOR STATE
  const [simulatorProductId, setSimulatorProductId] = useState('AO1');
  const [simulatorDays, setSimulatorDays] = useState(30);

  // DOWNLOAD APP HANDLER
  const handleDownloadApp = async () => {
    try {
      setError(null);
      setSuccess(null);
      const link = document.createElement('a');
      link.href = '/api/app/download';
      link.download = 'MoneyAO_v1.0.4.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Download iniciado! O aplicativo oficial "MoneyAO_v1.0.4.apk" (12.4 MB) está sendo descarregado. Se solicitado, ative a opção de instalar fontes desconhecidas para concluir a instalação no seu Android de forma totalmente segura.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Ocorreu um erro ao processar o descarregamento do aplicativo oficial.');
    }
  };

  // Helpers
  const user = useMemo(() => {
    return {
      balance: 0,
      totalInvested: 0,
      totalEarnings: 0,
      phone: '',
      name: '',
      role: 'user',
      ...(userProfile?.user || {})
    };
  }, [userProfile?.user]);

  const investments = useMemo(() => userProfile?.investments || [], [userProfile?.investments]);
  const totalCommission = useMemo(() => userProfile?.totalCommissionEarned || 0, [userProfile?.totalCommissionEarned]);

  useEffect(() => {
    if (user.name && !customCardHolder) {
      setCustomCardHolder(user.name);
    }
  }, [user.name, customCardHolder]);

  // Verificar se o dia simulado é sábado ou domingo em Angola (UTC+1)
  const isAngolaWeekend = useMemo(() => {
    if (!simulatedTime) return false;
    try {
      const d = new Date(simulatedTime);
      // Angola está em WAT (UTC+1), adicionamos 1 hora ao tempo UTC antes de chamar getUTCDay()
      const angolaDay = new Date(d.getTime() + 1 * 60 * 60 * 1000).getUTCDay();
      return angolaDay === 0 || angolaDay === 6; // 0 = Domingo, 6 = Sábado
    } catch (e) {
      return false;
    }
  }, [simulatedTime]);

  const currentFundConfig = useMemo(() => {
    const rates: Record<string, { rate: number; label: string; receiveMultiplier: number }> = {
      fixed_30: { rate: 1.0, label: '100%', receiveMultiplier: 2.0 },
      fixed_60: { rate: 1.5, label: '150%', receiveMultiplier: 2.5 },
      fixed_90: { rate: 2.0, label: '200%', receiveMultiplier: 3.0 },
    };
    return rates[selectedFundDuration] || rates.fixed_30;
  }, [selectedFundDuration]);

  const membershipTier = useMemo(() => {
    const totalInvested = user.totalInvested || 0;
    
    let tierInfo;
    if (totalInvested >= 1500000) {
      tierInfo = {
        id: 'platinum',
        name: 'Platinum',
        color: 'from-purple-500 via-indigo-500 to-cyan-500',
        textColor: 'text-purple-400',
        borderColor: 'border-purple-500/30',
        bgColor: 'bg-purple-500/10',
        bgGradient: 'from-purple-500/15 to-indigo-500/5',
        glowColor: 'shadow-purple-500/20',
        textGradient: 'bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent',
        nextTier: null,
        min: 1500000,
        icon: 'platinum'
      };
    } else if (totalInvested >= 500000) {
      tierInfo = {
        id: 'gold',
        name: 'Gold',
        color: 'from-amber-400 to-yellow-600',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        bgColor: 'bg-amber-500/10',
        bgGradient: 'from-amber-500/15 to-yellow-500/5',
        glowColor: 'shadow-amber-500/20',
        textGradient: 'bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent',
        nextTier: { name: 'Platinum', threshold: 1500000 },
        min: 500000,
        icon: 'gold'
      };
    } else if (totalInvested >= 100000) {
      tierInfo = {
        id: 'silver',
        name: 'Prata',
        color: 'from-slate-300 to-slate-500',
        textColor: 'text-slate-300',
        borderColor: 'border-slate-400/30',
        bgColor: 'bg-slate-400/10',
        bgGradient: 'from-slate-500/15 to-slate-400/5',
        glowColor: 'shadow-slate-400/10',
        textGradient: 'bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent',
        nextTier: { name: 'Gold', threshold: 500000 },
        min: 100000,
        icon: 'silver'
      };
    } else {
      tierInfo = {
        id: 'bronze',
        name: 'Bronze',
        color: 'from-orange-600 to-amber-700',
        textColor: 'text-orange-400',
        borderColor: 'border-orange-500/20',
        bgColor: 'bg-orange-500/5',
        bgGradient: 'from-orange-500/10 to-amber-500/2',
        glowColor: 'shadow-orange-500/5',
        textGradient: 'bg-gradient-to-r from-orange-400 to-amber-600 bg-clip-text text-transparent',
        nextTier: { name: 'Prata', threshold: 100000 },
        min: 0,
        icon: 'bronze'
      };
    }

    // Calcular progresso
    let progressPercent = 100;
    let neededForNext = 0;
    if (tierInfo.nextTier) {
      const nextThreshold = tierInfo.nextTier.threshold;
      const currentMin = tierInfo.min;
      const range = nextThreshold - currentMin;
      if (range > 0) {
        progressPercent = Math.min(100, Math.max(0, ((totalInvested - currentMin) / range) * 100));
        neededForNext = Math.max(0, nextThreshold - totalInvested);
      }
    }

    return {
      ...tierInfo,
      progressPercent,
      neededForNext
    };
  }, [user.totalInvested]);

  // --- CHART STATES FOR RENDIMENTOS (LAST 7 DAYS) ---
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [useBackupChart, setUseBackupChart] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user.phone) return;
      try {
        setLoadingChart(true);
        const res = await fetch(`/api/user/transactions/${user.phone}`);
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setRawTransactions(data.transactions || []);
        } else {
          throw new Error('Resposta do servidor não é um JSON válido');
        }
      } catch (err) {
        console.error('Erro ao buscar transações para o gráfico:', err);
      } finally {
        setLoadingChart(false);
      }
    };

    fetchTransactions();
  }, [user.phone, userProfile]);

  // Cálculos de transações diárias memorizados com useMemo
  const chartData = useMemo(() => {
    if (rawTransactions.length === 0) return [];

    // Filtra apenas transações de rendimento
    const rendimentos = rawTransactions.filter((t: any) => t.type === 'RENDIMENTO');

    // Determinar a data de referência (baseada em simulatedTime ou data atual)
    let refDate = new Date();
    if (simulatedTime) {
      const parsed = Date.parse(simulatedTime);
      if (!isNaN(parsed)) {
        refDate = new Date(parsed);
      }
    }

    // Últimos 7 dias em ordem cronológica (de 6 dias atrás até hoje)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(refDate);
      d.setDate(refDate.getDate() - i);
      days.push(d);
    }

    return days.map((day) => {
      // Formata o dia como "04/Jul"
      const dateStr = day.toLocaleDateString('pt-AO', { 
        day: '2-digit', 
        month: 'short', 
        timeZone: 'Africa/Luanda' 
      }).replace('.', ''); // Ex: "04 Jul"
      
      // Soma todos os rendimentos ocorridos neste dia
      const daySum = rendimentos
        .filter((t: any) => {
          const txDate = new Date(t.createdAt);
          return txDate.getDate() === day.getDate() &&
                 txDate.getMonth() === day.getMonth() &&
                 txDate.getFullYear() === day.getFullYear();
        })
        .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

      return {
        dia: dateStr,
        rendimento: daySum
      };
    });
  }, [rawTransactions, simulatedTime]);

  const chartStats = useMemo(() => {
    if (chartData.length === 0) return { total: 0, avg: 0, max: 0 };
    const total = chartData.reduce((acc, curr) => acc + curr.rendimento, 0);
    const avg = total / chartData.length;
    const max = Math.max(...chartData.map(d => d.rendimento), 0);
    return { total, avg, max };
  }, [chartData]);

  // --- CHART PROJECTION STATES & CALCULATIONS (NEXT 30 DAYS) ---
  const [chartViewMode, setChartViewMode] = useState<'history' | 'projection'>('history');

  const projectionData = useMemo(() => {
    // Apenas investimentos ativos do utilizador
    const activeInvestments = investments.filter((inv: any) => inv.status === 'active');
    
    // Calcular rendimento diário total acumulado dos investimentos ativos
    let dailyProfitRate = 0;
    activeInvestments.forEach((inv: any) => {
      if (inv.productType === 'daily') {
        dailyProfitRate += Number(inv.dailyProfit || 0);
      } else if (inv.productType && inv.productType.startsWith('fixed_')) {
        // Para fundos a prazo, vamos projetar o rendimento proporcional diário (100% de lucro acumulado sobre 30, 60 ou 90 dias)
        const days = inv.productType === 'fixed_30' ? 30 : inv.productType === 'fixed_60' ? 60 : 90;
        const dailyRate = Number(inv.amount || 0) / days;
        dailyProfitRate += dailyRate;
      }
    });

    if (activeInvestments.length === 0 || dailyProfitRate === 0) {
      return [];
    }

    // Gerar projeção acumulada para os próximos 30 dias
    let cumulativeProfit = 0;
    const data = [];
    
    let refDate = new Date();
    if (simulatedTime) {
      const parsed = Date.parse(simulatedTime);
      if (!isNaN(parsed)) {
        refDate = new Date(parsed);
      }
    }

    for (let i = 1; i <= 30; i++) {
      const nextDay = new Date(refDate);
      nextDay.setDate(refDate.getDate() + i);
      
      cumulativeProfit += dailyProfitRate;
      
      const dateStr = nextDay.toLocaleDateString('pt-AO', {
        day: '2-digit',
        month: 'short',
        timeZone: 'Africa/Luanda'
      }).replace('.', '');

      data.push({
        dia: dateStr,
        rendimento: Math.round(cumulativeProfit), // rendimento é o valor mapeado na Area (reutiliza o mesmo dataKey para desenhar)
        lucroDiario: Math.round(dailyProfitRate)
      });
    }

    return data;
  }, [investments, simulatedTime]);

  const projectionStats = useMemo(() => {
    if (projectionData.length === 0) return { total: 0, dailyRate: 0 };
    const total = projectionData[projectionData.length - 1].rendimento;
    const dailyRate = projectionData[0].lucroDiario;
    return { total, dailyRate };
  }, [projectionData]);

  // Cálculos do simulador de investimentos
  const selectedSimProduct = PRODUCTS_AO_CONFIG.find(p => p.id === simulatorProductId) || PRODUCTS_AO_CONFIG[0];
  const simulatedProfit = selectedSimProduct.dailyReturn * simulatorDays;
  const simulatedTotalReturn = selectedSimProduct.aporte + simulatedProfit;
  const simulatedRoi = ((simulatedProfit / selectedSimProduct.aporte) * 100).toFixed(0);

  // Renderizar método ou referência de pagamento do fundador
  const getReferenceDetails = () => {
    if (selectedMethod === 'crypto') {
      return { titular: 'RedotPay', rede: 'Tron(TRC20)', endereco: 'TQJJzxfr3J9t9EazaXzc7s1UAfrytkSwXX', minimo: '1.00 TRX' };
    }
    if (selectedMethod === 'reference') {
      if (selectedProvider === 'Unitel Money') {
        return { entidade: '00930', referencias: ['922555026', '927828070'], titular: 'LUIS CALEMBELA (Fundador)' };
      } else {
        return { entidade: '10116', referencias: ['922555026', '927828070'], titular: 'LUIS CALEMBELA (Fundador)' };
      }
    } else {
      switch (selectedProvider) {
        case 'BAI':
          return { titular: 'LUIS CALEMBELA', iban: '004000007498277510227' };
        case 'Standard Bank':
          return { titular: 'LUIS CALEMBELA', iban: '0060 0146 0100 3814 84013' };
        case 'BFA':
          return { titular: 'LUIS CALEMBELA', iban: '000600003345197230118' };
        case 'BIC':
        default:
          return { titular: 'LUIS CALEMBELA', iban: '005100002625994110119' };
      }
    }
  };

  // Simular Upload de Ficheiro com Compressão de Alto Desempenho
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      try {
        setLoading(true);
        const compressedBase64 = await compressImage(file);
        setReceiptBase64(compressedBase64);
      } catch (err: any) {
        console.error('Erro ao processar imagem:', err);
        setError('Falha ao otimizar e ler o comprovativo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('TQJJzxfr3J9t9EazaXzc7s1UAfrytkSwXX');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Enviar Depósito
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDepositSuccessMsg(null);
    setLoading(true);

    const refDetails = getReferenceDetails();
    const referenceValue = selectedMethod === 'reference' 
      ? ((refDetails as any).referencias ? (refDetails as any).referencias.join(' / ') : (refDetails as any).referencia)
      : (selectedMethod === 'crypto' ? (refDetails as any).endereco : (refDetails as any).iban!);

    try {
      if (!transactionId.trim()) {
        throw new Error('Por favor, informe o ID de Transação bancária presente no seu comprovante.');
      }

      const validation = validateTransactionId(transactionId, selectedProvider, selectedMethod);
      if (!validation.isValid) {
        throw new Error(validation.errorMsg);
      }

      if (!receiptName) {
        throw new Error('É obrigatório fazer o upload do ficheiro do comprovativo de pagamento (Imagem ou PDF).');
      }

      const res = await fetch('/api/deposits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone,
          amount: Number(depositAmount),
          method: selectedMethod,
          provider: selectedProvider,
          reference: referenceValue,
          receiptUrl: receiptBase64 || receiptName,
          transactionId: transactionId.trim().toUpperCase()
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar comprovativo.');
      }

      // Redirecionamento/Exibição de mensagem exata solicitada pelo usuário
      setDepositSuccessMsg(data.message);
      setReceiptName('');
      setReceiptBase64('');
      setTransactionId('');
      onActionComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Realizar Investimento (AO ou 90 dias)
  const handleInvestSubmit = async (productId: string, amountToInvest?: number) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/investments/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone,
          productId,
          amount: amountToInvest
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao comprar plano.');
      }

      setSuccess(data.message);
      onActionComplete();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Solicitar Levantamento (Saque)
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/withdrawals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone,
          amount: Number(withdrawAmount),
          bankName,
          accountHolder,
          iban
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao solicitar levantamento.');
      }

      setSuccess(data.message);
      setWithdrawAmount('');
      setIban('');
      onActionComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refDetails = getReferenceDetails();

  const showBalance = activeSection === 'overview' || activeSection === 'withdraw';

  return (
    <div id="dashboard-core" className="space-y-8 font-sans">
      {/* 2️⃣ Dashboard Principal - Indicadores em Ecrã */}
      <div className={`grid grid-cols-1 ${showBalance ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        {!userProfile ? (
          <>
            {showBalance && <StatCardSkeleton />}
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Saldo Disponível */}
            {showBalance && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 opacity-10">
                  <Wallet className="h-16 w-16 text-emerald-400" />
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Wallet className="h-4 w-4 text-emerald-400" /> SALDO DISPONÍVEL
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight font-sans">
                  <AnimatedCounter value={user.balance || 0} /> <span className="text-emerald-400 text-xl font-semibold">Kz</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-mono">
                  ID único de conta: +244 {user.phone}
                </p>
                <button
                  onClick={() => setShowRedeemModal(true)}
                  className="mt-3 w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 font-bold py-2 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Gift className="h-4 w-4" /> Resgatar Código de Presente
                </button>
              </motion.div>
            )}

            {/* Lucros Acumulados */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl relative overflow-hidden"
            >
              <div className="absolute right-3 top-3 opacity-10">
                <TrendingUp className="h-16 w-16 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" /> LUCROS DIÁRIOS ACUMULADOS
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight font-sans">
                {(user.totalEarnings || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} <span className="text-emerald-400 text-xl font-semibold">Kz</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                <span>Bónus de Rede de Afiliados:</span>
                <span className="font-bold text-emerald-400">{totalCommission.toLocaleString()} Kz</span>
              </div>
            </motion.div>

            {/* Total Atualmente Investido */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl relative overflow-hidden"
            >
              <div className="absolute right-3 top-3 opacity-10">
                <Sparkles className="h-16 w-16 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="h-4 w-4 text-emerald-400" /> TOTAL ATUALMENTE INVESTIDO
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight font-sans">
                {(user.totalInvested || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} <span className="text-emerald-400 text-xl font-semibold">Kz</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Planos AO: {investments.filter((i: any) => i.productType === 'daily').length} | Longo Prazo: {investments.filter((i: any) => i.productType && i.productType.startsWith('fixed_')).length}
              </p>
            </motion.div>
          </>
        )}
      </div>

      {/* FEEDBACK FEED */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      {/* SEÇÃO PRINCIPAL DINÂMICA */}
      
      {/* 1. OVERVIEW (VITRINE DE PRODUTOS E SUPORTE) */}
      {activeSection === 'overview' && (
        <div className="space-y-8">
          {/* Download do Aplicativo */}
          <div className="grid grid-cols-1 gap-4">
            <div 
              onClick={handleDownloadApp}
              className="flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/15 p-4 text-emerald-400 transition-all shadow-md cursor-pointer group"
            >
              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 group-hover:scale-110 transition-transform">
                <Smartphone className="h-5 w-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">APLICATIVO ANDROID</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors">Baixar Aplicativo Oficial</span>
                  <Download className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">Clique aqui para descarregar o ficheiro APK (v1.0.4, 12.4 MB)</p>
              </div>
            </div>
          </div>

          {/* Produtos em Detalhe */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white tracking-tight">Os Seus Planos Ativos</h3>
            </div>
            
            {!userProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <PlanSkeleton />
                <PlanSkeleton />
                <PlanSkeleton />
              </div>
            ) : investments.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-8 text-center text-slate-500 text-xs">
                Ainda não possui investimentos ativos. Adquira o seu primeiro produto na página de <span className="text-emerald-400 font-semibold">Investimentos</span>!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {investments.map((inv: any) => (
                  <div key={inv.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3 font-sans relative">
                    <span className={`absolute top-3 right-3 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      inv.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      inv.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                      'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {inv.status === 'pending' ? 'AGUARDANDO ATIVAÇÃO' : inv.status.toUpperCase()}
                    </span>
                    <div>
                      <h4 className="font-bold text-white">{inv.name}</h4>
                      <p className="text-[10px] text-slate-500">Adquirido em: {new Date(inv.createdAt).toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' })}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-800 py-2.5 my-2">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-semibold">Capital Alocado</span>
                        <span className="text-sm font-bold text-white font-mono">{inv.amount.toLocaleString()} Kz</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-semibold">Lucro Diário</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {inv.productType === 'daily' 
                            ? `${inv.dailyProfit.toLocaleString()} Kz` 
                            : `${inv.productType === 'fixed_30' ? '30' : inv.productType === 'fixed_60' ? '60' : '90'} dias acumulado`}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Total já creditado:</span>
                      <span className="font-bold text-white font-mono">{inv.totalProfitEarned.toLocaleString()} Kz</span>
                    </div>
                    {inv.productType && inv.productType.startsWith('fixed_') && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-950 p-2 rounded">
                        <Clock className="h-3 w-3 text-amber-400" /> Capital e Lucros trancados até: {inv.maturityAt ? new Date(inv.maturityAt).toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' }) : '---'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HISTÓRICO DE RENDIMENTOS E PROJEÇÕES FUTURAS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 md:p-6 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Desempenho e Projeção Financeira</h3>
                    <p className="text-xs text-slate-400">
                      {chartViewMode === 'history' 
                        ? 'Evolução real dos lucros diários libertados na sua carteira de investimentos.' 
                        : 'Projeção de crescimento acumulado esperado para os próximos 30 dias com base nos ativos ativos.'}
                    </p>
                  </div>
                </div>

                {/* Seletores premium de visualização */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setChartViewMode('history')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        chartViewMode === 'history'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Histórico (7 dias)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode('projection')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        chartViewMode === 'projection'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Projeção (30 dias)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUseBackupChart(!useBackupChart)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                      useBackupChart
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                    title="Alternar para visualização alternativa ultra-estável em caso de erros gráficos"
                  >
                    <Database className="h-3.5 w-3.5" />
                    {useBackupChart ? 'Modo de Backup Ativo' : 'Ativar Modo de Backup (Gráfico Seguro)'}
                  </button>
                </div>
              </div>

              {/* Estatísticas dinâmicas baseadas no modo de exibição */}
              {chartViewMode === 'history' ? (
                <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 self-start lg:self-center">
                  <div className="text-center md:text-left">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total (7d)</span>
                    <span className="text-xs font-extrabold text-emerald-400 font-mono">{chartStats.total.toLocaleString()} Kz</span>
                  </div>
                  <div className="text-center md:text-left border-l border-slate-800 pl-3">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Média Diária</span>
                    <span className="text-xs font-extrabold text-white font-mono">{Math.round(chartStats.avg).toLocaleString()} Kz</span>
                  </div>
                  <div className="text-center md:text-left border-l border-slate-800 pl-3">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pico Máximo</span>
                    <span className="text-xs font-extrabold text-white font-mono">{chartStats.max.toLocaleString()} Kz</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 self-start lg:self-center">
                  <div className="text-center md:text-left min-w-[100px]">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Lucro Estimado (30d)</span>
                    <span className="text-xs font-extrabold text-emerald-400 font-mono">+{projectionStats.total.toLocaleString()} Kz</span>
                  </div>
                  <div className="text-center md:text-left border-l border-slate-800 pl-4 min-w-[100px]">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Taxa de Ganho Diária</span>
                    <span className="text-xs font-extrabold text-white font-mono">{projectionStats.dailyRate.toLocaleString()} Kz/dia</span>
                  </div>
                </div>
              )}
            </div>

            {chartViewMode === 'history' ? (
              /* HISTÓRICO DE RENDIMENTOS DE 7 DIAS */
              loadingChart ? (
                <ChartSkeleton />
              ) : chartData.length === 0 || chartStats.total === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center rounded-xl bg-slate-950/30 border border-slate-800/80 p-6 space-y-2">
                  <span className="text-slate-500 text-xs">Sem rendimentos registrados nos últimos 7 dias.</span>
                  <p className="text-[11px] text-slate-600 max-w-xs">Os juros são libertados automaticamente a cada 24 horas após a ativação dos planos de investimento.</p>
                </div>
              ) : useBackupChart ? (
                /* BACKUP CHART 7 DAYS (PURE CSS ULTRA-RELIABLE BAR CHART) */
                <div className="h-64 w-full flex flex-col justify-between bg-slate-950/40 rounded-xl border border-slate-800 p-4">
                  <div className="flex-1 flex items-end justify-between gap-2 pt-2 pb-1 px-2">
                    {chartData.map((d: any, idx: number) => {
                      const maxVal = chartStats.max || 1;
                      const percent = Math.min(100, Math.max(8, (d.rendimento / maxVal) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-2 bg-slate-950 border border-emerald-500/30 rounded-lg p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 text-center min-w-[100px] text-[10px] font-mono">
                            <p className="text-slate-400 font-bold">{d.dia}</p>
                            <p className="text-emerald-400 font-extrabold">{d.rendimento.toLocaleString('pt-PT')} Kz</p>
                          </div>
                          {/* The Bar */}
                          <div 
                            style={{ height: `${percent}%` }}
                            className="w-full max-w-[36px] bg-gradient-to-t from-emerald-500/10 to-emerald-500 rounded-t-md border-t border-x border-emerald-400/40 group-hover:to-emerald-400 group-hover:from-emerald-500/20 transition-all duration-300 relative shadow-lg shadow-emerald-500/5"
                          >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 rounded-t-md"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* XAxis labels */}
                  <div className="flex justify-between border-t border-slate-800/80 pt-2 px-2 text-[10px] text-slate-500 font-mono">
                    {chartData.map((d: any, idx: number) => (
                      <span key={idx} className="w-full text-center truncate">{d.dia}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRendimento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} vertical={false} />
                      <XAxis 
                        dataKey="dia" 
                        stroke="#64748b" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value.toLocaleString()} Kz`}
                        dx={-5}
                      />
                      <Tooltip 
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rendimento" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRendimento)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
            ) : (
              /* PROJEÇÃO DE RENDIMENTOS DE 30 DIAS */
              projectionData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center rounded-xl bg-slate-950/30 border border-slate-800/80 p-6 space-y-2.5">
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="text-white text-xs font-bold">Sem investimentos ativos para projetar</span>
                  <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                    A sua carteira atual não possui planos de rentabilidade ativos ou os planos adquiridos ainda aguardam ativação pela administração. Adquira pacotes no menu <span className="text-emerald-400 font-semibold">Investimentos</span> para projetar o crescimento futuro da sua conta!
                  </p>
                </div>
              ) : useBackupChart ? (
                /* BACKUP CHART 30 DAYS (PURE CSS ULTRA-RELIABLE WAVE BAR CHART) */
                <div className="h-64 w-full flex flex-col justify-between bg-slate-950/40 rounded-xl border border-slate-800 p-4">
                  <div className="flex-1 flex items-end justify-between gap-[2px] md:gap-1 pt-2 pb-1 px-1 overflow-x-auto select-none scrollbar-thin">
                    {projectionData.map((d: any, idx: number) => {
                      const projMax = projectionData[projectionData.length - 1]?.rendimento || 1;
                      const percent = Math.min(100, Math.max(5, (d.rendimento / projMax) * 100));
                      const isMilestone = idx === 0 || idx === 9 || idx === 19 || idx === 29;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[6px]">
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-2 bg-slate-950 border border-emerald-500/30 rounded-lg p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 text-center min-w-[120px] text-[10px] font-mono">
                            <p className="text-slate-400 font-bold">Dia {idx + 1} ({d.dia})</p>
                            <p className="text-emerald-400 font-extrabold">{d.rendimento.toLocaleString('pt-PT')} Kz</p>
                            <p className="text-slate-500 text-[9px]">Lucro Diário: {d.lucroDiario.toLocaleString('pt-PT')} Kz</p>
                          </div>
                          {/* The Bar */}
                          <div 
                            style={{ height: `${percent}%` }}
                            className={`w-full rounded-t-sm transition-all duration-300 relative ${
                              isMilestone 
                                ? 'bg-gradient-to-t from-emerald-500/20 to-emerald-400 border-t border-emerald-300/60' 
                                : 'bg-emerald-500/40 group-hover:bg-emerald-400'
                            }`}
                          >
                            {isMilestone && (
                              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-1 w-1 bg-emerald-300 rounded-full animate-ping"></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* XAxis labels for milestones */}
                  <div className="flex justify-between border-t border-slate-800/80 pt-2 px-1 text-[9px] text-slate-500 font-mono">
                    <span>Início</span>
                    <span>Dia 10</span>
                    <span>Dia 20</span>
                    <span>Dia 30 (Fim)</span>
                  </div>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={projectionData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} vertical={false} />
                      <XAxis 
                        dataKey="dia" 
                        stroke="#64748b" 
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value.toLocaleString()} Kz`}
                        dx={-5}
                      />
                      <Tooltip 
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rendimento" 
                        stroke="#10b981" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorProjecao)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
            )}
          </div>

          {/* Extrato Unificado diretamente no Painel Geral */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Extrato Unificado e Histórico de Transações</h3>
              <p className="text-xs text-slate-400 mt-1">
                Acompanhe abaixo o histórico de depósitos, lucros acumulados e pedidos de levantamento.
              </p>
            </div>
            <TransactionsList phone={user.phone} simulatedTime={simulatedTime} />
          </div>
        </div>
      )}

      {/* 2. FUNDS (DEPOSIT FLOW) */}
      {activeSection === 'funds' && (
        <div className="space-y-8">
          {/* Passo 1: Informar Depósito */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
            <h3 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs">1</span>
              Fluxo de Recarga de Saldo (Depósito)
            </h3>
            
            {depositSuccessMsg ? (
              <div className="space-y-4 rounded-xl bg-emerald-500/5 p-6 border border-emerald-500/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-white">Sucesso no Envio do Comprovativo</h4>
                <p className="text-sm text-slate-300 font-sans leading-relaxed">
                  {depositSuccessMsg}
                </p>
                <button 
                  onClick={() => setDepositSuccessMsg(null)}
                  className="text-xs text-emerald-400 font-semibold hover:underline block"
                >
                  Enviar outro comprovativo de depósito
                </button>
              </div>
            ) : (
              <form onSubmit={handleDepositSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Método de Pagamento
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMethod('reference');
                          setSelectedProvider('Unitel Money');
                        }}
                        className={`py-2 px-2 text-xs font-semibold rounded border cursor-pointer transition-all ${
                          selectedMethod === 'reference' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Pagamento por Referência
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMethod('crypto');
                          setSelectedProvider('RedotPay');
                        }}
                        className={`py-2 px-2 text-xs font-semibold rounded border cursor-pointer transition-all ${
                          selectedMethod === 'crypto' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Dólar / TRX (RedotPay)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Provedor / Banco
                    </label>
                    {selectedMethod === 'crypto' ? (
                      <div className="block w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-emerald-400 text-xs font-bold">
                        RedotPay (USDT ou TRX)
                      </div>
                    ) : (
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      >
                        <option value="Unitel Money">Unitel Money (Entidade: 00930)</option>
                        <option value="PayPay">PayPay (Entidade: 10116)</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Valor do Depósito (Kz)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 8000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-sm"
                    />
                    {selectedMethod === 'crypto' && (
                      <p className="text-[10px] text-slate-500 mt-1 font-sans">
                        Insira o valor correspondente ao seu plano em Kwanzas. Envie o equivalente em TRX ou USDT.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>ID de Transação (Nº Ref. Bancária)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Formato de Angola</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: FT2607051234, REF98765432..."
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs placeholder:text-slate-600 uppercase"
                    />
                    {transactionId.trim() && (() => {
                      const validation = validateTransactionId(transactionId, selectedProvider, selectedMethod);
                      return (
                        <div className={`mt-1.5 text-[10px] rounded p-2 ${
                          validation.isValid 
                            ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' 
                            : 'bg-rose-500/5 text-rose-400 border border-rose-500/10'
                        }`}>
                          <p className="font-semibold flex items-center gap-1">
                            {validation.isValid ? '✓ ID de Transação válido para processamento' : `✗ ${validation.errorMsg}`}
                          </p>
                          {validation.formatExample && (
                            <p className="text-[9px] text-slate-400 mt-0.5 font-sans font-normal italic">
                              {validation.formatExample}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Dados da Conta / Referência Gerados e Upload */}
                <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-emerald-400" /> DADOS DE DESTINO DO PAGAMENTO:
                  </h4>
                  <div className="space-y-2 leading-relaxed text-slate-300">
                    <p>Faça o pagamento para os dados abaixo e envie o comprovativo:</p>
                    {selectedMethod === 'crypto' ? (
                      <div className="space-y-3">
                        {/* Renderizar um QR code estilizado como o da imagem */}
                        <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-xl p-4">
                          <div className="bg-[#141416] p-4 rounded-xl border border-slate-800 flex flex-col items-center w-full max-w-[210px] shadow-lg">
                            <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider text-center">
                              RedotPay TRX / USDT
                            </div>
                            
                            {/* QR CODE Simulado via SVG de alta fidelidade */}
                            <div className="relative w-36 h-36 bg-white p-1.5 rounded-lg flex items-center justify-center">
                              {/* QR Code Dots SVG */}
                              <svg className="w-full h-full text-slate-950" viewBox="0 0 29 29" fill="currentColor">
                                {/* Corners */}
                                <path d="M0 0h7v7H0zm22 0h7v7h-7zM0 22h7v7H0z" />
                                <path d="M1 1h5v5H1zm22 0h5v5h-5zM1 23h5v5H1z" />
                                <path d="M2 2h3v3H2zm22 0h3v3h-22zM2 24h3v3H2z" />
                                {/* Random dots to simulate a QR code */}
                                <path d="M9 1h1v1H9zm3 0h2v1h-2zm4 0h1v2h-1zm3 0h1v1h-1zm-11 3h2v1H8zm4 0h1v1h-1zm3 0h2v1h-2zm1 3h1v1h-1zm3-2h1v1h-1zm-10 4h2v1H9zm5 0h2v1h-2zm5 1h1v2h-1zm-11 2h1v1H8zm3 0h1v1h-1zm4 0h1v2h-1zm6 0h1v1h-1zm-12 3h2v1h-2zm3 0h1v1h-1zm4 0h2v1h-2zm1 3h1v1h-1zm3-2h1v1h-1zm-10 4h2v1H9zm5 0h2v1h-2zm5 1h1v2h-1zm-11 2h1v1H8zm3 0h1v1h-1zm4 0h1v2h-1zm1 1h1v1h-1zm3 0h1v1h-1zm-10 4h2v1H9zm5 0h2v1h-2" />
                              </svg>
                              
                              {/* Tron Red Circle Logo in center */}
                              <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-md border-2 border-white">
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L2 22l10-4 10 4L12 2z" />
                                </svg>
                              </div>
                            </div>
                            
                            <div className="text-[9px] text-red-500 font-bold mt-2.5 tracking-wider uppercase">
                              Depósito Mínimo: 1.00 TRX
                            </div>
                            <div className="text-[10px] text-slate-300 font-sans font-bold mt-1 text-center flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                              Rede: Tron (TRC20)
                            </div>
                          </div>
                        </div>

                        {/* Endereço de Carteira */}
                        <div className="bg-slate-900 p-3 rounded space-y-2 border border-slate-800">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Endereço da Carteira TRX / USDT:</div>
                          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800">
                            <span className="font-mono text-[10px] text-slate-200 select-all break-all pr-2">
                              TQJJzxfr3J9t9EazaXzc7s1UAfrytkSwXX
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyAddress}
                              className={`p-1.5 rounded cursor-pointer transition-all shrink-0 ${
                                copied 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                              title="Copiar Endereço"
                            >
                              {copied ? (
                                <span className="text-[10px] font-bold px-1">Copiado!</span>
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900 p-3 rounded space-y-2.5 font-mono text-[11px] text-slate-400 border border-slate-800">
                        {selectedMethod === 'reference' ? (
                          <>
                            <div><strong>Entidade:</strong> {refDetails.entidade}</div>
                            <div>
                              <strong>Referências disponíveis:</strong>
                              <div className="mt-1 space-y-1 pl-3 text-slate-200">
                                {(refDetails as any).referencias?.map((ref: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    <span className="select-all font-bold tracking-wider">{ref}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div><strong>IBAN:</strong> {refDetails.iban}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Ficheiro do Comprovativo (Upload Imagem ou PDF)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-800 border-dashed rounded-lg cursor-pointer bg-slate-900 hover:bg-slate-800 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-2 pb-3">
                          <Upload className="w-6 h-6 mb-2 text-slate-500" />
                          <p className="text-xs text-slate-400 text-center px-4">
                            {receiptName ? (
                              <span className="text-emerald-400 font-semibold truncate block max-w-xs">{receiptName}</span>
                            ) : (
                              'Clique ou arraste o comprovante aqui'
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500">PDF, PNG, JPG (Max. 5MB)</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*,application/pdf"
                          onChange={handleFileChange} 
                        />
                      </label>
                    </div>


                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white py-2.5 px-4 rounded-lg font-bold text-xs cursor-pointer transition-opacity"
                  >
                    {loading ? 'Processando...' : 'Enviar Comprovativo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. INVESTMENTS SECTION */}
      {activeSection === 'invest' && (
        <div className="space-y-8">
          {/* Passo 2: Selecionar Produto de Investimento */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Coins className="h-5 w-5 text-emerald-400" />
                Motores de Investimento: Produtos AO (Rendimento Diário)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Adquira qualquer um dos planos de Rendimento Diário abaixo. O rendimento diário começa 24h após ativação manual do admin. O capital investido permanece seguro no seu saldo total.
              </p>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRODUCTS_AO_CONFIG.map((prod) => (
                <div 
                  key={prod.id} 
                  className="rounded-xl border border-slate-800 bg-slate-900/40 hover:border-emerald-500/20 transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded">
                        {prod.id}
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide">RENDIMENTO DIÁRIO</span>
                    </div>
                    
                    <h4 className="text-lg font-bold text-white">Plano {prod.name}</h4>
                    
                    <div className="space-y-2 border-t border-b border-slate-800/80 py-3.5 my-3.5 font-sans">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Aporte Obrigatório:</span>
                        <span className="font-bold text-white font-mono">{prod.aporte.toLocaleString()} Kz</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Retorno Diário:</span>
                        <span className="font-bold text-emerald-400 font-mono">+{prod.dailyReturn.toLocaleString()} Kz</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-slate-800/40 pt-1.5 mt-1.5">
                        <span className="text-slate-400">Rendimento Mensal:</span>
                        <span className="font-semibold text-slate-200 font-mono">{prod.monthlyReturn.toLocaleString()} Kz</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Rendimento Anual:</span>
                        <span className="font-semibold text-slate-200 font-mono">{prod.annualReturn.toLocaleString()} Kz</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-slate-800/40 pt-1.5 mt-1.5">
                        <span className="text-slate-400">Unidades Adquiridas:</span>
                        <span className={`font-bold font-mono ${investments.filter((i: any) => i.productId === prod.id && (i.status === 'active' || i.status === 'pending')).length >= 5 ? 'text-amber-400' : 'text-slate-200'}`}>
                          {investments.filter((i: any) => i.productId === prod.id && (i.status === 'active' || i.status === 'pending')).length} / 5
                        </span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const count = investments.filter((i: any) => i.productId === prod.id && (i.status === 'active' || i.status === 'pending')).length;
                    const isLimitReached = count >= 5;
                    const hasBalance = user.balance >= prod.aporte;

                    return (
                      <button
                        onClick={() => handleInvestSubmit(prod.id)}
                        disabled={loading || !hasBalance || isLimitReached}
                        className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          isLimitReached
                            ? 'bg-amber-600/20 border border-amber-500/30 text-amber-500 cursor-not-allowed'
                            : hasBalance
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-slate-950 text-slate-500 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        {isLimitReached
                          ? 'Limite de 5/5 Atingido'
                          : hasBalance
                            ? `Comprar Plano (${prod.aporte.toLocaleString()} Kz)`
                            : 'Saldo Insuficiente'}
                      </button>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW: 2.5 FIXED TERM FUNDS TAB */}
      {activeSection === 'fixed_funds' && (
        <div className="space-y-8 animate-fade-in">
          {/* Motor de Investimento: Fundos de Investimento a Prazo */}
          <div className="rounded-2xl border border-indigo-500/10 bg-indigo-950/5 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Landmark className="text-indigo-400 h-5.5 w-5.5 animate-pulse" />
                  Fundo de Investimento a Prazo Fixo (Até 200% de Lucro)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Rentabilidade máxima garantida. O valor alocado ao fundo é bloqueado com segurança durante o período escolhido e, no dia do vencimento, o seu <strong>Capital Inicial é libertado com o Lucro Acumulado correspondente (+100% para 30 dias, +150% para 60 dias e +200% para 90 dias de Lucro Líquido Real)</strong> diretamente na sua conta.
                </p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-center shrink-0">
                <span className="block text-[9px] text-indigo-400 uppercase font-bold tracking-wider">Retorno Garantido</span>
                <span className="font-mono text-xs font-bold text-emerald-400">Lucro: +{currentFundConfig.label}</span>
              </div>
            </div>

            {/* Seletor de Prazo */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                1. Escolha o Prazo de Bloqueio dos Fundos
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'fixed_30', days: 30, text: '30 Dias (1 Mês)', returnText: '100% de Lucro (Retorno: 200%)' },
                  { id: 'fixed_60', days: 60, text: '60 Dias (2 Meses)', returnText: '150% de Lucro (Retorno: 250%)' },
                  { id: 'fixed_90', days: 90, text: '90 Dias (3 Meses)', returnText: '200% de Lucro (Retorno: 300%)' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedFundDuration(p.id as any)}
                    className={`p-4 rounded-xl text-left border cursor-pointer transition-all ${
                      selectedFundDuration === p.id
                        ? 'bg-indigo-600/10 border-indigo-500 text-white ring-1 ring-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-sm text-white">{p.text}</div>
                    <div className="text-[10px] text-indigo-400 mt-1 font-semibold">{p.returnText}</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">Fundos bloqueados por {p.days} dias</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Seletor de Valor / Pacotes */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                2. Selecione o Valor para Alocação
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { value: 25000, label: '25.000 Kz' },
                  { value: 50000, label: '50.000 Kz' },
                  { value: 100000, label: '100.000 Kz' },
                  { value: 200000, label: '200.000 Kz' },
                  { value: 400000, label: '400.000 Kz' },
                  { value: 1000000, label: '1.000.000 Kz' }
                ].map((pkg) => (
                  <button
                    key={pkg.value}
                    type="button"
                    onClick={() => setFixedTermAmount(pkg.value.toString())}
                    className={`p-4 rounded-xl border text-center cursor-pointer transition-all flex flex-col justify-between h-full ${
                      Number(fixedTermAmount) === pkg.value
                        ? 'bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500">Coloca:</div>
                    <div className="font-bold text-xs text-white font-mono break-all">{pkg.label}</div>
                    <div className="border-t border-slate-800/80 my-2"></div>
                    <div className="text-[9px] text-slate-500">Recebe:</div>
                    <div className="font-bold text-xs text-emerald-400 font-mono break-all">
                      {Math.round(pkg.value * currentFundConfig.receiveMultiplier).toLocaleString()} Kz
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Ou digite outro valor personalizado (Kz):
                    </label>
                    <input
                      type="number"
                      min="25000"
                      placeholder="Digite o valor em Kwanza"
                      value={fixedTermAmount}
                      onChange={(e) => setFixedTermAmount(e.target.value)}
                      className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    {(() => {
                      const count = investments.filter((i: any) => i.productId === selectedFundDuration && (i.status === 'active' || i.status === 'pending')).length;
                      const isLimitReached = count >= 5;
                      const amountValue = Number(fixedTermAmount);
                      const hasBalance = user.balance >= amountValue;

                      return (
                        <button
                          onClick={() => handleInvestSubmit(selectedFundDuration, amountValue)}
                          disabled={loading || !hasBalance || amountValue <= 0 || isLimitReached}
                          className={`w-full md:w-auto font-bold py-2.5 px-8 rounded-lg text-xs cursor-pointer transition-all h-[42px] flex items-center justify-center gap-1.5 shadow-md ${
                            isLimitReached
                              ? 'bg-amber-600/20 border border-amber-500/30 text-amber-500 cursor-not-allowed'
                              : hasBalance && amountValue > 0
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                : 'bg-slate-950 text-slate-500 border border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {isLimitReached
                            ? 'Limite de 5/5 Atingido'
                            : `Ativar Fundo Selecionado (${count}/5)`}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* DEDICATED PROJECTION CALCULATOR FOR FIXED FUNDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs space-y-2.5 font-mono text-slate-400 relative overflow-hidden">
                <div className="absolute right-2.5 top-2.5 opacity-5 pointer-events-none">
                  <Calculator className="h-16 w-16 text-indigo-400" />
                </div>
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2">
                  <Calculator className="h-4 w-4 text-indigo-400" />
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">Calculadora de Projeção de Fundos</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Prazo de Bloqueio:</span>
                  <span className="text-white font-bold">
                    {selectedFundDuration === 'fixed_30' ? '30 Dias (1 Mês)' : selectedFundDuration === 'fixed_60' ? '60 Dias (2 Meses)' : '90 Dias (3 Meses)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rentabilidade Líquida:</span>
                  <span className="text-emerald-400 font-bold">{currentFundConfig.label} de Lucro Real</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1.5 text-slate-200">
                  <span>Valor do Aporte Inicial:</span>
                  <span className="text-white font-bold">
                    {Number(fixedTermAmount) ? Number(fixedTermAmount).toLocaleString() : '0'} Kz
                  </span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span>Lucro Estimado (+{currentFundConfig.label}):</span>
                  <span className="text-emerald-400 font-bold">
                    +{Number(fixedTermAmount) ? Math.round(Number(fixedTermAmount) * currentFundConfig.rate).toLocaleString() : '0'} Kz
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-800 pt-2 text-slate-200">
                  <span>Retorno Total ao Vencer:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {Number(fixedTermAmount) ? Math.round(Number(fixedTermAmount) * currentFundConfig.receiveMultiplier).toLocaleString() : '0'} Kz
                  </span>
                </div>
              </div>

              <div className="border border-indigo-500/10 rounded-xl bg-indigo-500/5 p-5 space-y-3 text-[11px] text-indigo-400">
                <strong className="block text-white text-xs">Gratificação & Bónus de Rede de Afiliados:</strong>
                <p className="leading-relaxed font-sans">
                  • <strong>A rede recebe bónus imediato</strong> quando um convidado aloca capital a este fundo!
                </p>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-indigo-500/10 font-mono text-[10px] text-indigo-300 space-y-1.5">
                  <div className="flex justify-between">
                    <span>1º Nível (Indicação Direta - 15%):</span>
                    <span className="font-bold text-emerald-400">+{Number(fixedTermAmount) ? Math.round(Number(fixedTermAmount) * 0.15).toLocaleString() : '0'} Kz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2º Nível (Convidado L2 - 10%):</span>
                    <span className="font-bold text-emerald-400">+{Number(fixedTermAmount) ? Math.round(Number(fixedTermAmount) * 0.10).toLocaleString() : '0'} Kz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3º Nível (Convidado L3 - 5%):</span>
                    <span className="font-bold text-emerald-400">+{Number(fixedTermAmount) ? Math.round(Number(fixedTermAmount) * 0.05).toLocaleString() : '0'} Kz</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                  *O capital alocado ao fundo é 100% garantido e creditado automaticamente na carteira de saldo às 00:00 após o término do prazo de simulação. Cancelamento ou resgates antecipados não estão disponíveis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. WITHDRAWAL PANEL */}
      {activeSection === 'withdraw' && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ArrowUpCircle className="text-emerald-400 h-5 w-5" />
              6️⃣ Políticas e Regras de Levantamento (Saque)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Transfira os seus rendimentos disponíveis diretamente para a sua conta bancária de Angola.
            </p>
          </div>

          {isAngolaWeekend && user.role !== 'admin' && user.phone !== '942691403' && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-300 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                Aviso: Levantamentos Indisponíveis no Fim de Semana
              </div>
              <p>
                De acordo com as normas operacionais da nossa plataforma, <strong>não são processados levantamentos aos sábados e domingos</strong>.
              </p>
              <p>
                Poderá solicitar e receber os seus levantamentos normalmente de <strong>segunda a sexta-feira, dentro do horário ativo (10:00h às 16:00h)</strong>.
              </p>
            </div>
          )}

          <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Banco Destinatário
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={isAngolaWeekend && user.role !== 'admin' && user.phone !== '942691403'}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="BAI">Banco BAI</option>
                  <option value="BFA">Banco BFA</option>
                  <option value="BIC">Banco BIC</option>
                  <option value="Standard Bank">Standard Bank</option>
                  <option value="SOL">Banco SOL</option>
                  <option value="BMA">Banco de Fomento Angola</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Valor a Levantar (Kz)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Min: 3.000 | Max: 50.000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={isAngolaWeekend && user.role !== 'admin' && user.phone !== '942691403'}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {Number(withdrawAmount) > 0 && (
                  <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Valor Solicitado:</span>
                      <span className="font-mono text-white">{Number(withdrawAmount).toLocaleString()} Kz</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>Taxa de Levantamento (15%):</span>
                      <span className="font-mono font-semibold">-{Math.round(Number(withdrawAmount) * 0.15).toLocaleString()} Kz</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 border-t border-slate-800/60 pt-1 mt-1 font-bold">
                      <span>Líquido a Receber:</span>
                      <span className="font-mono">{Math.round(Number(withdrawAmount) * 0.85).toLocaleString()} Kz</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Titular da Conta Bancária
                </label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  disabled={isAngolaWeekend && user.role !== 'admin' && user.phone !== '942691403'}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  IBAN Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="AO06 xxxx xxxx xxxx xxxx x"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  disabled={isAngolaWeekend && user.role !== 'admin' && user.phone !== '942691403'}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (isAngolaWeekend && user.role !== 'admin' && user.phone !== '942691403')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white py-2.5 rounded-lg font-bold text-xs cursor-pointer transition-opacity disabled:from-slate-700 disabled:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando pedido...' : isAngolaWeekend && user.role !== 'admin' && user.phone !== '942691403' ? 'Levantamentos Indisponíveis no Fim de Semana' : 'Solicitar Levantamento Bancário'}
            </button>
          </form>

          {/* Políticas e Horários */}
          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs text-slate-400 space-y-2 font-sans">
            <strong className="block text-white">Políticas e Janelas Operacionais Obrigatórias:</strong>
            <p>• <span className="text-white font-semibold">Valor Mínimo:</span> 3.000 Kz | <span className="text-white font-semibold">Valor Máximo:</span> 50.000 Kz por transação.</p>
            <p>• <span className="text-white font-semibold">Taxa de Desconto:</span> 15% de taxa administrativa deduzida em todos os levantamentos.</p>
            <p>• <span className="text-white font-semibold">Horário Ativo:</span> Das 10:00h às 16:00h.</p>
            <p>• <span className="text-white font-semibold">Prazo de Execução:</span> 24 a 48 horas úteis.</p>
            <p className="text-amber-400 text-[11px]">• Os valores alocados em fundos de 90 dias não preenchem requisitos de levantamento até que o prazo de maturidade expire por completo.</p>
          </div>
        </div>
      )}

      {/* 4. HISTORY (TRANSACTIONS) */}
      {activeSection === 'history' && (
        <div className="space-y-6">
          <h3 className="text-base font-bold text-white tracking-tight">Extrato Unificado e Histórico de Transações</h3>
          <p className="text-xs text-slate-400">
            Confira abaixo o histórico imutável das suas transações de depósito, lucros diários do motor financeiro, bónus de convite de rede e levantamentos.
          </p>
          <TransactionsList phone={user.phone} simulatedTime={simulatedTime} />
        </div>
      )}

      {/* 5. CARDS SECTION (MEUS CARTÕES E SERVIÇOS FINANCEIROS) */}
      {activeSection === 'cards' && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">O seu Cartão de Membro e Serviços</h3>
              <p className="text-xs text-slate-400">
                Visualize o seu cartão de fidelidade digital baseado no seu nível de investimento e aceda a serviços de cartões virtuais e físicos.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 border ${membershipTier.borderColor} ${membershipTier.textColor} flex items-center gap-1.5 shadow-md`}>
                <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${membershipTier.color} animate-pulse`} />
                Membro {membershipTier.name}
              </span>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* VISUALIZADOR DE CARTÃO INTERATIVO */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Cartão Virtual 3D Container */}
              <div 
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="w-full max-w-sm h-56 cursor-pointer relative select-none [perspective:1000px] group"
              >
                <div className={`relative w-full h-full duration-700 [transform-style:preserve-3d] ${isCardFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                  
                  {/* PARTE DA FRENTE DO CARTÃO */}
                  <div className={`absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between text-white shadow-2xl border ${membershipTier.borderColor} bg-gradient-to-br ${membershipTier.bgGradient} [backface-visibility:hidden] overflow-hidden`}>
                    {/* Efeitos de brilho metálico na frente */}
                    <div className="absolute -right-20 -top-20 w-52 h-52 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 w-52 h-52 rounded-full bg-slate-950/20 blur-3xl pointer-events-none" />
                    
                    {/* Logo superior e ícone Wi-Fi */}
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <span className="font-extrabold tracking-tight text-sm font-sans text-white">MoneyAO</span>
                        <span className="block text-[8px] text-slate-300 font-mono tracking-widest uppercase leading-none mt-0.5">INVESTMENTS</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Wifi className="h-5 w-5 text-slate-300/80 rotate-90" />
                        <div className="text-right">
                          <span className="text-[7px] text-slate-400 block uppercase font-bold">Categoria</span>
                          <span className="text-[10px] font-black text-white tracking-wider">{membershipTier.name.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Microchip EMV */}
                    <div className="relative z-10 mt-2">
                      <div className="w-10 h-8 rounded bg-gradient-to-br from-amber-400 to-yellow-600 p-[1px] shadow-md flex items-center justify-center overflow-hidden border border-amber-500/30">
                        <Cpu className="h-6 w-6 text-slate-950/40" />
                      </div>
                    </div>

                    {/* Número do Cartão */}
                    <div className="text-lg font-mono tracking-widest text-slate-100 font-bold relative z-10 mt-3 drop-shadow-md">
                      4556 9422 2026 {user.phone ? user.phone.slice(-4).padStart(4, '0') : '0000'}
                    </div>

                    {/* Nome do Titular e Validade */}
                    <div className="flex justify-between items-end relative z-10">
                      <div>
                        <span className="text-[7px] text-slate-400 uppercase tracking-widest block font-bold">Titular do Cartão</span>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-white drop-shadow-sm">
                          {user.name ? user.name.toUpperCase() : 'INVESTIDOR OFICIAL'}
                        </span>
                      </div>
                      <div className="text-right flex gap-3">
                        <div>
                          <span className="text-[7px] text-slate-400 uppercase tracking-widest block font-bold">Membro Desde</span>
                          <span className="text-[10px] font-mono font-bold text-white">06/26</span>
                        </div>
                        <div>
                          <span className="text-[7px] text-slate-400 uppercase tracking-widest block font-bold">Validade</span>
                          <span className="text-[10px] font-mono font-bold text-white">06/31</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PARTE DE TRÁS DO CARTÃO */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl bg-slate-950 text-white shadow-2xl border border-slate-800 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between py-6 overflow-hidden">
                    {/* Faixa Magnética */}
                    <div className="w-full h-11 bg-slate-900 border-t border-b border-slate-800" />
                    
                    {/* Bloco de Assinatura e CVV */}
                    <div className="px-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-8 bg-slate-800 rounded flex items-center px-3 text-slate-400 font-sans text-xs italic line-through decoration-slate-600 select-none">
                          MoneyAO Angola Investments
                        </div>
                        <div className="w-12 h-8 bg-white text-slate-950 font-mono font-bold text-xs flex items-center justify-center rounded">
                          {user.phone ? user.phone.slice(-3) : '942'}
                        </div>
                      </div>

                      {/* Texto de Aviso / Termos de Uso */}
                      <div className="space-y-1">
                        <p className="text-[7px] text-slate-500 leading-normal">
                          Este é um cartão de fidelidade digital da MoneyAO. O uso deste cartão rege-se de forma estrita pelos Termos de Serviço da plataforma. Os ativos financeiros vinculados pertencem à carteira oficial do titular registado.
                        </p>
                        <p className="text-[7px] text-slate-500 leading-normal">
                          Suporte Oficial MoneyAO: +244 942 691 403 | Luanda, Angola.
                        </p>
                      </div>
                    </div>

                    {/* Logotipo MoneyAO na Traseira */}
                    <div className="px-6 flex items-center justify-between text-slate-500">
                      <span className="text-[9px] font-mono tracking-widest uppercase font-bold">DEBIT CARD</span>
                      <span className="text-xs font-black tracking-tight text-slate-400">MoneyAO</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2 transition-all cursor-pointer hover:text-white"
                >
                  <RotateCw className="h-3.5 w-3.5 text-emerald-400 animate-spin-slow" />
                  <span>Girar Cartão de Membro</span>
                </button>
                <span className="text-[10px] text-slate-500 mt-1">Toque no cartão para girar e ver o verso (CVV)</span>
              </div>
            </div>

            {/* BARRA DE PROGRESSO DO NÍVEL ATUAL */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 md:p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${membershipTier.color} p-0.5 shadow-md text-slate-950 font-bold`}>
                  <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center">
                    {membershipTier.id === 'platinum' && <Crown className="h-5 w-5 text-purple-400" />}
                    {membershipTier.id === 'gold' && <Award className="h-5 w-5 text-amber-400" />}
                    {membershipTier.id === 'silver' && <ShieldCheck className="h-5 w-5 text-slate-300" />}
                    {membershipTier.id === 'bronze' && <Sparkles className="h-5 w-5 text-orange-400" />}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Progresso de Nível de Membro</h4>
                  <p className="text-[11px] text-slate-400">Total Investido Atual: <span className="font-mono text-slate-200 font-bold">{(user.totalInvested || 0).toLocaleString()} Kz</span></p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-mono">
                  <span>Nível Atual: <strong>{membershipTier.name}</strong></span>
                  {membershipTier.nextTier ? (
                    <span>Próximo Nível: <strong>{membershipTier.nextTier.name}</strong> ({membershipTier.nextTier.threshold.toLocaleString()} Kz)</span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Crown className="h-3 w-3" /> Nível Máximo Atingido!
                    </span>
                  )}
                </div>
                
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-[1px] border border-slate-800/80">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${membershipTier.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${membershipTier.progressPercent}%` }}
                  />
                </div>
                
                {membershipTier.nextTier && (
                  <p className="text-[10px] text-slate-500 mt-1 font-mono text-right">
                    Falta investir <strong className="text-slate-300">{membershipTier.neededForNext.toLocaleString()} Kz</strong> para atingir o nível <strong className="text-slate-300">{membershipTier.nextTier.name}</strong>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESGATAR CÓDIGO DE PRESENTE */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <button
              onClick={() => {
                setShowRedeemModal(false);
                setGiftCodeInput('');
                setRedeemError(null);
                setRedeemSuccess(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Gift className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Resgatar Código de Presente</h3>
                <p className="text-[10px] text-slate-400">Insira o código enviado pelo seu administrador</p>
              </div>
            </div>

            {redeemError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>{redeemError}</div>
              </div>
            )}

            {redeemSuccess && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <div>{redeemSuccess}</div>
              </div>
            )}

            <form onSubmit={handleRedeemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Código Promocional</label>
                <input
                  type="text"
                  required
                  disabled={redeemLoading || !!redeemSuccess}
                  placeholder="EX: CODIGO-PRESENTE-XYZ"
                  value={giftCodeInput}
                  onChange={(e) => setGiftCodeInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm font-bold font-mono uppercase"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRedeemModal(false);
                    setGiftCodeInput('');
                    setRedeemError(null);
                    setRedeemSuccess(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                {!redeemSuccess && (
                  <button
                    type="submit"
                    disabled={redeemLoading}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {redeemLoading ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Resgatar Presente
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const MemoizedDashboard = React.memo(Dashboard);
export default MemoizedDashboard;

// Subcomponente de Extrato de Transações (Memorizado para evitar renderizações desnecessárias)
const TransactionsList = React.memo(function TransactionsList({ phone, simulatedTime }: { phone: string; simulatedTime: string }) {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTxs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/transactions/${phone}`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setTxs(data.transactions || []);
      }
    } catch (err: any) {
      if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
        console.warn('Conexão temporariamente indisponível para o extrato.');
      } else {
        console.error('Erro ao buscar extrato:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (phone) {
      fetchTxs();
    }
  }, [phone, simulatedTime]);

  if (loading) {
    return <TransactionsTableSkeleton />;
  }

  if (txs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-8 text-center text-slate-500 text-xs">
        Nenhuma movimentação financeira registrada na sua carteira até ao momento.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold font-sans">
            <th className="p-3">Data / Hora</th>
            <th className="p-3">Categoria</th>
            <th className="p-3">Descrição / Detalhes</th>
            <th className="p-3">Estado</th>
            <th className="p-3 text-right">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
          {txs.map((tx) => (
            <tr key={tx.id} className="hover:bg-slate-900/30 transition-colors">
              <td className="p-3 text-slate-500">
                {new Date(tx.createdAt).toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' })} {new Date(tx.createdAt).toLocaleTimeString('pt-AO', { timeZone: 'Africa/Luanda' })}
              </td>
              <td className="p-3 font-semibold text-slate-200">
                {tx.type}
              </td>
              <td className="p-3 text-slate-400">
                {tx.details}
              </td>
              <td className="p-3">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  tx.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  tx.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {tx.status === 'approved' ? 'SUCESSO' : tx.status.toUpperCase()}
                </span>
              </td>
              <td className={`p-3 text-right font-bold text-sm ${(tx.amount || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(tx.amount || 0) > 0 ? '+' : ''}{(tx.amount || 0).toLocaleString()} Kz
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
