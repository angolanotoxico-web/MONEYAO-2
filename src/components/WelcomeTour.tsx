import React, { useState, useEffect } from 'react';
import { 
  Layers, TrendingUp, Gift, ArrowRight, ArrowLeft, X, 
  Sparkles, ShieldCheck, Trophy, Landmark, HelpCircle, HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WelcomeTourProps {
  userPhone: string;
  userName: string;
  currentTab: string;
  onTabChange: (tab: any) => void;
}

interface TourStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  tab?: string;
  highlightIcon: React.ReactNode;
  tips: string[];
}

export default function WelcomeTour({ userPhone, userName, currentTab, onTabChange }: WelcomeTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Chave única para persistência por utilizador
  const storageKey = `moneyao_tour_completed_${userPhone}`;

  useEffect(() => {
    const tourCompleted = localStorage.getItem(storageKey);
    if (!tourCompleted) {
      // Pequeno atraso para o dashboard inicial carregar suavemente antes de iniciar o tour
      const timer = setTimeout(() => {
        setIsOpen(true);
        // Garante que começa no Painel Geral
        onTabChange('overview');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [storageKey, onTabChange]);

  const steps: TourStep[] = [
    {
      id: 0,
      title: `Bem-vindo à MoneyAO, ${userName}! 🇦🇴`,
      subtitle: "O Futuro dos seus Investimentos em Angola",
      description: "Temos o prazer de recebê-lo na nossa plataforma oficial. Preparamos este guia rápido de 1 minuto para lhe apresentar as principais funcionalidades e ajudá-lo a obter os melhores rendimentos diários.",
      highlightIcon: <Sparkles className="h-8 w-8 text-emerald-400 animate-pulse" />,
      tips: [
        "Plataforma offline-first e ultra-segura",
        "Rendimentos diários libertados pontualmente",
        "Suporte técnico localizado 24 horas por dia"
      ]
    },
    {
      id: 1,
      title: "1. Painel Geral",
      subtitle: "A sua central financeira pessoal",
      description: "Aqui pode acompanhar o seu saldo disponível, rendimentos totais acumulados, fundos bloqueados e o histórico de transações. Todas as atualizações ocorrem de forma transparente e em tempo real.",
      tab: "overview",
      highlightIcon: <Layers className="h-8 w-8 text-emerald-400" />,
      tips: [
        "Acompanhe o crescimento do saldo a cada segundo",
        "Visualize o status dos seus depósitos e levantamentos",
        "Sincronize os dados de forma manual no relógio superior"
      ]
    },
    {
      id: 2,
      title: "2. Portfólio de Investimentos",
      subtitle: "Produtos financeiros exclusivos",
      description: "Nesta secção, pode aplicar o seu saldo nos nossos pacotes de rendimento personalizado (Produtos AO). Cada produto tem a sua taxa de juro diária e período de vigência específicos.",
      tab: "investments",
      highlightIcon: <TrendingUp className="h-8 w-8 text-emerald-400" />,
      tips: [
        "Os juros são creditados diariamente na sua conta",
        "Pode investir em múltiplos planos em simultâneo",
        "Use a calculadora integrada de rendimentos antes de aplicar"
      ]
    },
    {
      id: 3,
      title: "3. Programa de Afiliados",
      subtitle: "Cresça a sua rede e ganhe comissões",
      description: "Gere o seu link exclusivo de convite e crie a sua própria rede. Receberá bónus de recomendação direta de forma imediata assim que os seus indicados ativarem os primeiros produtos.",
      tab: "affiliates",
      highlightIcon: <Gift className="h-8 w-8 text-indigo-400 animate-bounce" />,
      tips: [
        "Comissões de rede pagas automaticamente no saldo principal",
        "Visualize o seu padrinho (sponsor) e detalhes da equipa",
        "Partilhe facilmente por WhatsApp com apenas um toque"
      ]
    },
    {
      id: 4,
      title: "Tudo Pronto! 🚀",
      subtitle: "Desejamos-lhe excelentes negócios",
      description: "O seu cadastro está ativo e protegido por encriptação militar. Se tiver qualquer dúvida, a nossa equipa de Suporte Oficial está sempre pronta a atendê-lo através dos canais de chat do WhatsApp.",
      highlightIcon: <ShieldCheck className="h-10 w-10 text-emerald-400" />,
      tips: [
        "Faça o seu primeiro carregamento via Adicionar Fundos",
        "Ative um plano inicial para ver os rendimentos a render",
        "Baixe a aplicação móvel oficial (.APK) para o seu Android"
      ]
    }
  ];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      
      // Se o passo seguinte tiver uma tab associada, navega automaticamente para ela!
      const nextStep = steps[nextIndex];
      if (nextStep.tab) {
        onTabChange(nextStep.tab);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      
      const prevStep = steps[prevIndex];
      if (prevStep.tab) {
        onTabChange(prevStep.tab);
      }
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
    // Retorna para o Painel Geral no fim do tour
    onTabChange('overview');
  };

  const handleRestartTour = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
    onTabChange('overview');
  };

  // Expõe botão para reiniciar o tour nas configurações se necessário
  useEffect(() => {
    // Escuta evento global para permitir re-atividades
    const handleRestartEvent = () => handleRestartTour();
    window.addEventListener('moneyao_restart_welcome_tour', handleRestartEvent);
    return () => window.removeEventListener('moneyao_restart_welcome_tour', handleRestartEvent);
  }, []);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90">
        
        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden font-sans"
        >
          {/* Efeitos visuais de background do bento-modal */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Botão Cancelar/Saltar */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-800/50"
            title="Saltar Tour"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Conteúdo do passo */}
          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Ícone de destaque do passo */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950/60 border border-slate-800 shadow-inner">
              {currentStep.highlightIcon}
            </div>

            {/* Títulos */}
            <div className="space-y-1.5">
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-snug">
                {currentStep.title}
              </h2>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                {currentStep.subtitle}
              </p>
            </div>

            {/* Descrição principal */}
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-sm">
              {currentStep.description}
            </p>

            {/* Caixa de dicas/benefícios */}
            <div className="w-full bg-slate-950/65 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2.5">
              <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Pontos Fortes:</span>
              <ul className="space-y-2">
                {currentStep.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-sans">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Indicador de passos */}
            <div className="flex items-center gap-1.5 py-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex ? 'w-5 bg-emerald-400' : 'w-1.5 bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-between w-full gap-3 border-t border-slate-800/80 pt-5">
              {currentStepIndex > 0 ? (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-xs font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar</span>
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Saltar guia
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:opacity-95 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-lg shadow-emerald-500/10"
              >
                <span>{currentStepIndex === steps.length - 1 ? "Começar Agora" : "Seguinte"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
