import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, LogOut, Wallet, Gift, ShieldAlert, Clock, 
  Layers, Menu, X, Landmark, RefreshCw, TrendingUp, ArrowDownCircle, ArrowUpCircle, KeyRound, BookOpen, HelpCircle,
  MessageCircle, Smartphone, Download, Bell, BellRing, CreditCard, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Importando componentes modulares
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import Affiliates from './components/Affiliates.tsx';
import AdminSimulation from './components/AdminSimulation.tsx';
import SecuritySettings from './components/SecuritySettings.tsx';
import Presentation from './components/Presentation.tsx';
import Support from './components/Support.tsx';
import FAQ from './components/FAQ.tsx';
import WelcomeTour from './components/WelcomeTour.tsx';
import { decryptInviteCode } from './utils/security.ts';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('moneyao_theme');
      if (stored) {
        return stored === 'light' ? 'light' : 'dark';
      }
      // Detecção automática do tema do sistema operacional do utilizador
      const systemPrefersLight = typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: light)').matches;
      return systemPrefersLight ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
      localStorage.setItem('moneyao_theme', theme);
    } catch (e) {
      console.error('Erro ao salvar tema:', e);
    }
  }, [theme]);

  const [loggedInUser, setLoggedInUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('moneyao_user_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [simulatedTime, setSimulatedTime] = useState<string>(new Date().toISOString());
  const [currentTab, setCurrentTab] = useState<'overview' | 'cards' | 'investments' | 'fixed_funds' | 'funds' | 'withdrawals' | 'affiliates' | 'security' | 'presentation' | 'support' | 'faq' | 'admin'>('overview');
  
  // Controle de boas-vindas ao iniciar sessão
  const [showSessionWelcome, setShowSessionWelcome] = useState<boolean>(false);

  useEffect(() => {
    if (loggedInUser) {
      const welcomeShown = sessionStorage.getItem('moneyao_session_welcome_shown');
      if (!welcomeShown) {
        setShowSessionWelcome(true);
        sessionStorage.setItem('moneyao_session_welcome_shown', 'true');
      }
    }
  }, [loggedInUser]);
  
  // Controle de segurança do painel de administração (Acesso oculto)
  const [showAdminTab, setShowAdminTab] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('moneyao_user_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.phone === '942691403' && parsed?.role === 'admin';
      }
    } catch {}
    return false;
  });
  
  // Código de convite capturado da URL
  const [capturedInviteCode, setCapturedInviteCode] = useState<string>('');
  
  // Controle de alertas e inatividade
  const [inactivityAlert, setInactivityAlert] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SISTEMA DE NOTIFICAÇÕES E TOASTS IN-APP
  const [toasts, setToasts] = useState<any[]>([]);

  // Adiciona um toast in-app elegante
  const addInAppToast = useCallback((title: string, body: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, body, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  }, []);

  // Disparador unificado de notificações (Nativas do Navegador + Fallback Toast In-App)
  const triggerNotification = useCallback((title: string, body: string) => {
    // 1. Tentar notificação nativa do navegador se suportada e permitida
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico'
          });
        } catch (e) {
          console.error('Erro ao acionar notificação nativa:', e);
        }
      }
    }
    // 2. Sempre disparar o Toast In-App para máxima confiabilidade e visibilidade (especialmente no iframe)
    addInAppToast(title, body);
  }, [addInAppToast]);

  // Compara estado de transações para emitir alertas push em tempo real de depósitos aprovados e rendimentos recebidos
  const checkAndNotifyTransactions = useCallback((phone: string, newTxs: any[]) => {
    try {
      const storageKey = `moneyao_tx_status_${phone}`;
      const stored = localStorage.getItem(storageKey);
      const statusMap: Record<string, string> = stored ? JSON.parse(stored) : {};
      
      const isFirstLoad = Object.keys(statusMap).length === 0;
      let updatedMap = { ...statusMap };
      let changed = false;

      // Carregar preferências de notificações push do utilizador
      const prefsKey = `moneyao_push_settings_${phone}`;
      const prefsStored = localStorage.getItem(prefsKey);
      const prefs = prefsStored ? JSON.parse(prefsStored) : {
        deposits: true,
        earnings: true,
        commissions: true,
        withdrawals: true
      };

      newTxs.forEach((tx: any) => {
        const txId = tx.id;
        const currentStatus = tx.status;
        const previousStatus = statusMap[txId];

        if (!previousStatus) {
          // Nova transação identificada!
          updatedMap[txId] = currentStatus;
          changed = true;

          // Se não for o carregamento inicial da conta, alerta o utilizador
          if (!isFirstLoad) {
            if (tx.type === 'DEPÓSITO' && currentStatus === 'approved') {
              if (prefs.deposits) {
                triggerNotification('Depósito Aprovado! ✅', `O seu depósito de ${Number(tx.amount).toLocaleString('pt-PT')} Kz foi creditado na sua conta.`);
              }
            } else if (tx.type === 'RENDIMENTO') {
              if (prefs.earnings) {
                triggerNotification('Rendimento Recebido! 📈', `Recebeu +${Number(tx.amount).toLocaleString('pt-PT')} Kz de rendimento da sua aplicação (${tx.details}).`);
              }
            } else if (tx.type === 'COMISSÃO AFILIADO') {
              if (prefs.commissions) {
                triggerNotification('Comissão de Rede! 👥', `Recebeu +${Number(tx.amount).toLocaleString('pt-PT')} Kz de bónus por recomendação direta.`);
              }
            } else if (tx.type === 'LEVANTAMENTO' && currentStatus === 'approved') {
              if (prefs.withdrawals) {
                triggerNotification('Levantamento Pago! 🏦', `O seu levantamento de ${Math.abs(Number(tx.amount)).toLocaleString('pt-PT')} Kz foi concluído com sucesso.`);
              }
            } else if (tx.type === 'LEVANTAMENTO' && currentStatus === 'rejected') {
              if (prefs.withdrawals) {
                triggerNotification('Levantamento Rejeitado! ⚠️', `O seu levantamento de ${Math.abs(Number(tx.amount)).toLocaleString('pt-PT')} Kz foi recusado e o saldo foi devolvido.`);
              }
            }
          }
        } else if (previousStatus !== currentStatus) {
          // Atualização de status em transação existente!
          updatedMap[txId] = currentStatus;
          changed = true;

          if (tx.type === 'DEPÓSITO' && currentStatus === 'approved') {
            if (prefs.deposits) {
              triggerNotification('Depósito Aprovado! ✅', `O seu depósito de ${Number(tx.amount).toLocaleString('pt-PT')} Kz foi aprovado com sucesso!`);
            }
          } else if (tx.type === 'DEPÓSITO' && currentStatus === 'rejected') {
            if (prefs.deposits) {
              triggerNotification('Depósito Rejeitado! ❌', `O comprovativo do seu depósito de ${Number(tx.amount).toLocaleString('pt-PT')} Kz foi rejeitado pelo administrador.`);
            }
          } else if (tx.type === 'LEVANTAMENTO' && currentStatus === 'approved') {
            if (prefs.withdrawals) {
              triggerNotification('Levantamento Pago! 🏦', `O seu pedido de levantamento de ${Math.abs(Number(tx.amount)).toLocaleString('pt-PT')} Kz foi processado e pago.`);
            }
          } else if (tx.type === 'LEVANTAMENTO' && currentStatus === 'rejected') {
            if (prefs.withdrawals) {
              triggerNotification('Levantamento Devolvido! ⚠️', `O seu pedido de levantamento de ${Math.abs(Number(tx.amount)).toLocaleString('pt-PT')} Kz foi rejeitado.`);
            }
          }
        }
      });

      if (changed || isFirstLoad) {
        localStorage.setItem(storageKey, JSON.stringify(updatedMap));
      }
    } catch (err) {
      console.error('Erro no rastreador de notificações:', err);
    }
  }, [triggerNotification]);

  // Redirecionamento de segurança para impedir acessos diretos à tab admin
  useEffect(() => {
    if (currentTab === 'admin' && !showAdminTab) {
      setCurrentTab('overview');
    }
  }, [currentTab, showAdminTab]);

  const handleLogoClick = () => {
    // O acesso ao Painel de Administração é estritamente concedido à conta oficial (942691403) após login.
  };

  // Logout
  const handleLogout = useCallback((reason?: string) => {
    setLoggedInUser(null);
    setUserProfile(null);
    setShowAdminTab(false);
    setMobileMenuOpen(false);
    try {
      localStorage.removeItem('moneyao_user_session');
    } catch (e) {
      console.error(e);
    }
    if (reason) {
      setInactivityAlert(reason);
    }
  }, []);

  // Buscar perfil atualizado do utilizador
  const fetchUserProfile = useCallback(async (phone: string) => {
    try {
      if (!phone) return;
      const res = await fetch(`/api/user/profile/${phone}`);
      
      // Validar se o conteúdo é JSON de fato
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setUserProfile(data);
        
        // Atribui acesso ao Painel de Administração de forma nativa e segura para a conta oficial administradora
        if (data?.user?.phone === '942691403' && data?.user?.role === 'admin') {
          setShowAdminTab(true);
        } else {
          setShowAdminTab(false);
        }

        // Buscar transações e analisar notificações em tempo real
        try {
          const txRes = await fetch(`/api/user/transactions/${phone}`);
          const txContentType = txRes.headers.get('content-type');
          if (txRes.ok && txContentType && txContentType.includes('application/json')) {
            const txData = await txRes.json();
            checkAndNotifyTransactions(phone, txData.transactions || []);
          }
        } catch (txErr: any) {
          if (txErr?.message === 'Failed to fetch' || txErr?.name === 'TypeError') {
            console.warn('Conexão temporariamente indisponível para transações.');
          } else {
            console.error('Erro ao processar notificações de transações:', txErr);
          }
        }

        // Atualiza relógio simulado a partir dos dados do perfil
        if (data && data.simulatedTime) {
          setSimulatedTime(data.simulatedTime);
        }

        // Se o utilizador for administrador, sincroniza dados administrativos adicionais
        if (data?.user?.phone === '942691403' && data?.user?.role === 'admin') {
          try {
            const adminRes = await fetch('/api/admin/all');
            const adminContentType = adminRes.headers.get('content-type');
            if (adminRes.ok && adminContentType && adminContentType.includes('application/json')) {
              const adminData = await adminRes.json();
              if (adminData && adminData.simulatedTime) {
                setSimulatedTime(adminData.simulatedTime);
              }
            }
          } catch (adminErr: any) {
            if (adminErr?.message === 'Failed to fetch' || adminErr?.name === 'TypeError') {
              console.warn('Conexão temporariamente indisponível para dados administrativos.');
            } else {
              console.error('Erro ao obter dados administrativos:', adminErr);
            }
          }
        }
      } else if (res.status === 404 || res.status === 403 || res.status === 401) {
        // Se o utilizador não existir no banco (sessão expirada/eliminada), forçar o logout do sistema
        console.warn('Sessão expirada ou usuário não encontrado no banco de dados local. Efetuando logout...');
        handleLogout('A sua sessão expirou ou a sua conta não foi encontrada.');
      }
    } catch (err: any) {
      if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
        console.warn('Conexão temporariamente indisponível para o perfil.');
      } else {
        console.error('Erro ao buscar perfil:', err);
      }
    }
  }, [checkAndNotifyTransactions, handleLogout]);

  // Login com sucesso
  const handleLoginSuccess = (user: any) => {
    setLoggedInUser(user);
    try {
      localStorage.setItem('moneyao_user_session', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    setInactivityAlert(null);
    fetchUserProfile(user.phone);
    
    if (user?.phone === '942691403' && user?.role === 'admin') {
      setShowAdminTab(true);
    } else {
      setShowAdminTab(false);
    }
    
    // Recupera tab anterior
    setCurrentTab('overview');
  };

  // Sincronização Periódica com o Servidor (Polling de 5s)
  // Essencial para o MVP, pois permite ver os depósitos aprovados, planos ativados e lucros caindo em tempo real!
  useEffect(() => {
    if (!loggedInUser) return;
    
    // Busca imediata
    fetchUserProfile(loggedInUser.phone);

    const interval = setInterval(() => {
      fetchUserProfile(loggedInUser.phone);
    }, 5000);

    return () => clearInterval(interval);
  }, [loggedInUser, fetchUserProfile]);

  // Capturar Código de Convite da URL (?invite=XYZ) de forma encriptada e segura
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');
    if (inviteToken) {
      const decryptedPhone = decryptInviteCode(inviteToken);
      if (decryptedPhone) {
        console.log('Sponsor phone decrypted successfully:', decryptedPhone);
        setCapturedInviteCode(decryptedPhone);

        // Segurança Ativa: Se o utilizador já estiver logado num browser/sessão,
        // força a desconexão imediata para que o link de convite crie uma nova sessão limpa.
        // Isto impede que a pessoa entre diretamente na conta de outra ou herde sessões indesejadas.
        if (loggedInUser) {
          handleLogout('Um novo convite de rede seguro foi detetado. Para sua proteção financeira, a sessão anterior foi terminada para que possa registar ou aceder à sua conta.');
        }

        // Limpar os parâmetros da URL para evitar resets cíclicos
        try {
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (e) {
          console.error('Erro ao reescrever URL:', e);
        }
      }
    }
  }, [loggedInUser, handleLogout]);

  // Relógio ativo em tempo real (ticking) a cada segundo
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setSimulatedTime((prev) => {
        const d = new Date(prev);
        return new Date(d.getTime() + 1000).toISOString();
      });
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Handler para download do aplicativo
  const handleDownloadApp = async () => {
    try {
      const link = document.createElement('a');
      link.href = '/api/app/download';
      link.download = 'MoneyAO_v1.0.4.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao baixar aplicativo:', err);
    }
  };

  // Se o utilizador não estiver autenticado, renderizar ecrã de Autenticação/Cadastro
  if (!loggedInUser) {
    return (
      <div className={`bg-slate-950 min-h-screen ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}>
        {inactivityAlert && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-400 text-xs px-4 py-3 text-center flex items-center justify-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{inactivityAlert}</span>
          </div>
        )}
        <Auth 
          onLoginSuccess={handleLoginSuccess} 
          simulatedTime={simulatedTime} 
          initialInviteCode={capturedInviteCode}
        />
      </div>
    );
  }

  const user = userProfile?.user || loggedInUser;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}>
      {/* HEADER DE NAVEGAÇÃO */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo e Nome */}
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
              title="MoneyAO Angola"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="font-extrabold text-white tracking-tight text-base font-sans">MoneyAO</span>
                <span className="block text-[10px] text-slate-400 leading-none">Angola Investments</span>
              </div>
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden md:flex items-center gap-1.5">
              {[
                { id: 'overview', label: 'Painel Geral', icon: Layers },
                { id: 'cards', label: 'Cartões', icon: CreditCard },
                { id: 'investments', label: 'Investimentos AO', icon: TrendingUp },
                { id: 'fixed_funds', label: 'Fundos', icon: Landmark },
                { id: 'funds', label: 'Adicionar Saldo', icon: ArrowDownCircle },
                { id: 'withdrawals', label: 'Pedir Levantamento', icon: ArrowUpCircle },
                { id: 'affiliates', label: 'Programa de Afiliados', icon: Gift },
                { id: 'security', label: 'Segurança', icon: KeyRound },
                { id: 'presentation', label: 'Apresentação', icon: BookOpen },
                { id: 'support', label: 'Apoio ao Cliente', icon: MessageCircle },
                { id: 'faq', label: 'FAQ', icon: HelpCircle },
                ...(showAdminTab ? [{ id: 'admin', label: 'Painel de Administração', icon: Shield }] : [])
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentTab === tab.id 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Botão Baixar App (Header Desktop) */}
            <div className="hidden lg:flex items-center">
              <button
                onClick={handleDownloadApp}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer mr-1"
                title="Descarregar Aplicativo Android Oficial"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Baixar App</span>
                <Download className="h-3 w-3" />
              </button>
            </div>

            {/* Informações de Perfil e Botão de Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <span className="block text-xs font-semibold text-slate-200">{user.name}</span>
                <span className="block text-[10px] text-slate-500 font-mono">+244 {user.phone}</span>
              </div>

              <button
                onClick={() => handleLogout()}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Terminar Sessão"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Botão de Menu Mobile */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => handleLogout()}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile como Bottom-Sheet Premium com AnimatePresence */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop de Fundo com Blur e Fade-in */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md md:hidden"
              />

              {/* Bottom Sheet com deslize vertical suave */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 210 }}
                className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] rounded-t-[2rem] border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl p-4 md:hidden overflow-y-auto shadow-2xl flex flex-col font-sans"
              >
                {/* Indicador visual de arrasto estilo iOS/Android */}
                <div className="flex justify-center pb-4 pt-1">
                  <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
                </div>

                <div className="flex items-center justify-between px-3 pb-3 border-b border-slate-800/80 mb-3">
                  <div>
                    <span className="block text-sm font-black text-white tracking-tight">{user.name}</span>
                    <span className="block text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-bold">Investidor Oficial (+244 {user.phone})</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Itens de navegação dentro do Bottom Sheet */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1 max-h-[60vh]">
                  {/* Botão Baixar App Mobile */}
                  <div className="px-1 pb-3">
                    <button
                      onClick={() => {
                        handleDownloadApp();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-3 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer transition-transform active:scale-95"
                    >
                      <Smartphone className="h-4 w-4 text-slate-950" />
                      <span>Baixar Aplicativo Oficial (.APK)</span>
                      <Download className="h-3.5 w-3.5 text-slate-950" />
                    </button>
                  </div>

                  {[
                    { id: 'overview', label: 'Painel Geral', icon: Layers },
                    { id: 'cards', label: 'Cartões', icon: CreditCard },
                    { id: 'investments', label: 'Investimentos AO', icon: TrendingUp },
                    { id: 'fixed_funds', label: 'Fundos', icon: Landmark },
                    { id: 'funds', label: 'Adicionar Saldo', icon: ArrowDownCircle },
                    { id: 'withdrawals', label: 'Pedir Levantamento', icon: ArrowUpCircle },
                    { id: 'affiliates', label: 'Programa de Afiliados', icon: Gift },
                    { id: 'security', label: 'Segurança', icon: KeyRound },
                    { id: 'presentation', label: 'Apresentação', icon: BookOpen },
                    { id: 'support', label: 'Apoio ao Cliente', icon: MessageCircle },
                    { id: 'faq', label: 'FAQ', icon: HelpCircle },
                    ...(showAdminTab ? [{ id: 'admin', label: 'Painel de Administração', icon: Shield }] : [])
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setCurrentTab(tab.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner' 
                            : 'text-slate-400 hover:text-white border border-transparent hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner do Relógio Sincronizado */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-xs text-slate-400 font-sans">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Horário de Atendimento e Saques: 10:00h às 16:00h</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span>Hora Oficial de Angola:</span>
            <span className="text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {new Date(simulatedTime).toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' })} {new Date(simulatedTime).toLocaleTimeString('pt-AO', { timeZone: 'Africa/Luanda' })}
            </span>
            <button 
              onClick={() => fetchUserProfile(user.phone)}
              className="p-1 hover:text-white transition-colors cursor-pointer"
              title="Sincronizar dados"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Renderização de Tabs */}
        <div className="space-y-8">
          {currentTab === 'overview' && (
            <Dashboard 
              userProfile={userProfile} 
              onActionComplete={() => fetchUserProfile(user.phone)} 
              simulatedTime={simulatedTime}
              activeSection="overview"
            />
          )}

          {currentTab === 'cards' && (
            <Dashboard 
              userProfile={userProfile} 
              onActionComplete={() => fetchUserProfile(user.phone)} 
              simulatedTime={simulatedTime}
              activeSection="cards"
            />
          )}

          {currentTab === 'investments' && (
            <Dashboard 
              userProfile={userProfile} 
              onActionComplete={() => fetchUserProfile(user.phone)} 
              simulatedTime={simulatedTime}
              activeSection="invest"
            />
          )}

          {currentTab === 'fixed_funds' && (
            <Dashboard 
              userProfile={userProfile} 
              onActionComplete={() => fetchUserProfile(user.phone)} 
              simulatedTime={simulatedTime}
              activeSection="fixed_funds"
            />
          )}

          {currentTab === 'funds' && (
            <Dashboard 
              userProfile={userProfile} 
              onActionComplete={() => fetchUserProfile(user.phone)} 
              simulatedTime={simulatedTime}
              activeSection="funds"
            />
          )}

          {currentTab === 'withdrawals' && (
            <Dashboard 
              userProfile={userProfile} 
              onActionComplete={() => fetchUserProfile(user.phone)} 
              simulatedTime={simulatedTime}
              activeSection="withdraw"
            />
          )}

          {currentTab === 'affiliates' && (
            <Affiliates userProfile={userProfile} />
          )}

          {currentTab === 'security' && (
            <SecuritySettings 
              userPhone={user.phone} 
              onPasswordChanged={() => fetchUserProfile(user.phone)}
              theme={theme}
              setTheme={setTheme}
            />
          )}

          {currentTab === 'presentation' && (
            <Presentation />
          )}

          {currentTab === 'support' && (
            <Support />
          )}

          {currentTab === 'faq' && (
            <FAQ />
          )}

          {currentTab === 'admin' && (
            <AdminSimulation 
              currentPhone={user.phone} 
              onStateUpdate={() => fetchUserProfile(user.phone)}
              simulatedTime={simulatedTime}
            />
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-sans">
        <p>© 2026 MoneyAO. Todos os direitos reservados.</p>
        <p className="mt-1 font-mono text-[10px]">Utilizador: {user.name} | +244 {user.phone} | IP: 127.0.0.1</p>
      </footer>

      {/* PAINEL DE TOASTS FLUTUANTES (ALERTAS EM TEMPO REAL) */}
      <div className="fixed bottom-5 right-5 z-50 space-y-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="bg-slate-900/95 border border-emerald-500/30 rounded-xl p-4 shadow-2xl flex items-start gap-3 text-slate-100 backdrop-blur-md pointer-events-auto"
            >
              <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 shrink-0">
                <BellRing className="h-5 w-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">{toast.title}</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-normal">{toast.body}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* COMPONENTE DO TOUR DE BOAS-VINDAS INTERATIVO */}
      <WelcomeTour 
        userPhone={user.phone} 
        userName={user.name} 
        currentTab={currentTab} 
        onTabChange={(tab) => setCurrentTab(tab)} 
      />

      {/* NOTIFICAÇÃO DE BOAS-VINDAS COMTEMPORÂNEA (AO INICIAR SESSÃO) */}
      <AnimatePresence>
        {showSessionWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-2xl border border-emerald-500/20 bg-slate-900 p-6 md:p-8 shadow-2xl overflow-hidden font-sans"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

              <button
                onClick={() => setShowSessionWelcome(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-5">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bell className="h-7 w-7 animate-swing" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
                    Bem-vindo à MoneyAO, {user.name}! 🇦🇴
                  </h3>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    Início de Sessão Confirmado
                  </p>
                </div>

                <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-md">
                  Estamos extremamente felizes por vê-lo de volta! A sua carteira oficial está segura, sincronizada e pronta para gerar rendimentos diários transparentes de forma automatizada.
                </p>

                {/* Datas da Plataforma */}
                <div className="w-full grid grid-cols-2 gap-3 bg-slate-950/85 border border-slate-800 p-4 rounded-xl font-mono text-left">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-emerald-500" /> Criação da Plataforma
                    </span>
                    <span className="text-xs font-black text-slate-200 block">05/05/2026</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3 text-teal-500" /> Lançamento Oficial
                    </span>
                    <span className="text-xs font-black text-slate-200 block">06/07/2026</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowSessionWelcome(false)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  Entrar no Meu Painel de Controle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
