
import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LegalDisclaimerProps {
  variant?: 'minimal' | 'full';
  className?: string;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ 
  variant = 'minimal',
  className = ''
}) => {
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1 text-[10px] text-slate-500 ${className}`}>
        <Info className="h-3 w-3 flex-shrink-0" />
        <span>⚠️ Apenas fins educativos. Não é recomendação de investimento.</span>
      </div>
    );
  }

  return (
    <Alert className={`bg-amber-950/30 border-amber-700/50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="text-xs text-amber-200">
        <p className="font-semibold mb-1">⚠️ Aviso Legal - Apenas para fins educativos</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-300/80">
          <li>Esta ferramenta NÃO constitui recomendação de investimento</li>
          <li>Todas as análises são geradas por algoritmos e podem conter erros</li>
          <li>Faça sua própria análise antes de qualquer decisão financeira</li>
          <li>Investimentos em criptomoedas envolvem alto risco de perda</li>
          <li>Resultados passados não garantem resultados futuros</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default LegalDisclaimer;
