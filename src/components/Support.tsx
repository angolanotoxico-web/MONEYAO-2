import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageCircle, ShieldAlert, Clock, HelpCircle, Landmark, 
  ExternalLink, ShieldCheck 
} from 'lucide-react';

export default function Support() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 text-center shadow-2xl"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60" />
        
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
          <HelpCircle className="h-6 w-6" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
          Apoio ao Cliente <span className="text-emerald-400 font-extrabold">MoneyAO</span>
        </h2>
        
        <p className="mt-3 text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Precisa de ajuda ou deseja acompanhar as discussões diárias? Utilize os nossos canais oficiais de comunicação para falar diretamente com o nosso gerente ou interagir com o grupo de trabalho.
        </p>
      </motion.div>

      {/* Canais Principais de Atendimento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Contactar Gerente */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Gerente MoneyAO</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Fale diretamente com o suporte individualizado do nosso gerente oficial no WhatsApp. Tire dúvidas sobre depósitos, planos de investimentos, verificação de contas ou suporte financeiro geral.
            </p>
          </div>

          <div className="mt-4">
            <a
              href="https://wa.me/6285124966380"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              Contactar Gerente no WhatsApp
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="block text-center text-[10px] text-slate-500 mt-2">
              Disponível para resposta rápida e direta.
            </span>
          </div>
        </motion.div>

        {/* Card 2: Grupo de Trabalho */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Grupo de Trabalho Oficial</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Participe no grupo de trabalho oficial da plataforma. Conecte-se com outros investidores em Angola, partilhe comprovativos, acompanhe anúncios de novos planos, bónus e novidades do ecossistema.
            </p>
          </div>

          <div className="mt-4">
            <a
              href="https://chat.whatsapp.com/DVaJCeA1Vh84wn8oAIVzo7?s=cl&p=a&mlu=0"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-950 text-emerald-400 hover:bg-emerald-900/60 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-500/20 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              Entrar no Grupo de Trabalho
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="block text-center text-[10px] text-slate-500 mt-2">
              Grupo exclusivo para membros ativos e novos registos.
            </span>
          </div>
        </motion.div>
      </div>

      {/* Diretrizes Operacionais Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6"
      >
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Diretrizes de Operação do Suporte
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1.5">
              <Clock className="h-4 w-4 text-slate-400" /> Depósitos
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              O processamento e ativação de depósitos após a verificação do comprovativo levam de <span className="text-emerald-400 font-bold">30 minutos a 2 horas</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1.5">
              <Landmark className="h-4 w-4 text-slate-400" /> Levantamentos
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Os levantamentos de fundos autorizados têm uma duração média de processamento de <span className="text-white font-bold">até 24 horas</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> Regra Geral
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Todos podem acumular recompensas de subordinados, mas apenas investidores com capital próprio podem fazer saques (mínimo de <span className="text-emerald-400 font-bold">3.000 Kz</span>).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
