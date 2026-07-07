import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Shield, Landmark, DollarSign, Users, Award, Zap, HelpCircle } from 'lucide-react';

export default function Presentation() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 text-center shadow-2xl"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60" />
        
        {/* USA Badge Icon */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold tracking-wider uppercase mb-4">
          🇺🇸 Origem Americana / EUA
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
          Apresentação da Plataforma <span className="text-emerald-400 font-extrabold">MoneyAO</span>
        </h2>
        
        <p className="mt-3 text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          O MoneyAO é um ecossistema de investimentos digitais concebido nos Estados Unidos da América por especialistas em tecnologia financeira (FinTech). O nosso propósito é democratizar o acesso a produtos financeiros de alto rendimento no mercado Angolano, operando com total transparência e segurança.
        </p>
      </motion.div>

      {/* Grid de Informações Importantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Recompensas e Regra de Levantamento */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Recompensas de Convites e Subordinados</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Qualquer utilizador devidamente registado na plataforma pode partilhar o seu link de convite e começar imediatamente a acumular bónus de rede sobre subordinados (até 3 níveis de profundidade). O nosso plano de afiliados é aberto a toda a comunidade.
            </p>
          </div>
          
          <div className="p-3.5 bg-indigo-950/40 rounded-lg border border-indigo-500/20 text-[11px] text-indigo-300 leading-normal">
            <span className="font-bold block text-white text-xs mb-1">🔒 Regra Importante para Saques:</span>
            Para manter a sustentabilidade da plataforma, <span className="font-bold text-white underline">apenas os investidores com capital próprio ativo</span> podem efetuar o saque dos seus fundos. Não é permitido efetuar levantamentos sem histórico de depósito e investimento de capital real.
          </div>
        </motion.div>

        {/* Card 2: Prazos e Condições Financeiras */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <Landmark className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Prazos e Normas de Operação</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Garantimos um sistema de pagamentos de alta fidelidade e auditorias automáticas para depósitos e levantamentos. Oferecemos as melhores condições do mercado para saques e depósitos rápidos.
            </p>
          </div>

          <div className="space-y-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between text-[11px] border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">💸 Saque Mínimo:</span>
              <span className="text-emerald-400 font-bold font-mono">3.000 Kz</span>
            </div>
            <div className="flex justify-between text-[11px] border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400 font-semibold">🕒 Tempo do Levantamento:</span>
              <span className="text-slate-200 font-bold">Até 24 horas</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 font-semibold">⏱️ Tempo do Depósito:</span>
              <span className="text-slate-200 font-bold">30 min a 2 horas (pós comprovativo)</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Como Funciona a Origem Americana e Expansão */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
      >
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
          <Award className="h-4 w-4 text-emerald-400" /> Tecnologia de Elite Internacional
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-white flex items-center gap-1 mb-1">
              <Zap className="h-3.5 w-3.5 text-blue-400" /> Desenvolvimento
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Software de ponta desenhado sob as mais rigorosas normas de cibersegurança dos Estados Unidos.
            </p>
          </div>
          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-white flex items-center gap-1 mb-1">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Transparência
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Painéis e relatórios detalhados atualizados em tempo real de acordo com as diretrizes internacionais de investimento.
            </p>
          </div>
          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-white flex items-center gap-1 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-yellow-400" /> Rentabilidade
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Contratos inteligentes geridos por carteiras e produtos de fundos diários de alta performance em Angola.
            </p>
          </div>
        </div>
      </motion.div>

      {/* FAQ Section resumida */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
      >
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-emerald-400" /> Perguntas Frequentes (FAQ)
        </h3>
        <div className="space-y-4 divide-y divide-slate-800/60">
          <div className="pt-0 pb-3">
            <h4 className="text-xs font-bold text-white mb-1">Por que preciso de capital próprio ativo para sacar?</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Esta política garante que a plataforma seja sustentável a longo prazo, protegendo o ecossistema financeiro contra contas fictícias, falsificadas ou focadas apenas em spam de indicações sem participação ativa real de mercado.
            </p>
          </div>
          <div className="pt-3 pb-3">
            <h4 className="text-xs font-bold text-white mb-1">Como submeter o comprovativo de depósito?</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Vá ao menu "Adicionar Fundos", selecione o montante e envie a imagem ou foto do comprovativo bancário legítimo. Nossa equipa de suporte validará o documento no prazo padrão de 30 minutos a 2 horas.
            </p>
          </div>
          <div className="pt-3">
            <h4 className="text-xs font-bold text-white mb-1">Existe algum limite diário de levantamentos?</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cada investidor com dinheiro próprio pode solicitar saques diários, desde que possua saldo disponível suficiente (mínimo de 3.000 Kz). Os levantamentos são pagos diretamente para os seus dados de conta informados no perfil de levantamento.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
