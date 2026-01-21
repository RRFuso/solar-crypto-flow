import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { CapitalFlowLink } from '@/types/capitalFlow';
import { Prediction } from '@/lib/aiModel';
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { BTCTooltip } from './BTCTooltip';
import { FlowBar, NetFlowBar } from './FlowBar';
import { AIInsight } from '@/hooks/useAdvancedAI';

interface TooltipData {
  id: string;
  name?: string;
  price?: number;
  priceChange24h?: number;
  volume?: number;
  capitalFlows?: CapitalFlowLink[];
  allCapitalFlows?: CapitalFlowLink[]; // All flows for global scale calculation
  aiModel?: Prediction | AIInsight;
  trendReasons?: string[];
  aiAnalysis?: {
    recommendation: string;
    confidence: number;
  };
  explosivePotential?: string;
  keyFactors?: string[];
}

interface UnifiedTooltipProps {
  data: TooltipData | null;
  position: { x: number; y: number };
}

const OnChainTooltipContent: React.FC<{ symbol: string }> = ({ symbol }) => {
  const { smartMoneyScores, isLoading } = useOnChainData();
  const onChainInfo = smartMoneyScores.get(symbol);

  if (isLoading(symbol)) {
    return (
      <div className="border-t border-slate-700 pt-2 mt-2">
        <h4 className="font-bold text-slate-300 mb-1">On-Chain Analysis</h4>
        <p className="text-xs text-gray-400">Analisando...</p>
      </div>
    );
  }

  if (!onChainInfo) {
    return null; // Não mostra nada se não houver dados
  }

  const getSentimentColor = () => {
    if (onChainInfo.sentiment === 'Bullish') return 'text-green-400';
    if (onChainInfo.sentiment === 'Bearish') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="border-t border-slate-700 pt-2 mt-2">
      <h4 className="font-bold text-slate-300 mb-1">On-Chain Analysis</h4>
      <div className="flex justify-between">
        <span className="text-slate-400">Smart Money Score:</span>
        <span className={`font-mono font-bold ${getSentimentColor()}`}>{onChainInfo.score}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-400">Sentiment:</span>
        <span className={`font-mono font-bold ${getSentimentColor()}`}>{onChainInfo.sentiment}</span>
      </div>
    </div>
  );
};

