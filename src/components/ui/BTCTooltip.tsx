import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { useMarketRotation } from '@/hooks/useMarketRotation';
import { FlowBar, NetFlowBar } from './FlowBar';
import { CapitalFlowLink } from '@/types/capitalFlow';

interface BTCTooltipData {
  id: string;
  name?: string;
  price?: number;
  priceChange24h?: number;
  volume?: number;
  capitalFlows?: CapitalFlowLink[];
  explosivePotential?: string;
}

interface BTCTooltipProps {
  data: BTCTooltipData;
  position: { x: number; y: number };
}

export const BTCTooltip: React.FC<BTCTooltipProps> = ({ data, position }) => {
  const { data: marketRotation } = useMarketRotation('7d');
  
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
  const maxFlow = Math.max(totalInflow, totalOutflow, Math.abs(netFlow));

  // Get macro market data
  const sp500 = marketRotation?.indices.find(idx => idx.id === 'SP500');
  const nasdaq = marketRotation?.indices.find(idx => idx.id === 'NASDAQ');
  const dxy = marketRotation?.indices.find(idx => idx.id === 'DXY');

  const getChangeColor = (change?: number) => {
    if (!change) return 'text-slate-400';
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div
      className="absolute z-50 p-2 transition-opacity duration-200"
      style={{
        left: position.x + 15,
        top: position.y + 15,
        pointerEvents: 'none',
      }}
    >
      <Card className="w-96 bg-gradient-to-br from-orange-900/90 to-slate-900/90 backdrop-blur-sm border-orange-500/50 text-white shadow-2xl shadow-orange-500/20">
        <CardHeader className="p-3 border-b border-orange-500/30">
          <CardTitle className="text-lg flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="text-2xl">₿</span>
              <span>{data.id}</span>
            </span>
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
              Market Leader
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-sm space-y-4">
          {/* BTC Price Info */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <span className="text-slate-300">Price:</span>
              <span className="block font-mono font-bold text-lg">
                ${data.price?.toLocaleString() ?? 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-300">24h Change:</span>
              <span className={`block font-mono font-bold ${getChangeColor(data.priceChange24h)}`}>
                {data.priceChange24h ? `${data.priceChange24h >= 0 ? '+' : ''}${data.priceChange24h.toFixed(2)}%` : 'N/A'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-300">Volume (24h):</span>
              <span className="block font-mono">
                ${data.volume ? (data.volume / 1e9).toFixed(2) : 'N/A'}B
              </span>
            </div>
          </div>

          {/* Capital Flow Visualization */}
          {data.capitalFlows && data.capitalFlows.length > 0 && (
            <div className="space-y-2 border-t border-orange-500/30 pt-3">
              <h4 className="font-bold text-orange-300 mb-2">Capital Flow</h4>
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

          {/* Macro Market Analysis */}
          <div className="border-t border-orange-500/30 pt-3">
            <h4 className="font-bold text-orange-300 mb-2">📊 Macro Market Sentiment</h4>
            <div className="space-y-2">
              {sp500 && (
                <div className="flex justify-between items-center bg-slate-800/50 rounded p-2">
                  <span className="text-slate-300">S&P 500</span>
                  <span className={`font-mono font-bold ${getChangeColor(sp500.change)}`}>
                    {sp500.change >= 0 ? '+' : ''}{sp500.change.toFixed(2)}%
                  </span>
                </div>
              )}
              {nasdaq && (
                <div className="flex justify-between items-center bg-slate-800/50 rounded p-2">
                  <span className="text-slate-300">NASDAQ</span>
                  <span className={`font-mono font-bold ${getChangeColor(nasdaq.change)}`}>
                    {nasdaq.change >= 0 ? '+' : ''}{nasdaq.change.toFixed(2)}%
                  </span>
                </div>
              )}
              {dxy && (
                <div className="flex justify-between items-center bg-slate-800/50 rounded p-2">
                  <span className="text-slate-300">DXY (Dollar Index)</span>
                  <span className={`font-mono font-bold ${getChangeColor(dxy.change)}`}>
                    {dxy.change >= 0 ? '+' : ''}{dxy.change.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            
            {/* Market Correlation Insight */}
            <div className="mt-3 p-2 bg-orange-500/10 rounded border border-orange-500/20">
              <p className="text-xs text-orange-200">
                {sp500 && sp500.change > 0 && data.priceChange24h && data.priceChange24h > 0 
                  ? "🟢 BTC moving in correlation with equities - risk-on sentiment"
                  : sp500 && sp500.change < 0 && data.priceChange24h && data.priceChange24h > 0
                  ? "🟡 BTC diverging positively from equities - safe haven appeal"
                  : dxy && dxy.change > 0 && data.priceChange24h && data.priceChange24h < 0
                  ? "🔴 Dollar strength pressuring BTC - typical inverse correlation"
                  : "⚪ Mixed market signals - consolidation phase"}
              </p>
            </div>
          </div>

          {data.explosivePotential === 'High' && (
            <div className="border-t border-orange-500/30 pt-3 text-center">
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
