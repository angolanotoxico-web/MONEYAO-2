import React, { useState, useEffect } from 'react';
import { 
  Users, Check, X, Play, Clock, Shield, AlertTriangle, RefreshCw, 
  ArrowRight, Landmark, DollarSign, ListOrdered, Undo, FileText,
  Trash2, UserX, UserCheck, ZoomIn, ZoomOut, RotateCw, Gift,
  Search, Activity, Terminal
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminProps {
  currentPhone: string;
  onStateUpdate: () => void;
  simulatedTime: string;
}

export default function AdminSimulation({ currentPhone, onStateUpdate, simulatedTime }: AdminProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(1);
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'investments' | 'users' | 'commissions' | 'logs' | 'recoveries' | 'gifts'>('deposits');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewingDeposit, setViewingDeposit] = useState<any>(null);
  
  // Estados do Lightbox Interativo de Alta Resolução
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Estados para Gestão de Códigos de Presente (Gifts)
  const [giftCodeName, setGiftCodeName] = useState('');
  const [giftCodeAmount, setGiftCodeAmount] = useState('');
  const [giftCodeMaxUses, setGiftCodeMaxUses] = useState('1');

  // Handlers para Gestão de Códigos de Presente
  const handleCreateGiftCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCodeName || !giftCodeAmount) {
      alert('Por favor, indique o código e o valor de bónus.');
      return;
    }
    setActionLoading('create_gift_code');
    try {
      const res = await fetch('/api/admin/gift-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: giftCodeName,
          amount: Number(giftCodeAmount),
          maxUses: Number(giftCodeMaxUses || 1)
        })
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message);
        setGiftCodeName('');
        setGiftCodeAmount('');
        setGiftCodeMaxUses('1');
        fetchAdminData();
      } else {
        alert(resData.error || 'Erro ao criar o código de presente.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGiftCode = async (id: string, code: string) => {
    if (!window.confirm(`Deseja eliminar definitivamente o código de presente "${code}"?`)) {
      return;
    }
    setActionLoading(`delete_gift_${id}`);
    try {
      const res = await fetch('/api/admin/gift-codes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message);
        fetchAdminData();
      } else {
        alert(resData.error || 'Erro ao eliminar o código.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Estados Adicionais para Redefinição de Credenciais e Gestão de Lucros
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const [selectedUserForProfitEdit, setSelectedUserForProfitEdit] = useState<any>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editTotalEarnings, setEditTotalEarnings] = useState('');
  const [editTotalInvested, setEditTotalInvested] = useState('');

  const [selectedInvestmentForPayout, setSelectedInvestmentForPayout] = useState<any>(null);
  const [manualPayoutAmount, setManualPayoutAmount] = useState('');

  // Estados para Filtro e Pesquisa de Utilizadores
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Estados para Filtro e Pesquisa de Logs de Segurança
  const [logFilter, setLogFilter] = useState<'all' | 'access' | 'critical' | 'alerts'>('all');
  const [logSearch, setLogSearch] = useState('');

  // Handlers para Ações Administrativas Adicionais
  const handleBatchAutomaticPayout = async () => {
    setActionLoading('batch_automatic_payout');
    try {
      const res = await fetch('/api/admin/investment/pay-automatic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message);
        fetchAdminData();
        onStateUpdate();
      } else {
        alert(resData.error || 'Erro ao processar pagamento automático.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAutoPayout = async () => {
    setActionLoading('toggle_auto_payout');
    try {
      const currentVal = data?.autoProfitPayout;
      const res = await fetch('/api/admin/toggle-auto-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentVal })
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message);
        fetchAdminData();
      } else {
        alert(resData.error || 'Erro ao alterar modo.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestmentForPayout || !manualPayoutAmount) return;
    setActionLoading('manual_payout_' + selectedInvestmentForPayout.id);
    try {
      const res = await fetch('/api/admin/investment/pay-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          investmentId: selectedInvestmentForPayout.id, 
          amount: Number(manualPayoutAmount) 
        })
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message);
        setSelectedInvestmentForPayout(null);
        setManualPayoutAmount('');
        fetchAdminData();
        onStateUpdate();
      } else {
        alert(resData.error || 'Erro ao processar pagamento manual.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPasswordValue) return;
    setActionLoading('reset_password_' + selectedUserForReset.phone);
    try {
      const res = await fetch('/api/admin/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: selectedUserForReset.phone, 
          newPassword: newPasswordValue 
        })
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message);
        setSelectedUserForReset(null);
        setNewPasswordValue('');
        fetchAdminData();
        onStateUpdate();
      } else {
        alert(resData.error || 'Erro ao redefinir palavra-passe.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserProfitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForProfitEdit) return;
    setActionLoading('edit_profit_' + selectedUserForProfitEdit.phone);
    try {
      const res = await fetch('/api/admin/user/edit-profit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: selectedUserForProfitEdit.phone, 
          balance: Number(editBalance),
          totalEarnings: Number(editTotalEarnings),
          totalInvested: Number(editTotalInvested)
        })
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message);
        setSelectedUserForProfitEdit(null);
        setEditBalance('');
        setEditTotalEarnings('');
        setEditTotalInvested('');
        fetchAdminData();
        onStateUpdate();
      } else {
        alert(resData.error || 'Erro ao salvar alterações.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/all');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Erro ao buscar dados admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [simulatedTime]);

  const handleDepositAction = async (depositId: string, action: 'approve' | 'reject') => {
    setActionLoading(depositId);
    try {
      const res = await fetch('/api/admin/deposit/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, action })
      });
      if (res.ok) {
        fetchAdminData();
        onStateUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefundDeposit = async (depositId: string) => {
    setActionLoading(`refund_${depositId}`);
    try {
      const res = await fetch('/api/admin/deposit/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId })
      });
      if (res.ok) {
        alert('Reembolso concluído com sucesso! Os fundos do cliente foram estornados e todas as comissões de rede geradas foram removidas de imediato.');
        fetchAdminData();
        onStateUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject') => {
    setActionLoading(withdrawalId);
    try {
      const res = await fetch('/api/admin/withdrawal/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, action })
      });
      if (res.ok) {
        fetchAdminData();
        onStateUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvestmentAction = async (investmentId: string, action: 'activate' | 'pause' | 'resume') => {
    setActionLoading(investmentId);
    try {
      const res = await fetch('/api/admin/investment/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentId, action })
      });
      if (res.ok) {
        fetchAdminData();
        onStateUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateTime = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/simulate-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      if (res.ok) {
        fetchAdminData();
        onStateUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (phone: string) => {
    setActionLoading(`toggle_status_${phone}`);
    try {
      const res = await fetch('/api/admin/user/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message);
        fetchAdminData();
        onStateUpdate();
      } else {
        alert(resData.error || 'Erro ao alterar estado do utilizador.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (phone: string, name: string) => {
    const confirmed = window.confirm(`ATENÇÃO DE SEGURANÇA CRÍTICA!\n\nTem certeza absoluta que deseja excluir definitivamente o utilizador ${name} (${phone}) do sistema?\n\nEsta ação é IRREVERSÍVEL e removerá completamente:\n- Perfil do utilizador\n- Todos os depósitos efetuados\n- Todos os investimentos ativos\n- Todas as comissões de rede geradas\n- Todo o histórico de transações\n\nDeseja continuar?`);
    if (!confirmed) return;

    setActionLoading(`delete_user_${phone}`);
    try {
      const res = await fetch('/api/admin/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message);
        fetchAdminData();
        onStateUpdate();
      } else {
        alert(resData.error || 'Erro ao excluir o utilizador.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!data) {
    return (
      <div className="flex justify-center items-center py-12 text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando painel de administração...
      </div>
    );
  }

  // Estatísticas Rápidas do Sistema
  const totalUsers = data.users.length;
  const pendingDeposits = data.deposits.filter((d: any) => d.status === 'pending');
  const pendingWithdrawals = data.withdrawals.filter((w: any) => w.status === 'pending');
  const activeAOPlans = data.investments.filter((i: any) => i.status === 'active' && i.productType === 'daily');

  // Filtrar Utilizadores por pesquisa e estado
  const filteredUsers = data && data.users ? data.users.filter((u: any) => {
    if (userSearchTerm) {
      const term = userSearchTerm.toLowerCase();
      const matchName = u.name ? u.name.toLowerCase().includes(term) : false;
      const matchPhone = u.phone ? u.phone.includes(term) : false;
      if (!matchName && !matchPhone) return false;
    }
    if (userStatusFilter === 'active') {
      return u.status === 'active';
    }
    if (userStatusFilter === 'blocked') {
      return u.status !== 'active';
    }
    return true;
  }) : [];

  return (
    <div id="admin-simulation-panel" className="rounded-xl border border-emerald-500/15 bg-slate-900/40 p-6 backdrop-blur-md shadow-2xl">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-2">
            <Shield className="h-3.5 w-3.5" /> SISTEMA INTEGRADO DE ADMINISTRAÇÃO E AUDITORIA
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight font-sans">Painel Administrativo MoneyAO</h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestão oficial e central de segurança financeira: aprovação de transações e monitoramento de logs de auditoria.
          </p>
        </div>

        {/* Relógio Oficial de Angola e Controles de Simulação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Clock className="h-4 w-4 text-emerald-400" />
            Hora Oficial:
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-center">
            {new Date(data.simulatedTime).toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' })} {new Date(data.simulatedTime).toLocaleTimeString('pt-AO', { timeZone: 'Africa/Luanda' })}
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Simular:</span>
              <input 
                type="number" 
                min="1" 
                max="30" 
                value={days} 
                onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))} 
                className="w-10 bg-slate-900 border border-slate-800 text-white rounded text-xs px-1.5 py-0.5 text-center font-bold"
              />
              <span className="text-[10px] font-semibold text-slate-400">Dias</span>
            </div>
            <button
              onClick={handleSimulateTime}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer transition-colors active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Avançar
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch('/api/admin/simulate-time', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ days: 0 })
                  });
                  if (res.ok) {
                    fetchAdminData();
                    onStateUpdate();
                  }
                } catch (err) {
                  console.error(err);
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1 rounded text-[10px] cursor-pointer transition-colors active:scale-95 border border-slate-700"
            >
              Sincronizar Real
            </button>
          </div>
        </div>
      </div>

      {/* Painel Resumo de Métricas de Rede */}
      <div className="mb-6 rounded-lg bg-slate-950/70 p-4 border border-slate-800/80">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
          <Landmark className="h-3.5 w-3.5 text-emerald-400" /> VISÃO GERAL DO BALANÇO FINANCEIRO DO SISTEMA:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500">Total de Utilizadores</span>
              <span className="block text-lg font-bold text-white mt-1">
                {totalUsers.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ 10.000</span>
              </span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((totalUsers / 10000) * 100, 100)}%` }}
                />
              </div>
              <span className="block text-[9px] text-emerald-400 mt-1">
                {((totalUsers / 10000) * 100).toFixed(2)}% do limite máximo do sistema
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="block text-[10px] uppercase font-bold text-slate-500">Depósitos Pendentes</span>
            <span className="block text-lg font-bold text-amber-400 mt-1">{pendingDeposits.length} transações</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">Aguardando homologação de comprovativo</span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="block text-[10px] uppercase font-bold text-slate-500">Levantamentos a Liquidar</span>
            <span className="block text-lg font-bold text-rose-400 mt-1">{pendingWithdrawals.length} ordens</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">Pagamentos pendentes de processamento</span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="block text-[10px] uppercase font-bold text-slate-500">Planos de Rendimentos</span>
            <span className="block text-lg font-bold text-emerald-400 mt-1">{activeAOPlans.length} Ativos</span>
            <span className="block text-[10px] text-emerald-400 mt-0.5">Contratos gerando juros diários</span>
          </div>
        </div>
      </div>

      {/* Tabs Administrativas */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-4">
        {[
          { id: 'deposits', label: `Depósitos (${pendingDeposits.length})` },
          { id: 'withdrawals', label: `Levantamentos (${pendingWithdrawals.length})` },
          { id: 'investments', label: `Planos AO (${activeAOPlans.length} Ativos)` },
          { id: 'users', label: `Usuários (${totalUsers})` },
          { id: 'commissions', label: `Comissões Rede (${data.commissions.length})` },
          { id: 'gifts', label: `Presentes (${data.giftCodes ? data.giftCodes.length : 0})` },
          { id: 'recoveries', label: `Recuperações (${data.recoveryRequests ? data.recoveryRequests.filter((r: any) => r.status === 'pending').length : 0})` },
          { id: 'logs', label: 'Segurança & Auditoria' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === tab.id 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-slate-950 text-slate-400 border border-transparent hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Tabs */}
      <div className="overflow-x-auto min-h-[250px]">
        {/* TAB DEPÓSITOS */}
        {activeTab === 'deposits' && (
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5">Cliente (ID)</th>
                <th className="py-2.5">Valor (Kz)</th>
                <th className="py-2.5">Meio / Origem</th>
                <th className="py-2.5">Referência / Upload</th>
                <th className="py-2.5">Estado</th>
                <th className="py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Nenhum depósito solicitado até o momento.</td>
                </tr>
              ) : (
                data.deposits.map((dep: any) => (
                  <tr key={dep.id} className="text-slate-300">
                    <td className="py-2.5 font-semibold text-white">
                      {data.users.find((u: any) => u.phone === dep.phone)?.name || dep.phone}
                      <span className="block text-[10px] text-slate-500 font-mono">{dep.phone}</span>
                    </td>
                    <td className="py-2.5 font-mono font-bold text-emerald-400">
                      {dep.amount.toLocaleString()} Kz
                    </td>
                    <td className="py-2.5">
                      <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{dep.provider}</span>
                    </td>
                    <td className="py-2.5">
                      <div className="font-mono text-slate-300">Ref: {dep.reference}</div>
                      {dep.transactionId && (
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5 font-bold">
                          Nº Transação: {dep.transactionId}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewingDeposit(dep)}
                        className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline bg-transparent border-none p-0"
                      >
                        <FileText className="h-3 w-3" /> Ver Comprovativo
                      </button>
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        dep.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        dep.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {dep.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 text-right space-x-1">
                      {dep.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleDepositAction(dep.id, 'approve')}
                            disabled={actionLoading !== null}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <Check className="h-3 w-3" /> Aprovar
                          </button>
                          <button
                            onClick={() => handleDepositAction(dep.id, 'reject')}
                            disabled={actionLoading !== null}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <X className="h-3 w-3" /> Rejeitar
                          </button>
                        </>
                      ) : dep.status === 'approved' ? (
                        <button
                          onClick={() => handleRefundDeposit(dep.id)}
                          disabled={actionLoading !== null}
                          className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 font-semibold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer inline-flex items-center gap-0.5 border border-amber-500/20"
                        >
                          <Undo className="h-3 w-3" /> Estornar/Remover Bónus
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600">Concluído</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB LEVANTAMENTOS */}
        {activeTab === 'withdrawals' && (
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5">Cliente (ID)</th>
                <th className="py-2.5">Valor (Kz)</th>
                <th className="py-2.5">Conta / Titular</th>
                <th className="py-2.5">IBAN</th>
                <th className="py-2.5">Estado</th>
                <th className="py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Nenhum levantamento solicitado até o momento.</td>
                </tr>
              ) : (
                data.withdrawals.map((withd: any) => (
                  <tr key={withd.id} className="text-slate-300">
                    <td className="py-2.5 font-semibold text-white">
                      {data.users.find((u: any) => u.phone === withd.phone)?.name || withd.phone}
                      <span className="block text-[10px] text-slate-500 font-mono">{withd.phone}</span>
                    </td>
                    <td className="py-2.5 font-mono">
                      <div className="font-bold text-rose-400">{withd.amount.toLocaleString()} Kz</div>
                      <div className="text-[10px] text-slate-500">
                        Taxa (15%): -{(withd.fee || Math.round(withd.amount * 0.15)).toLocaleString()} Kz
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold">
                        Líquido: {(withd.netAmount || (withd.amount - Math.round(withd.amount * 0.15))).toLocaleString()} Kz
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className="font-semibold block">{withd.bankName}</span>
                      <span className="text-[10px] text-slate-400">{withd.accountHolder}</span>
                    </td>
                    <td className="py-2.5 font-mono text-slate-400">{withd.iban}</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        withd.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        withd.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {withd.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 text-right space-x-1">
                      {withd.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleWithdrawalAction(withd.id, 'approve')}
                            disabled={actionLoading !== null}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <Check className="h-3 w-3" /> Aprovar
                          </button>
                          <button
                            onClick={() => handleWithdrawalAction(withd.id, 'reject')}
                            disabled={actionLoading !== null}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <X className="h-3 w-3" /> Rejeitar (Devolve Saldo)
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-600">Concluído</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB PLANOS AO */}
        {activeTab === 'investments' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-400" /> Controle de Rendimentos Diários
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Processe rendimentos de planos ativos em lote (Manual) ou ative o piloto automático para processamento automático contínuo em segundo plano.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Switch de Pagamento Automático */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Piloto Automático:</span>
                  <button
                    type="button"
                    onClick={handleToggleAutoPayout}
                    disabled={actionLoading !== null}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      data?.autoProfitPayout ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                        data?.autoProfitPayout ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-[10px] font-bold ${data?.autoProfitPayout ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {data?.autoProfitPayout ? 'ATIVO' : 'DESATIVADO'}
                  </span>
                </div>

                {/* Botão de Pagamento em Lote */}
                <button
                  type="button"
                  onClick={handleBatchAutomaticPayout}
                  disabled={actionLoading !== null}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-bold px-3 py-2 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/15 active:scale-95"
                >
                  {actionLoading === 'batch_automatic_payout' ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Rodar Pagamento Manual (Em Lote)
                </button>
              </div>
            </div>

            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5">Cliente</th>
                  <th className="py-2.5">Produto / Tipo</th>
                  <th className="py-2.5">Capital Investido</th>
                  <th className="py-2.5">Rendimento Diário</th>
                  <th className="py-2.5">Ganhos Acumulados</th>
                  <th className="py-2.5">Estado</th>
                  <th className="py-2.5 text-right font-semibold">Ações de Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.investments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">Nenhum plano ativo no sistema de investimento.</td>
                  </tr>
                ) : (
                  data.investments.map((inv: any) => (
                    <tr key={inv.id} className="text-slate-300">
                      <td className="py-2.5 font-semibold text-white">
                        {data.users.find((u: any) => u.phone === inv.phone)?.name || inv.phone}
                        <span className="block text-[10px] text-slate-500 font-mono">{inv.phone}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-semibold">{inv.name}</span>
                        <span className="block text-[10px] text-slate-500">
                          {inv.productType === 'daily' ? 'AO Rendimento Diário' : 'Fundo Fixo 90 Dias'}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-400">{inv.amount.toLocaleString()} Kz</td>
                      <td className="py-2.5 font-mono text-emerald-400">
                        {inv.productType === 'daily' ? `${inv.dailyProfit.toLocaleString()} Kz/dia` : 'Pago na maturação'}
                      </td>
                      <td className="py-2.5 font-mono text-slate-200">{inv.totalProfitEarned.toLocaleString()} Kz</td>
                      <td className="py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          inv.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          inv.status === 'paused' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {inv.status === 'active' && inv.productType === 'daily' && (
                            <button
                              onClick={() => {
                                setSelectedInvestmentForPayout(inv);
                                setManualPayoutAmount(inv.dailyProfit.toString());
                              }}
                              className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 font-bold px-2 py-1 rounded text-[10px] cursor-pointer inline-flex items-center gap-1 transition-colors"
                              title="Efetuar pagamento manual de juros"
                            >
                              <DollarSign className="h-3 w-3" /> Pagar Manual
                            </button>
                          )}

                          {inv.status === 'pending' ? (
                            <button
                              onClick={() => handleInvestmentAction(inv.id, 'activate')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer transition-colors"
                            >
                              Ativar Plano
                            </button>
                          ) : inv.status === 'active' && inv.productType === 'daily' ? (
                            <button
                              onClick={() => handleInvestmentAction(inv.id, 'pause')}
                              className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/20 font-bold px-2 py-1 rounded text-[10px] cursor-pointer transition-colors"
                            >
                              Pausar Plano
                            </button>
                          ) : inv.status === 'paused' ? (
                            <button
                              onClick={() => handleInvestmentAction(inv.id, 'resume')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer transition-colors"
                            >
                              Retomar Plano
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Maturado / Trancado</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB USUÁRIOS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 bg-slate-950/50 rounded-lg border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-400" /> Gestão de Utilizadores ({filteredUsers.length} de {totalUsers})
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Filtre utilizadores por estado, pesquise por nome ou número, e faça ações administrativas rápidas.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou telemóvel..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-48"
                />
                {/* Status Filter Buttons */}
                <div className="flex bg-slate-900 p-0.5 rounded border border-slate-800 w-full sm:w-auto">
                  {(['all', 'active', 'blocked'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setUserStatusFilter(status)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors w-full sm:w-auto text-center ${
                        userStatusFilter === status
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {status === 'all' && 'Todos'}
                      {status === 'active' && 'Ativos'}
                      {status === 'blocked' && 'Bloqueados'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5">Nome / Telefone</th>
                  <th className="py-2.5">Saldo Disponível</th>
                  <th className="py-2.5">Total Investido</th>
                  <th className="py-2.5">Ganhos de Vida</th>
                  <th className="py-2.5">Quem Convidou</th>
                  <th className="py-2.5">Estado</th>
                  <th className="py-2.5 text-right font-semibold">Ações Administrativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">Nenhum utilizador corresponde aos filtros aplicados.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u: any) => (
                    <tr key={u.phone} className="text-slate-300">
                      <td className="py-2.5 font-semibold text-white">
                        {u.name} {u.phone === currentPhone && <span className="text-emerald-400 text-[10px]">(Você)</span>}
                        <span className="block text-[10px] text-emerald-400 font-bold font-mono">Código: {u.myInviteCode || 'S/C'}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">Telefone: {u.phone}</span>
                      </td>
                      <td className="py-2.5 font-mono text-emerald-400 font-bold">{u.balance.toLocaleString()} Kz</td>
                      <td className="py-2.5 font-mono text-slate-400">{u.totalInvested.toLocaleString()} Kz</td>
                      <td className="py-2.5 font-mono text-slate-200">{u.totalEarnings.toLocaleString()} Kz</td>
                      <td className="py-2.5 text-xs text-slate-300">
                        {(() => {
                          if (!u.referredBy) return <span className="text-slate-500 font-mono text-[10px]">ADMIN/Direto</span>;
                          const sponsor = data.users.find((su: any) => su.phone === u.referredBy);
                          return sponsor 
                            ? <span className="block font-sans leading-tight text-slate-300 font-semibold">{sponsor.name} <span className="block text-[10px] text-emerald-400 font-mono font-bold mt-0.5">{sponsor.myInviteCode || sponsor.phone}</span></span>
                            : <span className="font-mono text-[10px] text-slate-500">{u.referredBy}</span>;
                        })()}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {u.phone !== '942691403' ? (
                          <div className="flex justify-end items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(u.phone)}
                              disabled={actionLoading !== null}
                              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-0.5 ${
                                u.status === 'active' 
                                  ? 'bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-500/20' 
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                              title={u.status === 'active' ? 'Bloquear / Suspender Usuário' : 'Ativar / Desbloquear Usuário'}
                            >
                              {u.status === 'active' ? (
                                <>
                                  <UserX className="h-3 w-3" /> Bloquear
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3 w-3" /> Desbloquear
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForReset(u);
                                setNewPasswordValue('');
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer transition-all flex items-center gap-0.5 shadow-md shadow-indigo-600/10"
                              title="Redefinir palavra-passe do usuário"
                            >
                              <RefreshCw className="h-3 w-3" /> Senha
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForProfitEdit(u);
                                setEditBalance(u.balance.toString());
                                setEditTotalEarnings(u.totalEarnings.toString());
                                setEditTotalInvested(u.totalInvested.toString());
                              }}
                              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer transition-all flex items-center gap-0.5 shadow-md shadow-teal-600/10"
                              title="Editar saldo e lucros diários do usuário"
                            >
                              <DollarSign className="h-3 w-3" /> Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.phone, u.name)}
                              disabled={actionLoading !== null}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer transition-all flex items-center gap-0.5 shadow-md shadow-rose-600/10"
                              title="Remover definitivamente"
                            >
                              <Trash2 className="h-3 w-3" /> Eliminar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-semibold italic">Administrador Mestre</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB COMISSÕES */}
        {activeTab === 'commissions' && (
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5">Afiliado que Ganhou</th>
                <th className="py-2.5">Nível</th>
                <th className="py-2.5">Convidado de Origem</th>
                <th className="py-2.5">Depósito Base</th>
                <th className="py-2.5">Comissão Creditada</th>
                <th className="py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.commissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Nenhuma comissão de rede gerada ainda.</td>
                </tr>
              ) : (
                data.commissions.map((c: any) => (
                  <tr key={c.id} className="text-slate-300">
                    <td className="py-2.5 font-semibold text-white">
                      {data.users.find((u: any) => u.phone === c.referrerPhone)?.name || c.referrerPhone}
                      <span className="block text-[10px] text-slate-500 font-mono">{c.referrerPhone}</span>
                    </td>
                    <td className="py-2.5 font-semibold text-slate-300">{c.level}º Nível ({c.percentage}%)</td>
                    <td className="py-2.5 font-mono text-slate-400">{c.referredPhone}</td>
                    <td className="py-2.5">
                      {data.deposits.find((d: any) => d.id === c.depositId)?.amount.toLocaleString() || '---'} Kz
                    </td>
                    <td className="py-2.5 font-mono font-bold text-emerald-400">{c.amount.toLocaleString()} Kz</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'credited' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-rose-400 border border-rose-500/20 line-through'
                      }`}>
                        {c.status === 'credited' ? 'ATIVO' : 'REVERTIDO'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB LOGS SEGURANÇA */}
        {activeTab === 'logs' && (() => {
          const securityLogs = data.securityLogs || [];
          const totalUsers = data.users ? data.users.length : 0;
          const userCapacityPercent = Math.min((totalUsers / 10000) * 100, 100);

          // Filtros e contagens rápidas
          const accessAttempts = securityLogs.filter((log: any) => 
            log.action?.includes('LOGIN') || log.action?.includes('LOCKOUT')
          );
          const successLogins = accessAttempts.filter((log: any) => log.action === 'LOGIN_SUCCESS');
          const failedLogins = accessAttempts.filter((log: any) => log.action === 'LOGIN_FAILED');
          
          const criticalOperations = securityLogs.filter((log: any) => 
            log.action?.includes('DELETED') || 
            log.action?.includes('RESET') || 
            log.action?.includes('EDITED') || 
            log.action?.includes('APPROVED') || 
            log.action?.includes('WITHDRAWAL_APPROVED') || 
            log.action?.includes('INVESTMENT_ACTIVATED') || 
            log.action?.includes('USER_BLOCKED') || 
            log.action?.includes('GIFT_CODE_CREATED') ||
            log.action?.includes('FRAUD')
          );
          
          const alertsCount = securityLogs.filter((log: any) => 
            log.action?.includes('FAILED') || 
            log.action?.includes('BLOCKED') || 
            log.action?.includes('FRAUD') || 
            log.action?.includes('REJECTED') || 
            log.action?.includes('LOCKOUT')
          ).length;

          const filteredLogs = securityLogs.filter((log: any) => {
            // Filtro de Categoria
            if (logFilter === 'access') {
              if (!log.action?.includes('LOGIN') && !log.action?.includes('LOCKOUT')) return false;
            } else if (logFilter === 'critical') {
              const isCrit = log.action?.includes('DELETED') || 
                             log.action?.includes('RESET') || 
                             log.action?.includes('EDITED') || 
                             log.action?.includes('APPROVED') || 
                             log.action?.includes('WITHDRAWAL_APPROVED') || 
                             log.action?.includes('INVESTMENT_ACTIVATED') || 
                             log.action?.includes('USER_BLOCKED') || 
                             log.action?.includes('GIFT_CODE_CREATED') ||
                             log.action?.includes('FRAUD');
              if (!isCrit) return false;
            } else if (logFilter === 'alerts') {
              const isAlert = log.action?.includes('FAILED') || 
                              log.action?.includes('BLOCKED') || 
                              log.action?.includes('FRAUD') || 
                              log.action?.includes('REJECTED') || 
                              log.action?.includes('LOCKOUT');
              if (!isAlert) return false;
            }
            
            // Filtro de Texto (Pesquisa)
            if (logSearch.trim()) {
              const query = logSearch.toLowerCase();
              const phoneMatch = log.phone ? log.phone.toLowerCase().includes(query) : false;
              const actionMatch = log.action ? log.action.toLowerCase().includes(query) : false;
              const detailsMatch = log.details ? log.details.toLowerCase().includes(query) : false;
              const ipMatch = log.ipAddress ? log.ipAddress.toLowerCase().includes(query) : false;
              return phoneMatch || actionMatch || detailsMatch || ipMatch;
            }
            
            return true;
          });

          return (
            <div className="space-y-6 font-sans">
              {/* Alerta de Auditoria / Sistema de Capacidade */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                    <Activity className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Monitor de Segurança MoneyAO
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        SISTEMA ATIVO
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Auditoria unificada e controlo de performance para garantir estabilidade com {totalUsers.toLocaleString()} de 10.000 usuários.
                    </p>
                  </div>
                </div>
                
                <div className="w-full md:w-auto min-w-[200px]">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>CAPACIDADE DO SISTEMA</span>
                    <span>{totalUsers.toLocaleString()} / 10.000</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        userCapacityPercent > 90 ? 'bg-rose-500' : userCapacityPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${userCapacityPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 text-right">
                    {10000 - totalUsers} registros restantes antes do limite.
                  </p>
                </div>
              </div>

              {/* Grid de Métricas de Logs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/85">
                  <div className="flex items-center justify-between text-slate-500 mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Acessos Totais</span>
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {accessAttempts.length}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400">
                    <span className="text-emerald-400 font-semibold">{successLogins.length} OK</span>
                    <span>/</span>
                    <span className="text-rose-400 font-semibold">{failedLogins.length} Falhas</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/85">
                  <div className="flex items-center justify-between text-slate-500 mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Ações Críticas</span>
                    <Shield className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold text-amber-400 font-mono">
                    {criticalOperations.length}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">
                    Operações administrativas e alterações de conta.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/85">
                  <div className="flex items-center justify-between text-slate-500 mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Alertas Ativos</span>
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                  </div>
                  <div className="text-lg font-bold text-rose-400 font-mono">
                    {alertsCount}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">
                    Erros de autenticação, fraudes ou bloqueios.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/85">
                  <div className="flex items-center justify-between text-slate-500 mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Registros Atuais</span>
                    <Users className="h-3.5 w-3.5 text-sky-400" />
                  </div>
                  <div className="text-lg font-bold text-sky-400 font-mono">
                    {totalUsers}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">
                    Total de utilizadores ativos sob limite de 10k.
                  </p>
                </div>
              </div>

              {/* Filtros e Barra de Pesquisa */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                <div className="flex flex-wrap gap-1.5 font-sans">
                  <button
                    onClick={() => setLogFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      logFilter === 'all'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-transparent'
                    }`}
                  >
                    Todos ({securityLogs.length})
                  </button>
                  <button
                    onClick={() => setLogFilter('access')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      logFilter === 'access'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-transparent'
                    }`}
                  >
                    Logins/Acessos ({accessAttempts.length})
                  </button>
                  <button
                    onClick={() => setLogFilter('critical')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      logFilter === 'critical'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-transparent'
                    }`}
                  >
                    Ações Críticas ({criticalOperations.length})
                  </button>
                  <button
                    onClick={() => setLogFilter('alerts')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      logFilter === 'alerts'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-transparent'
                    }`}
                  >
                    Alertas/Erros ({alertsCount})
                  </button>
                </div>

                <div className="relative w-full md:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrar por telefone, IP, termo..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 font-medium font-sans"
                  />
                  {logSearch && (
                    <button
                      onClick={() => setLogSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista Console dos Logs */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-[11px]">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-bold tracking-wider uppercase text-[10px]">Console de Auditoria Geral</span>
                  </div>
                  <span>Exibindo {filteredLogs.length} logs</span>
                </div>

                <div className="divide-y divide-slate-900/60 max-h-[380px] overflow-y-auto leading-relaxed text-slate-400">
                  {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-600 font-sans">
                      Nenhum registro encontrado correspondente aos critérios selecionados.
                    </div>
                  ) : (
                    filteredLogs.slice().reverse().map((log: any) => {
                      const isLockoutOrFraud = log.action?.includes('FRAUD') || log.action?.includes('LOCKOUT') || log.action?.includes('BLOCKED');
                      const isFail = log.action?.includes('FAILED') || log.action?.includes('REJECTED');
                      const isSuccess = log.action?.includes('APPROVED') || log.action?.includes('SUCCESS') || log.action?.includes('REGISTER');
                      const isCriticalAdmin = log.action?.includes('DELETED') || log.action?.includes('RESET') || log.action?.includes('EDITED') || log.action?.includes('GIFT_CODE_CREATED');

                      let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
                      if (isLockoutOrFraud) badgeColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                      else if (isFail) badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                      else if (isSuccess) badgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                      else if (isCriticalAdmin) badgeColor = "bg-violet-500/10 text-violet-400 border border-violet-500/20";

                      return (
                        <div key={log.id} className="hover:bg-slate-900/40 p-3 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-slate-600 font-semibold shrink-0">
                                [{new Date(log.createdAt).toLocaleTimeString('pt-AO', { timeZone: 'Africa/Luanda' })}]
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                                {log.action}
                              </span>
                              {log.phone && (
                                <span className="text-slate-500 font-mono font-bold shrink-0">
                                  ({log.phone})
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 font-sans text-xs pt-0.5 leading-snug">
                              {log.details}
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0 font-mono flex flex-row md:flex-col justify-between items-center md:items-end text-[10px] text-slate-500 border-t border-slate-900 md:border-t-0 pt-1.5 md:pt-0">
                            <span className="block font-semibold">IP: {log.ipAddress || '127.0.0.1'}</span>
                            <span className="text-slate-600 block text-[9px] mt-0.5">ID: {log.id}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB CÓDIGOS DE PRESENTES (GIFT CODES) */}
        {activeTab === 'gifts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
            {/* Formulário de Criação */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 h-fit">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Gift className="h-4 w-4 text-emerald-400" />
                Criar Código de Presente
              </h4>
              <form onSubmit={handleCreateGiftCode} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Código Promocional</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BONUS-WAT-2026"
                    value={giftCodeName}
                    onChange={(e) => setGiftCodeName(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg text-xs px-3 py-2.5 font-bold uppercase focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Valor do Presente (Kz)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ex: 5000"
                    value={giftCodeAmount}
                    onChange={(e) => setGiftCodeAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg text-xs px-3 py-2.5 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Limite de Utilizações (Usuários)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ex: 10"
                    value={giftCodeMaxUses}
                    onChange={(e) => setGiftCodeMaxUses(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg text-xs px-3 py-2.5 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-500 mt-1 block">Número máximo de utilizadores diferentes que podem resgatar este código.</span>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading === 'create_gift_code'}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  {actionLoading === 'create_gift_code' ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Gerar Código de Presente
                </button>
              </form>
            </div>

            {/* Tabela de Códigos Existentes */}
            <div className="lg:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-hidden">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <ListOrdered className="h-4 w-4 text-emerald-400" />
                Códigos de Presentes Disponíveis
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[10px] uppercase">
                      <th className="py-2.5 px-2">Código</th>
                      <th className="py-2.5 px-2">Valor (Kz)</th>
                      <th className="py-2.5 px-2 text-center">Usos</th>
                      <th className="py-2.5 px-2">Data Criação</th>
                      <th className="py-2.5 px-2">Estado</th>
                      <th className="py-2.5 px-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {!data.giftCodes || data.giftCodes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 text-[11px] italic">
                          Nenhum código de presente criado no sistema.
                        </td>
                      </tr>
                    ) : (
                      data.giftCodes.slice().reverse().map((gift: any) => (
                        <tr key={gift.id} className="text-slate-300 hover:bg-slate-900/30 transition-colors">
                          <td className="py-2.5 px-2 font-mono font-bold text-emerald-400 select-all">{gift.code}</td>
                          <td className="py-2.5 px-2 font-mono font-semibold text-white">{gift.amount.toLocaleString()} Kz</td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-mono text-xs text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-bold">
                              {gift.usesCount} / {gift.maxUses}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-mono text-slate-500 text-[10px]">
                            {new Date(gift.createdAt).toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' })}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              gift.status === 'active' && gift.usesCount < gift.maxUses
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {gift.status === 'active' && gift.usesCount < gift.maxUses ? 'ATIVO' : 'INATIVO'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteGiftCode(gift.id, gift.code)}
                              disabled={actionLoading === `delete_gift_${gift.id}`}
                              className="bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg p-1.5 transition-colors cursor-pointer inline-flex items-center justify-center active:scale-95"
                              title="Eliminar Código"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB PEDIDOS DE RECUPERAÇÃO */}
        {activeTab === 'recoveries' && (
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5">ID Pedido</th>
                <th className="py-2.5">Utilizador</th>
                <th className="py-2.5">Telemóvel</th>
                <th className="py-2.5">Solicitado Em</th>
                <th className="py-2.5">Estado</th>
                <th className="py-2.5 text-right font-semibold">Ação do Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {!data.recoveryRequests || data.recoveryRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Nenhum pedido de recuperação pendente no sistema.</td>
                </tr>
              ) : (
                data.recoveryRequests.slice().reverse().map((req: any) => (
                  <tr key={req.id} className="text-slate-300">
                    <td className="py-2.5 font-mono text-slate-500 font-bold">{req.id}</td>
                    <td className="py-2.5 font-semibold text-white">{req.name}</td>
                    <td className="py-2.5 font-mono text-emerald-400">{req.phone}</td>
                    <td className="py-2.5 font-mono text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' })} às {new Date(req.createdAt).toLocaleTimeString('pt-AO', { timeZone: 'Africa/Luanda' })}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'pending' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {req.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForReset({ phone: req.phone, name: req.name });
                            setNewPasswordValue('Redefinida123!');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer inline-flex items-center gap-1 shadow-md shadow-emerald-600/10 transition-colors"
                        >
                          <Check className="h-3 w-3" /> Redefinir Credenciais
                        </button>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic">
                          Senha Temp: <span className="font-mono font-bold text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{req.newPasswordTemp || 'Modificada'}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL REDEFINIR PALAVRA-PASSE */}
      {selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <button
              onClick={() => setSelectedUserForReset(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Shield className="h-5 w-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Redefinir Palavra-passe</h3>
                <p className="text-[10px] text-slate-400">Utilizador: {selectedUserForReset.name} ({selectedUserForReset.phone})</p>
              </div>
            </div>

            <form onSubmit={handleUserPasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nova Palavra-passe</label>
                <input
                  type="text"
                  required
                  placeholder="Escreva a nova senha"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForReset(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {actionLoading === `reset_password_${selectedUserForReset.phone}` ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Confirmar Redefinição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR SALDO E LUCROS */}
      {selectedUserForProfitEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <button
              onClick={() => setSelectedUserForProfitEdit(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <DollarSign className="h-5 w-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Editar Saldo e Lucros Diários</h3>
                <p className="text-[10px] text-slate-400">Utilizador: {selectedUserForProfitEdit.name} ({selectedUserForProfitEdit.phone})</p>
              </div>
            </div>

            <form onSubmit={handleUserProfitEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Saldo Disponível (Kz)</label>
                <input
                  type="number"
                  required
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Ganhos Acumulados (Kz)</label>
                <input
                  type="number"
                  required
                  value={editTotalEarnings}
                  onChange={(e) => setEditTotalEarnings(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Total Investido (Kz)</label>
                <input
                  type="number"
                  required
                  value={editTotalInvested}
                  onChange={(e) => setEditTotalInvested(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForProfitEdit(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {actionLoading === `edit_profit_${selectedUserForProfitEdit.phone}` ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAGAMENTO MANUAL DE RENDIMENTO */}
      {selectedInvestmentForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <button
              onClick={() => setSelectedInvestmentForPayout(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Lançar Rendimento Manual</h3>
                <p className="text-[10px] text-slate-400">Plano: {selectedInvestmentForPayout.name} (ID: {selectedInvestmentForPayout.id})</p>
              </div>
            </div>

            <form onSubmit={handleManualPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Valor do Rendimento a Pagar (Kz)</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 5000"
                  value={manualPayoutAmount}
                  onChange={(e) => setManualPayoutAmount(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvestmentForPayout(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {actionLoading === `manual_payout_${selectedInvestmentForPayout.id}` ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Creditar Rendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <button
              onClick={() => setViewingDeposit(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <FileText className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Visualizador de Documentos & Comprovativos</h3>
                <p className="text-[10px] text-slate-400">Verificação eletrónica de aportes no sistema MoneyAO</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Informações da Transação */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase font-semibold text-[9px]">Utilizador / Titular</span>
                  <span className="font-bold text-white">{data.users.find((u: any) => u.phone === viewingDeposit.phone)?.name || viewingDeposit.phone}</span>
                  <span className="block text-slate-500 text-[10px] font-mono">{viewingDeposit.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold text-[9px]">Valor Enviado</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">{viewingDeposit.amount.toLocaleString()} Kz</span>
                </div>
                <div className="border-t border-slate-800/60 pt-2 mt-1">
                  <span className="text-slate-500 block uppercase font-semibold text-[9px]">Origem / Banco</span>
                  <span className="font-semibold text-slate-300">{viewingDeposit.provider}</span>
                </div>
                <div className="border-t border-slate-800/60 pt-2 mt-1">
                  <span className="text-slate-500 block uppercase font-semibold text-[9px]">Referência Utilizada</span>
                  <span className="font-mono text-slate-300 font-semibold">{viewingDeposit.reference}</span>
                </div>
                <div className="col-span-2 border-t border-slate-800/60 pt-2 mt-1">
                  <span className="text-slate-500 block uppercase font-semibold text-[9px]">Data & Hora do Registo</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(viewingDeposit.createdAt).toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' })} às {new Date(viewingDeposit.createdAt).toLocaleTimeString('pt-AO', { timeZone: 'Africa/Luanda' })}
                  </span>
                </div>
              </div>

              {/* Visualizador de Imagem / Recibo Digital */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Documento de Comprovativo Recebido:</span>
                
                {viewingDeposit.receiptUrl && viewingDeposit.receiptUrl.startsWith('data:') ? (
                  <div className="space-y-2.5">
                    {viewingDeposit.receiptUrl.includes('application/pdf') ? (
                      // Visualizador de PDF NATIVO de Alta Resolução
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 overflow-hidden flex flex-col items-center">
                        <object
                          data={viewingDeposit.receiptUrl}
                          type="application/pdf"
                          className="w-full h-[320px] rounded border border-slate-800"
                        >
                          <div className="text-center py-10 px-4 bg-slate-900/40 rounded border border-slate-800 space-y-3">
                            <FileText className="h-10 w-10 text-emerald-400 mx-auto" />
                            <p className="text-xs text-slate-300">Este é um comprovativo em formato PDF profissional.</p>
                            <a
                              href={viewingDeposit.receiptUrl}
                              download={`comprovativo_${viewingDeposit.id}.pdf`}
                              className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors cursor-pointer"
                            >
                              Baixar PDF do Comprovativo
                            </a>
                          </div>
                        </object>
                      </div>
                    ) : (
                      // Imagem Real / Screenshot de Alta Resolução
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 overflow-hidden flex flex-col items-center justify-center max-h-[340px] relative group">
                        <img
                          src={viewingDeposit.receiptUrl}
                          alt="Comprovativo Real Enviado"
                          className="max-h-[300px] max-w-full rounded object-contain cursor-zoom-in hover:brightness-110 transition-all"
                          referrerPolicy="no-referrer"
                          onClick={() => {
                            setIsLightboxOpen(true);
                            setLightboxZoom(1);
                            setLightboxRotation(0);
                            setLightboxPan({ x: 0, y: 0 });
                          }}
                        />
                        <div className="absolute bottom-4 bg-slate-950/85 backdrop-blur text-[10px] text-emerald-400 font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1 border border-emerald-500/20">
                          <ZoomIn className="h-3 w-3" /> Clique para Ampliar & Rodar
                        </div>
                      </div>
                    )}

                    {/* Barra de utilitários de alta resolução */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLightboxOpen(true);
                          setLightboxZoom(1);
                          setLightboxRotation(0);
                          setLightboxPan({ x: 0, y: 0 });
                        }}
                        className="flex-1 py-1.5 rounded-lg text-center text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ZoomIn className="h-3.5 w-3.5" /> Abrir Visualizador Interativo
                      </button>
                      
                      <a
                        href={viewingDeposit.receiptUrl}
                        download={viewingDeposit.receiptUrl.includes('application/pdf') ? `comprovativo_${viewingDeposit.id}.pdf` : `comprovativo_${viewingDeposit.id}.png`}
                        className="px-3 py-1.5 rounded-lg text-center text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Baixar Ficheiro
                      </a>
                    </div>
                  </div>
                ) : (
                  // Recibo Bancário Digital Simulado de Angola
                  <div className="rounded-xl border border-slate-200 bg-white text-slate-900 p-5 font-sans relative overflow-hidden shadow-inner select-none">
                    {/* Marca d'água de segurança */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-12">
                      <Landmark className="h-64 w-64 text-slate-950" />
                    </div>

                    <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-600 block leading-none">MONEYAO INVESTIMENTOS</span>
                        <span className="text-[9px] text-slate-400">Recibo de Transação Eletrónica</span>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase ${
                        viewingDeposit.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        viewingDeposit.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                        'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {viewingDeposit.status}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-[11px] leading-relaxed">
                      <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                        <span className="text-slate-400">Canal de Transmissão:</span>
                        <strong className="text-slate-800">{viewingDeposit.provider}</strong>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                        <span className="text-slate-400">Meio Utilizado:</span>
                        <strong className="text-slate-800 font-sans uppercase">
                          {viewingDeposit.method === 'reference' 
                            ? 'Pagamento por Referência' 
                            : viewingDeposit.method === 'crypto' 
                              ? 'USDT / TRX (RedotPay)' 
                              : 'Transferência Bancária'}
                        </strong>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                        <span className="text-slate-400">Referência do Pagador:</span>
                        <strong className="text-slate-800 font-mono">{viewingDeposit.reference}</strong>
                      </div>
                      {viewingDeposit.transactionId && (
                        <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                          <span className="text-slate-400 text-amber-600 font-semibold">Nº Transação (ID):</span>
                          <strong className="text-amber-700 font-mono font-bold uppercase">{viewingDeposit.transactionId}</strong>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                        <span className="text-slate-400">Beneficiário Principal:</span>
                        <strong className="text-slate-800">LUIS CALEMBELA (Fundador)</strong>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                        <span className="text-slate-400">ID Único da Operação:</span>
                        <strong className="text-slate-800 font-mono">{viewingDeposit.id.toUpperCase()}</strong>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                        <span className="text-slate-400">Data e Hora de Registo:</span>
                        <span className="text-slate-700 font-mono">{new Date(viewingDeposit.createdAt).toLocaleString('pt-AO', { timeZone: 'Africa/Luanda' })}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-100 mt-2">
                        <span className="text-slate-500 font-medium text-[10px]">VALOR DO APORTE:</span>
                        <strong className="text-emerald-600 font-mono text-sm">{viewingDeposit.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</strong>
                      </div>
                    </div>

                    <div className="text-center text-[8px] text-slate-400 mt-4 border-t border-slate-100 pt-3 flex items-center justify-center gap-1">
                      <Shield className="h-3 w-3 text-emerald-500" />
                      Assinatura de Segurança MoneyAO: SHA256/AO-SECURE-942691403
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-800 flex justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setViewingDeposit(null)}
                className="w-1/3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer text-center"
              >
                Fechar
              </button>

              {viewingDeposit.status === 'pending' ? (
                <div className="flex gap-1.5 w-2/3">
                  <button
                    type="button"
                    onClick={() => {
                      handleDepositAction(viewingDeposit.id, 'reject');
                      setViewingDeposit(null);
                    }}
                    disabled={actionLoading !== null}
                    className="w-1/2 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Rejeitar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDepositAction(viewingDeposit.id, 'approve');
                      setViewingDeposit(null);
                    }}
                    disabled={actionLoading !== null}
                    className="w-1/2 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-emerald-600/10"
                  >
                    <Check className="h-3.5 w-3.5" /> Aprovar
                  </button>
                </div>
              ) : (
                <div className="w-2/3 flex justify-end items-center">
                  <span className="text-[10px] text-slate-500 italic">
                    Transação já concluída e processada.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isLightboxOpen && viewingDeposit && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 select-none">
          {/* Header */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-slate-950/80 to-transparent flex items-center justify-between px-6 z-10">
            <div>
              <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {data?.users?.find((u: any) => u.phone === viewingDeposit.phone)?.name || viewingDeposit.phone}
              </h4>
              <p className="text-[10px] text-emerald-400 font-mono font-bold tracking-wide">
                Comprovante de {viewingDeposit.amount.toLocaleString()} Kz • {viewingDeposit.provider}
              </p>
            </div>
            <button
              onClick={() => {
                setIsLightboxOpen(false);
                setLightboxZoom(1);
                setLightboxRotation(0);
                setLightboxPan({ x: 0, y: 0 });
              }}
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Canvas Area */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing relative"
            onMouseDown={(e) => {
              if (lightboxZoom <= 1) return;
              setIsDragging(true);
              setDragStart({ x: e.clientX - lightboxPan.x, y: e.clientY - lightboxPan.y });
            }}
            onMouseMove={(e) => {
              if (!isDragging) return;
              setLightboxPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
              });
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <div 
              style={{
                transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
              className="max-h-[80vh] max-w-[95vw] flex items-center justify-center shadow-2xl rounded-lg bg-slate-950/50"
            >
              <img
                src={viewingDeposit.receiptUrl}
                alt="Comprovante Ampliado"
                className="max-h-[75vh] max-w-[90vw] object-contain rounded pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Controls Bar */}
          <div className="absolute bottom-6 bg-slate-900/90 backdrop-blur border border-slate-800 px-4 py-2.5 rounded-full flex items-center gap-4 shadow-xl z-10 text-xs text-slate-300">
            <button
              onClick={() => setLightboxZoom(prev => Math.min(prev + 0.25, 4))}
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer px-2.5 py-1 hover:bg-slate-800 rounded-lg font-bold"
              title="Aumentar Zoom"
            >
              <ZoomIn className="h-4 w-4 text-emerald-400" /> <span className="hidden sm:inline">Zoom +</span>
            </button>
            <button
              onClick={() => {
                setLightboxZoom(prev => {
                  const next = Math.max(prev - 0.25, 0.5);
                  if (next <= 1) setLightboxPan({ x: 0, y: 0 }); // Reset pan if zoomed out
                  return next;
                });
              }}
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer px-2.5 py-1 hover:bg-slate-800 rounded-lg font-bold"
              title="Diminuir Zoom"
            >
              <ZoomOut className="h-4 w-4 text-emerald-400" /> <span className="hidden sm:inline">Zoom -</span>
            </button>
            <div className="h-4 w-px bg-slate-800"></div>
            <button
              onClick={() => setLightboxRotation(prev => (prev + 90) % 360)}
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer px-2.5 py-1 hover:bg-slate-800 rounded-lg font-bold"
              title="Rodar Documento"
            >
              <RotateCw className="h-4 w-4 text-emerald-400" /> <span className="hidden sm:inline">Rodar 90°</span>
            </button>
            <div className="h-4 w-px bg-slate-800"></div>
            <button
              onClick={() => {
                setLightboxZoom(1);
                setLightboxRotation(0);
                setLightboxPan({ x: 0, y: 0 });
              }}
              className="hover:text-emerald-400 transition-colors cursor-pointer px-2.5 py-1 hover:bg-slate-800 rounded-lg font-bold"
              title="Restaurar visualização padrão"
            >
              Restaurar
            </button>
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline-block">
              Zoom: {Math.round(lightboxZoom * 100)}% | Rotação: {lightboxRotation}°
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
