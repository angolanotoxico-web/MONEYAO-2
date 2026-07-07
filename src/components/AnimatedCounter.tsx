import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // duração em milissegundos, padrão 800ms
}

export const AnimatedCounter = React.memo(function AnimatedCounter({ value, duration = 800 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = value;
    
    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Função de suavização (easing): easeOutQuad
      const easeProgress = progress * (2 - progress);
      
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  // Sincronizar o valor de referência anterior após cada mudança bem-sucedida de animação
  useEffect(() => {
    previousValueRef.current = value;
  }, [value]);

  return (
    <span>
      {displayValue.toLocaleString('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
});
