import React, { useState } from 'react';
import { 
  Shield, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff, 
  Bell, BellRing, Smartphone, TrendingUp, Gift, ArrowDownCircle, ArrowUpCircle, HelpCircle,
  Sparkles, Sun, Moon
} from 'lucide-react';
import { motion } from 'motion/react';

interface SecuritySettingsProps {
  userPhone: string;
  onPasswordChanged?: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

interface NotificationPrefs {
  deposits: boolean;
  earnings: boolean;
  commissions: boolean;
  withdrawals: boolean;
}

export default function SecuritySettings({ userPhone, onPasswordChanged, theme, setTheme }: SecuritySettingsProps) {
  // --- ESTADOS DE ALTERAÇÃO DE PALAVRA-PASSE ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- ESTADOS DE PREFERÊNCIAS DE NOTIFICAÇÕES PUSH ---
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => {
    const key = `moneyao_push_settings_${userPhone}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback se JSON estiver inválido
      }
    }
    return {
      deposits: true,
      earnings: true,
      commissions: true,
      withdrawals: true
    };
  });

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [prefsSuccess, setPrefsSuccess] = useState<string | null>(null);

  // --- HANDLERS ---
  const handleTogglePref = (type: keyof NotificationPrefs) => {
    const updated = {
      ...prefs,
      [type]: !prefs[type]
    };
    setPrefs(updated);
    const key = `moneyao_push_settings_${userPhone}`;
    localStorage.setItem(key, JSON.stringify(updated));
    
    setPrefsSuccess('Preferências salvas com sucesso!');
    setTimeout(() => setPrefsSuccess(null), 3000);
  };

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification('Notificações Ativas! 🔔', {
            body: 'Agora receberá alertas importantes sobre a sua conta MoneyAO diretamente no seu ecrã.',
            icon: '/favicon.ico'
          });
        }
      } catch (err) {
        console.error('Erro ao solicitar permissão de notificações:', err);
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('As novas palavras-passe digitadas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: userPhone,
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao alterar a palavra-passe.');
      }

      setSuccess(data.message || 'Palavra-passe alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      if (onPasswordChanged) {
        onPasswordChanged();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto items-start font-sans">
      
      {/* CARD 1: ALTERAR PALAVRA-PASSE */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute right-3 top-3 opacity-5 pointer-events-none">
          <Shield className="h-24 w-24 text-emerald-400" />
        </div>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Alterar Palavra-passe</h3>
            <p className="text-xs text-slate-400 mt-0.5">Mantenha a sua conta de investimentos segura e atualizada.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-rose-500/10 p-3.5 text-xs text-rose-400 border border-rose-500/20 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-emerald-500/10 p-3.5 text-xs text-emerald-400 border border-emerald-500/20 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Senha Atual */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Palavra-passe Atual
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                placeholder="Digite a palavra-passe atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-3 pr-10 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nova Palavra-passe
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-3 pr-10 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nova Senha */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Confirmar Nova Palavra-passe
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="Repita a nova palavra-passe"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-3 pr-10 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white py-2.5 rounded-lg font-bold text-xs cursor-pointer transition-opacity"
          >
            {loading ? 'A alterar...' : 'Atualizar Palavra-passe'}
          </button>
        </form>
      </motion.div>

      {/* CARD 2: GESTÃO DE NOTIFICAÇÕES PUSH */}
      <motion.div
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute right-3 top-3 opacity-5 pointer-events-none">
          <Bell className="h-24 w-24 text-emerald-400" />
        </div>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Notificações Push & Alertas</h3>
            <p className="text-xs text-slate-400 mt-0.5">Gerencie como e quando deseja receber alertas na plataforma.</p>
          </div>
        </div>

        {/* Notificações do Navegador (Estado de Permissão) */}
        <div className="mb-6 p-4 rounded-xl border bg-slate-950/60 space-y-3">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-white">
              <Smartphone className="h-4 w-4 text-emerald-400" />
              <span>Notificações do Navegador</span>
            </div>
            
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              notificationPermission === 'granted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              notificationPermission === 'denied' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {notificationPermission === 'granted' ? 'Ativas' :
               notificationPermission === 'denied' ? 'Bloqueadas' :
               notificationPermission === 'unsupported' ? 'Não Suportado' : 'Pedir Permissão'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Ative as notificações de sistema nativas para ser alertado instantaneamente mesmo quando a aba do MoneyAO estiver em segundo plano.
          </p>

          {notificationPermission === 'default' && (
            <button
              onClick={requestBrowserPermission}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
            >
              Habilitar Notificações do Navegador
            </button>
          )}

          {notificationPermission === 'denied' && (
            <div className="flex items-center gap-1.5 text-[10px] text-rose-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Desbloqueie as notificações na barra de endereços do seu browser.</span>
            </div>
          )}

          {notificationPermission === 'granted' && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Notificações de sistema autorizadas com sucesso!</span>
            </div>
          )}
        </div>

        {/* FEEDBACK DE ATUALIZAÇÃO DOS TOGGLES */}
        {prefsSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3.5 py-2 text-[11px] text-emerald-400 border border-emerald-500/20 animate-fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{prefsSuccess}</span>
          </div>
        )}

        {/* LISTA DE PREFERÊNCIAS DE FILTRO */}
        <div className="space-y-4 border-t border-slate-800 pt-4">
          <span className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-3">Filtrar Alertas por Categoria</span>

          {/* 1. DEPÓSITOS */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-800 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg shrink-0 mt-0.5">
                <ArrowDownCircle className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Depósitos e Recargas</span>
                <span className="block text-[11px] text-slate-400 leading-normal font-sans">Aprovação ou rejeição de carregamentos de saldo.</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => handleTogglePref('deposits')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.deposits ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  prefs.deposits ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. RENDIMENTOS */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-800 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg shrink-0 mt-0.5">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Rendimentos de Aplicações</span>
                <span className="block text-[11px] text-slate-400 leading-normal font-sans">Rendimentos diários libertados dos seus produtos AO.</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => handleTogglePref('earnings')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.earnings ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  prefs.earnings ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. COMISSÕES DE AFILIADOS */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-800 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg shrink-0 mt-0.5">
                <Gift className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Comissão de Rede (Afiliados)</span>
                <span className="block text-[11px] text-slate-400 leading-normal font-sans">Bónus recebidos por convite e depósitos diretos da equipa.</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => handleTogglePref('commissions')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.commissions ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  prefs.commissions ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. LEVANTAMENTOS */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-800 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg shrink-0 mt-0.5">
                <ArrowUpCircle className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Levantamentos e Pagamentos</span>
                <span className="block text-[11px] text-slate-400 leading-normal font-sans">Estatuto de pedidos de saque (pagos ou rejeitados).</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => handleTogglePref('withdrawals')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.withdrawals ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  prefs.withdrawals ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-5 p-3 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-1.5 font-sans leading-relaxed">
          <HelpCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Note que as notificações in-app em forma de cartões flutuantes continuarão operantes no canto inferior para garantir que não perde eventos fulcrais enquanto navega no site.</span>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-center">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('moneyao_restart_welcome_tour'));
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 font-extrabold text-[11px] cursor-pointer transition-colors active:scale-95 shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Refazer Tour de Boas-vindas</span>
          </button>
        </div>
      </motion.div>

      {/* CARD 3: CONFIGURAÇÃO DE TEMA (APARÊNCIA) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="col-span-1 lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute right-3 top-3 opacity-5 pointer-events-none">
          <Sun className="h-24 w-24 text-emerald-400" />
        </div>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sun className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Personalização de Tema</h3>
            <p className="text-xs text-slate-400 mt-0.5">Escolha o seu esquema de cores preferido para a plataforma.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opção Escuro */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer active:scale-[0.98] ${
              theme === 'dark'
                ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border shrink-0 ${
                theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold">Tema Escuro (Padrão)</span>
                <span className="block text-[11px] text-slate-500 leading-normal font-sans">Ideal para ambientes de baixa luminosidade e economia de bateria.</span>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            )}
          </button>

          {/* Opção Claro */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer active:scale-[0.98] ${
              theme === 'light'
                ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border shrink-0 ${
                theme === 'light' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold">Tema Claro</span>
                <span className="block text-[11px] text-slate-500 leading-normal font-sans">Esquema de alto contraste visual para leitura confortável durante o dia.</span>
              </div>
            </div>
            {theme === 'light' && (
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            )}
          </button>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/50 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed font-sans">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>O tema escolhido é persistido localmente no seu dispositivo de forma segura, mantendo as suas preferências de leitura intactas nas próximas visitas.</span>
        </div>
      </motion.div>
    </div>
  );
}