export const UnifiedTooltip: React.FC<UnifiedTooltipProps> = ({ data, position }) => {
  if (!data) return null;

  // Check if aiModel is AIInsight type
  const isAIInsight = (model: any): model is AIInsight => {
    return model && 'predictions' in model && 'patterns' in model && 'features' in model;
  };

  // Render BTC tooltip if it's Bitcoin
  if (data.id === 'BTC' || data.id === 'bitcoin' || data.id === 'BTCUSDT') {
    // Pass AI insight to BTC tooltip
    const aiInsight = isAIInsight(data.aiModel) ? data.aiModel : undefined;
    return <BTCTooltip data={{ ...data, aiInsight }} position={position} />;
  }

  const totalInflow = data.capitalFlows
    ? data.capitalFlows
        .filter(flow => flow.target.id === data.id)
        .reduce((acc, flow) => acc + flow.value, 0)
    : 0;

  const totalOutflow = data.capitalFlows
    ? data.capitalFlows
        .filter(flow => flow.source.id === data.id)
        .reduce((acc, flow) => acc + flow.value, 0)
    : 0;

  const netFlow = totalInflow - totalOutflow;
  
  // Calculate global max flow for consistent scale across all tooltips
  const maxFlow = data.allCapitalFlows && data.allCapitalFlows.length > 0
    ? Math.max(
        ...data.allCapitalFlows.map(flow => flow.value)
      )
    : Math.max(totalInflow, totalOutflow);

  // Calcular posicionamento inteligente do tooltip
  const tooltipWidth = 320; // w-80 = 20rem = 320px
  const tooltipHeight = 500; // altura estimada
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const padding = 16; // Margem de segurança
  
  // Determinar posição horizontal
  let left = position.x + 20;
  
  // Verificar se há espaço à direita
  const hasSpaceRight = (position.x + 20 + tooltipWidth + padding) <= screenWidth;
  // Verificar se há espaço à esquerda
  const hasSpaceLeft = (position.x - 20 - tooltipWidth) >= padding;
  
  if (!hasSpaceRight && hasSpaceLeft) {
    // Não cabe à direita, mas cabe à esquerda
    left = position.x - tooltipWidth - 20;
  } else if (!hasSpaceRight && !hasSpaceLeft) {
    // Não cabe em nenhum lado, centralizar com base na posição do mouse
    if (position.x < screenWidth / 2) {
      // Mouse na esquerda, alinhar pela esquerda
      left = padding;
    } else {
      // Mouse na direita, alinhar pela direita
      left = screenWidth - tooltipWidth - padding;
    }
  }
  // Se hasSpaceRight, mantém a posição padrão (direita)
  
  // Garantir que não saia das bordas horizontais
  left = Math.max(padding, Math.min(left, screenWidth - tooltipWidth - padding));
  
  // Determinar posição vertical
  let top = position.y - 100;
  
  // Verificar se há espaço abaixo
  const hasSpaceBelow = (top + tooltipHeight + padding) <= screenHeight;
  
  if (!hasSpaceBelow) {
    // Tentar posicionar acima
    top = position.y - tooltipHeight - 20;
    
    // Se também não couber acima, centralizar verticalmente
    if (top < padding) {
      top = Math.max(padding, (screenHeight - tooltipHeight) / 2);
    }
  }
  
  // Garantir que não saia das bordas verticais
  top = Math.max(padding, Math.min(top, screenHeight - tooltipHeight - padding));

  const aiInsight = isAIInsight(data.aiModel) ? data.aiModel : null;

  return (
    <div
      className="fixed z-50 p-2 transition-all duration-200"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        pointerEvents: 'none',
      }}
    >
      <Card className="w-80 bg-slate-900/80 backdrop-blur-sm border-slate-700 text-white shadow-2xl">
        <CardHeader className="p-3">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>{data.id}</span>
            {data.name && <span className="text-sm text-slate-400">{data.name}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-sm space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <span className="text-slate-400">Price:</span>
              <span className="block font-mono font-bold">
                ${data.price ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">24h Change:</span>
              <span className={`block font-mono font-bold ${data.priceChange24h && data.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.priceChange24h !== undefined ? `${data.priceChange24h >= 0 ? '+' : ''}${data.priceChange24h.toFixed(2)}%` : 'N/A'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">Volume (24h):</span>
              <span className="block font-mono">
                ${data.volume ? (data.volume / 1e6).toFixed(2) : 'N/A'}M
              </span>
            </div>
          </div>

          {data.capitalFlows && data.capitalFlows.length > 0 && (
            <div className="border-t border-slate-700 pt-3 space-y-2">
              <h4 className="font-bold text-slate-300 mb-2">Capital Flow</h4>
              <FlowBar 
                value={totalInflow} 
                maxValue={maxFlow} 
                type="inflow" 
                label="Inflow"
              />
              <FlowBar 
                value={totalOutflow} 
                maxValue={maxFlow} 
                type="outflow" 
                label="Outflow"
              />
              <NetFlowBar netFlow={netFlow} maxAbsFlow={maxFlow} />
            </div>
          )}


          {aiInsight && (
            <div className="border-t border-slate-700 pt-2 mt-2">
              <h4 className="font-bold text-slate-300 mb-2">🤖 Análise de Tendência</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sinal:</span>
                  <Badge 
                    variant={
                      aiInsight.recommendation === 'strong_buy' || aiInsight.recommendation === 'buy' 
                        ? 'default' 
                        : aiInsight.recommendation === 'strong_sell' || aiInsight.recommendation === 'sell'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="font-semibold"
                  >
                    {aiInsight.recommendation === 'strong_buy' ? 'FORTE TENDÊNCIA DE ALTA' :
                     aiInsight.recommendation === 'buy' ? 'BULLISH' :
                     aiInsight.recommendation === 'strong_sell' ? 'FORTE TENDÊNCIA DE BAIXA' :
                     aiInsight.recommendation === 'sell' ? 'BEARISH' :
                     'CONSOLIDAÇÃO'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs">Confiança</span>
                    <span className="font-mono font-bold">{aiInsight.confidence.toFixed(0)}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs">Oportunidade</span>
                    <span className="font-mono font-bold text-green-400">{aiInsight.opportunityScore.toFixed(0)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs">Risco</span>
                    <span className="font-mono font-bold text-red-400">{aiInsight.riskScore.toFixed(0)}</span>
                  </div>
                  {aiInsight.patterns && aiInsight.patterns.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs">Padrões</span>
                      <span className="font-mono font-bold">{aiInsight.patterns.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* On-Chain Analysis Section */}
          <OnChainTooltipContent symbol={data.id} />

          {data.trendReasons && data.trendReasons.length > 0 && (
            <div className="border-t border-slate-700 pt-2 mt-2">
              <h4 className="font-bold text-slate-300 mb-1">Key Factors</h4>
              <ul className="list-disc list-inside text-xs pl-2 space-y-1">
                {data.trendReasons.map((reason, i) => <li key={i}>{reason}</li>)}
              </ul>
            </div>
          )}
          
          {data.explosivePotential === 'High' && (
            <div className="border-t border-slate-700 pt-2 mt-2 text-center">
              <h4 className="font-bold text-yellow-400 mb-1 animate-pulse">
                🔥 High Explosive Potential
              </h4>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};