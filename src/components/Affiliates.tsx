import React, { useState } from 'react';
import { Users, Link2, Copy, Check, Gift, HelpCircle, ArrowRight, Network } from 'lucide-react';
import { motion } from 'motion/react';
import { encryptInviteCode } from '../utils/security.ts';

interface AffiliateProps {
  userProfile: any;
}

export default function Affiliates({ userProfile }: AffiliateProps) {
  const [copied, setCopied] = useState(false);
  const user = {
    myInviteCode: '',
    phone: '',
    ...(userProfile?.user || {})
  };
  const referrals = userProfile?.referrals || { level1Count: 0, level2Count: 0, level3Count: 0, totalCount: 0 };
  const totalCommission = userProfile?.totalCommissionEarned || 0;

  // Gerar Link de convite único com criptografia e máscara de segurança
  const getInviteLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://money-ao.com';
    const secureToken = encryptInviteCode(user.myInviteCode || user.phone);
    return `${baseUrl}/?invite=${secureToken}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getInviteLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="affiliate-center" className="space-y-8 font-sans">
      {/* Resumo da Rede */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel de Convite */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <Gift className="h-3.5 w-3.5" /> RECOMPENSAS DE AFILIADO
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">O Seu Link de Convite Exclusivo</h3>
            <p className="text-xs text-slate-400">
              Indique novos investidores usando o seu link exclusivo e ganhe comissões imediatas em até 3 níveis de profundidade quando os seus convidados realizarem depósitos validados.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Seu código de convite:</span>
              <span className="font-mono text-white text-sm">{user.myInviteCode || user.phone}</span>
            </div>

            <div className="flex gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
              <input
                type="text"
                readOnly
                value={getInviteLink()}
                className="bg-transparent flex-1 text-xs text-slate-300 font-mono outline-none pl-1 truncate"
              />
              <button
                onClick={handleCopy}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas de Ganhos de Rede */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-5">
            <Network className="h-24 w-24 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Ganho de Bónus de Rede</h4>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {totalCommission.toLocaleString()} <span className="text-emerald-400 text-xl font-semibold">Kz</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Todos os bónus de convite entram instantaneamente no seu saldo disponível e podem ser investidos ou sacados imediatamente!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-800 pt-4 mt-2">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">1º Nível (15%)</span>
              <span className="text-sm font-extrabold text-white font-mono">{referrals.level1Count}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">2º Nível (10%)</span>
              <span className="text-sm font-extrabold text-white font-mono">{referrals.level2Count}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">3º Nível (5%)</span>
              <span className="text-sm font-extrabold text-white font-mono">{referrals.level3Count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Como funciona o Programa de Afiliados */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
        <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
          <HelpCircle className="h-5 w-5 text-emerald-400" /> Regras de Funcionamento e Distribuição da Rede
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-xs">1</span>
              Nível 1 (Indicações Diretas)
            </div>
            <p className="leading-relaxed">
              Recebe <span className="text-emerald-400 font-bold">15% de bónus imediato</span> sobre qualquer valor investido por pessoas que se cadastraram usando o seu link direto.
            </p>
          </div>

          <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-xs">2</span>
              Nível 2 (Convidados Indiretos)
            </div>
            <p className="leading-relaxed">
              Recebe <span className="text-emerald-400 font-bold">10% de bónus imediato</span> sobre os aportes de pessoas trazidas pelos seus indicados diretos.
            </p>
          </div>

          <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-xs">3</span>
              Nível 3 (Terceiro Grau de Rede)
            </div>
            <p className="leading-relaxed">
              Recebe <span className="text-emerald-400 font-bold">5% de bónus imediato</span> sobre os aportes feitos pelos indicados do seu convidado de 2º nível.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-4 text-xs text-amber-400 leading-relaxed font-sans">
          <strong>Atenção Importante sobre Segurança Operacional:</strong>
          <p className="mt-1">
            As comissões incidem estritamente sobre o valor inicial investido pelo convidado (depósito aprovado pelo administrador), nunca sobre os seus lucros recorrentes diários. Em caso de estorno ou reembolso do depósito do convidado, os bónus de rede gerados correspondentes são automaticamente subtraídos do saldo dos patrocinadores.
          </p>
        </div>
      </div>
    </div>
  );
}
