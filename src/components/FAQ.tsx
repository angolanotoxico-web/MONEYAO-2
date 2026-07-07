import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  HelpCircle, ChevronDown, ChevronUp, Search, Users, Gift, Coins, Landmark 
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'deposits' | 'withdrawals' | 'affiliates' | 'general';
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'deposits',
    question: 'Como faço para efetuar um depósito na plataforma?',
    answer: 'Para depositar, aceda ao painel principal (Dashboard), selecione o método de depósito de sua preferência (Referência Multicaixa, Transferência Bancária ou Cripto), insira o valor desejado (mínimo de 8.000 Kz) e clique em "Confirmar Depósito". Transfira o valor exato indicado e envie o comprovativo no formulário. A nossa equipa validará o seu depósito em menos de 2 horas.'
  },
  {
    id: 'faq-2',
    category: 'deposits',
    question: 'Qual é o valor mínimo de depósito e quanto tempo demora a aprovação?',
    answer: 'O depósito mínimo na MoneyAO é de 8.000 Kz. A nossa equipa de auditoria verifica e aprova os comprovativos enviados de forma manual, num prazo médio que varia de 30 minutos a um máximo de 2 horas.'
  },
  {
    id: 'faq-3',
    category: 'withdrawals',
    question: 'Quem pode efetuar levantamentos e qual é o valor mínimo?',
    answer: 'Todos os utilizadores podem acumular saldos e comissões de rede, mas apenas os investidores com pelo menos um plano de investimento ativo podem solicitar levantamentos. O valor mínimo para qualquer levantamento é de 3.000 Kz, com processamento rápido concluído no prazo de até 24 horas.'
  },
  {
    id: 'faq-4',
    category: 'withdrawals',
    question: 'Existem taxas ocultas ou limites diários para levantamentos?',
    answer: 'Pode efetuar levantamentos a qualquer hora do dia. A MoneyAO não cobra comissões ocultas de levantamento. Para garantir a conformidade e proteção contra lavagem de dinheiro, a conta bancária ou carteira de destino deve corresponder ao seu nome de utilizador registado.'
  },
  {
    id: 'faq-5',
    category: 'affiliates',
    question: 'Como funciona o Programa de Afiliados e as comissões de rede?',
    answer: 'A MoneyAO oferece um programa de afiliados altamente recompensador dividido em 3 níveis de profundidade. Ao convidar amigos com o seu link de convite exclusivo, receberá bónus imediatos sobre cada investimento efetuado por eles: Nível 1 (10%), Nível 2 (5%) e Nível 3 (2%). Adicionalmente, ganha percentagens contínuas sobre os rendimentos diários gerados pelos planos deles.'
  },
  {
    id: 'faq-6',
    category: 'affiliates',
    question: 'Onde posso encontrar o meu código de convite e link personalizado?',
    answer: 'Basta aceder ao menu "Afiliados" no topo da página. Lá encontrará o seu Link de Convite exclusivo e o Código de Afiliado. Pode partilhá-los diretamente através do WhatsApp, redes sociais ou SMS com um simples clique no botão "Copiar".'
  },
  {
    id: 'faq-7',
    category: 'general',
    question: 'O que são e como funcionam os Códigos de Presentes (Gift Codes)?',
    answer: 'Os Códigos de Presentes são bónus especiais gerados e distribuídos exclusivamente pelo Administrador da plataforma (por exemplo, em eventos especiais, no grupo de trabalho ou bónus por fidelidade). Pode resgatá-los clicando no botão "Resgatar Código de Presente" na área do seu Perfil no Dashboard. O saldo bónus é creditado imediatamente.'
  },
  {
    id: 'faq-8',
    category: 'general',
    question: 'Como os rendimentos diários dos Planos AO são creditados?',
    answer: 'Os rendimentos do seu plano começam a acumular instantaneamente após a sua ativação. O sistema distribui automaticamente os lucros diários na sua conta a cada 24 horas de forma autónoma, seguindo a hora oficial de Angola (WAT, UTC+1). Pode acompanhar o saldo acumulado diretamente no seu Dashboard.'
  }
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'deposits' | 'withdrawals' | 'affiliates' | 'general'>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Filtragem e Pesquisa de FAQs
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter(faq => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesSearch = 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleFaq = (id: string) => {
    setExpandedFaqId(prev => (prev === id ? null : id));
  };

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
          Perguntas Frequentes <span className="text-emerald-400 font-extrabold">(FAQ)</span>
        </h2>
        
        <p className="mt-3 text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Encontre respostas rápidas para as dúvidas mais comuns sobre depósitos, planos de investimento, levantamentos de fundos e o nosso programa de afiliados.
        </p>
      </motion.div>

      {/* SECÇÃO PERGUNTAS FREQUENTES (FAQ) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-emerald-400" /> Esclarecimento de Dúvidas
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Pesquise por palavras-chave ou filtre por tópicos abaixo</p>
          </div>

          {/* Campo de Pesquisa */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Pesquisar perguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          </div>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Ver Todas', icon: HelpCircle },
            { id: 'deposits', label: 'Depósitos', icon: Coins },
            { id: 'withdrawals', label: 'Levantamentos', icon: Landmark },
            { id: 'affiliates', label: 'Afiliados & Convites', icon: Users },
            { id: 'general', label: 'Gerais & Presentes', icon: Gift }
          ].map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  active 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Lista de Acordeão de Perguntas */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
              <HelpCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Nenhuma pergunta encontrada correspondente aos seus filtros.</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div 
                  key={faq.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? 'border-emerald-500/20 bg-slate-950/60' 
                      : 'border-slate-800/60 bg-slate-950/20 hover:border-slate-800 hover:bg-slate-950/30'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full text-left py-3.5 px-4 flex items-center justify-between gap-4 font-sans text-xs font-bold text-white transition-colors"
                  >
                    <span className="leading-snug">{faq.question}</span>
                    <span className="shrink-0 text-slate-500 bg-slate-900/60 border border-slate-800/40 p-1 rounded-md">
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-[11px] text-slate-300 font-sans leading-relaxed border-t border-slate-900/60">
                      <p className="bg-slate-900/20 p-3 rounded-lg border border-slate-800/20">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
