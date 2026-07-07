import React, { useState } from 'react';
import { Shield, Phone, Lock, User as UserIcon, HelpCircle, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onLoginSuccess: (user: any) => void;
  simulatedTime: string;
  initialInviteCode?: string;
}

export default function Auth({ onLoginSuccess, simulatedTime, initialInviteCode }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  
  // Form States
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Verificação de Patrocinador Ativa e Segura
  const [sponsorName, setSponsorName] = useState<string | null>(null);
  const [sponsorLoading, setSponsorLoading] = useState(false);

  React.useEffect(() => {
    if (initialInviteCode) {
      setInviteCode(initialInviteCode);
      setMode('register'); // Alterna automaticamente para o registo

      if (initialInviteCode === 'ADMIN123') {
        setSponsorName('Administração Principal (MoneyAO)');
      } else {
        setSponsorLoading(true);
        fetch(`/api/user/profile/${initialInviteCode}`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error();
          })
          .then(data => {
            if (data?.user?.name) {
              setSponsorName(data.user.name);
            } else {
              setSponsorName(null);
            }
          })
          .catch(() => {
            setSponsorName(null);
          })
          .finally(() => {
            setSponsorLoading(false);
          });
      }
    }
  }, [initialInviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formattedPhone = phone.trim().replace(/\s+/g, '');

    try {
      if (mode === 'recover') {
        // Recovery Flow
        const res = await fetch('/api/auth/recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formattedPhone })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao enviar pedido de recuperação.');
        }

        setSuccess(data.message);
      } else if (mode === 'login') {
        // Login Flow
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formattedPhone, password })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao efetuar login.');
        }

        setSuccess('Autenticação bem-sucedida! Entrando...');
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1200);
      } else {
        // Register Flow
        if (password !== confirmPassword) {
          throw new Error('As palavras-passe não coincidem.');
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formattedPhone,
            name: name.trim(),
            password,
            confirmPassword,
            inviteCode: inviteCode.trim()
          })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao criar conta.');
        }

        setSuccess('Conta criada com sucesso! Entrando na sua carteira de investimentos...');
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <Shield className="h-6 w-6" id="auth-shield-icon" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white font-sans">
            MoneyAO
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'login' && 'Acesse a sua carteira de rendimentos diários'}
            {mode === 'register' && 'Abra a sua conta de investimento em Angola'}
            {mode === 'recover' && 'Peça ajuda para redefinir as suas credenciais de segurança'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20" id="auth-error-box">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20" id="auth-success-box">
            <Shield className="h-5 w-5 shrink-0 mt-0.5" />
            <div>{success}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Número de Telefone (ID Único)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-sm font-mono">
                  +244
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="9xx xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-14 pr-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-sm"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Ex: João Baptista Augusto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            )}

            {mode !== 'recover' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Palavra-passe (Senha)
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('recover');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-emerald-400 transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Esqueceu-se?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Confirmar Palavra-passe
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5">
                    <label htmlFor="inviteCode" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Código de Convite (Obrigatório)
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <HelpCircle className="h-4 w-4" />
                    </span>
                    <input
                      id="inviteCode"
                      name="inviteCode"
                      type="text"
                      required
                      disabled={!!initialInviteCode}
                      placeholder="Código do seu patrocinador"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className={`block w-full rounded-lg border py-3 pl-10 pr-3 font-mono text-sm focus:outline-none focus:ring-1 ${
                        initialInviteCode 
                          ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200 cursor-not-allowed'
                          : 'border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-emerald-500'
                      }`}
                    />
                  </div>

                  {sponsorLoading && (
                    <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5 animate-pulse">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                      <span>Verificando autenticidade do patrocinador...</span>
                    </div>
                  )}

                  {!sponsorLoading && sponsorName && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-semibold block text-[10px] uppercase leading-none">Convite de Rede Criptografado</span>
                        <span className="font-bold text-white text-xs mt-0.5 block font-sans">Patrocinador: {sponsorName}</span>
                      </div>
                    </div>
                  )}

                  {!sponsorLoading && initialInviteCode && !sponsorName && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-semibold block text-[10px] uppercase leading-none">Aviso de Segurança</span>
                        <span className="text-amber-300 text-[11px] mt-0.5 block font-sans">Código decriptado mas não pôde ser validado no servidor. Prossiga com cuidado.</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-3 px-4 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : mode === 'login' ? (
                <span className="flex items-center gap-1.5">
                  Entrar na Conta <LogIn className="h-4 w-4" />
                </span>
              ) : mode === 'recover' ? (
                <span className="flex items-center gap-1.5">
                  Pedir Recuperação <Shield className="h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Criar Minha Conta <UserPlus className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-3 text-center mt-6">
          {mode === 'recover' ? (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccess(null);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none"
            >
              Voltar para o Login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setSuccess(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-emerald-400/80 transition-colors cursor-pointer bg-transparent border-none"
            >
              {mode === 'login' 
                ? 'Ainda não é Investidor? Criar Conta' 
                : 'Já é Investidor? Entrar na Conta'}
            </button>
          )}

          {mode === 'register' && (
            <button
              type="button"
              onClick={() => {
                setMode('recover');
                setError(null);
                setSuccess(null);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer bg-transparent border-none mt-1"
            >
              Esqueceu-se da Palavra-passe? Recuperar Conta
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
