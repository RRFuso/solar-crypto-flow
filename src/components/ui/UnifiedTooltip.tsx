import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { CapitalFlowLink } from '@/types/capitalFlow';
import { Prediction } from '@/lib/aiModel';
import { useOnChainData } from '@/contexts/OnChainDataContext';

interface TooltipData {
  id: string;
  name?: string;
  price?: string;
  priceChange24h?: number;
  volume?: number;
  capitalFlows?: CapitalFlowLink[];
  aiModel?: Prediction;
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

  return (
    <div
      className="absolute z-50 p-2 transition-opacity duration-200"
      style={{
        left: position.x + 15,
        top: position.y + 15,
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
              <span className="block font-mono">{data.price ? `${parseFloat(data.price).toLocaleString()}` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400">24h Change:</span>
              <span className={`block font-mono ${data.priceChange24h && data.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.priceChange24h?.toFixed(2) ?? 'N/A'}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">Volume (24h):</span>
              <span className="block font-mono">{data.volume ? `${data.volume.toLocaleString()}` : 'N/A'}</span>
            </div>
          </div>

          {data.capitalFlows && data.capitalFlows.length > 0 && (
            <div className="border-t border-slate-700 pt-2 mt-2">
              <h4 className="font-bold text-slate-300 mb-1">Capital Flow</h4>
              <div className="flex justify-between">
                <span className="text-green-400">Inflow:</span>
                <span className="font-mono">${totalInflow.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Outflow:</span>
                <span className="font-mono">${totalOutflow.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-300">Net Flow:</span>
                <span className={`font-mono ${(totalInflow - totalOutflow) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${(totalInflow - totalOutflow).toLocaleString()}
                </span>
              </div>
            </div>
          )}


          {data.aiModel && (
            <div className="border-t border-slate-700 pt-2 mt-2">
              <h4 className="font-bold text-slate-300 mb-1">AI Analysis</h4>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Prediction:</span>
                <Badge variant={data.aiModel.bullish ? 'default' : 'destructive'}>
                  {data.aiModel.bullish ? 'Bullish' : 'Bearish'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="font-mono">{data.aiModel.confidence.toFixed(1)}%</span>
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