
import React, { useState, useEffect } from 'react';
import { Prediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
// Importa useQuery para buscar dados históricos
import { useQuery } from '@tanstack/react-query'; 
import { supabase } from '@/integrations/supabase/client'; // Assume que o cliente supabase está aqui
import { usePriceActionSignals, PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Define a interface para os dados históricos
interface HistoricalDataPoint {
  date: string;
  low: number;
  high: number;
  close: number;
}

interface AIWatchlistProps {
  predictions: Prediction[];
  maxItems?: number;
  chartTimeframe?: string;
}

interface Strategy {
  symbol: string;
  name: string;
  direction: 'bullish' | 'bearish';
  entry: string; // Ponto de entrada sugerido (ex: retração, suporte)
  stopLoss: string; // Stop loss sugerido (ex: abaixo da mínima anterior)
  takeProfit1: string; // TP ainda pode ser baseado em R:R
  takeProfit2: string; // TP ainda pode ser baseado em R:R
  risk: string;
  reward: string;
  overview: string;
  indicators: string[];
  timeframe: string;
  explosivePotential?: string;
  priceActionSignals?: string[];
}

// Função para buscar dados históricos (exemplo)
const fetchHistoricalData = async (symbol: string, limit: number = 10): Promise<HistoricalDataPoint[]> => {
  const { data, error } = await supabase
    .from('crypto_historical_data') // Nome da tabela de dados históricos
    .select('date, low, high, close')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
  // Garante que os dados retornados correspondem à interface
  return (data || []).map(d => ({ 
      date: d.date, 
      low: d.low ?? 0, 
      high: d.high ?? 0, 
      close: d.close ?? 0 
  }));
};

const AIWatchlist: React.FC<AIWatchlistProps> = ({
  predictions,
  maxItems = 5,
  chartTimeframe = '4h',
}) => {
  const [search, setSearch] = useState('');
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [selectedSymbolForHistory, setSelectedSymbolForHistory] = useState<string | null>(null);

  // Hook para buscar dados históricos quando uma estratégia é selecionada
  const { data: historicalData, isLoading: isLoadingHistory } = useQuery<HistoricalDataPoint[]>({
    queryKey: ['historicalData', selectedSymbolForHistory],
    queryFn: () => selectedSymbolForHistory ? fetchHistoricalData(selectedSymbolForHistory, 10) : Promise.resolve([]),
    enabled: !!selectedSymbolForHistory, // Só busca quando um símbolo é selecionado
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  });

  // Extract symbols from predictions for the hook
  const symbols = predictions.map(p => p.symbol);
  const { signals, signalsLoading } = usePriceActionSignals(symbols);

  const filtered = predictions
    .filter(p =>
      p.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const aSignal = signals.get(a.symbol);
      const bSignal = signals.get(b.symbol);
      const explosiveOrder = { 'High': 4, 'Medium': 3, 'Low': 2, 'None': 1 };
      const aExplosive = explosiveOrder[aSignal?.explosivePotential || 'None'];
      const bExplosive = explosiveOrder[bSignal?.explosivePotential || 'None'];
      if (aExplosive !== bExplosive) return bExplosive - aExplosive;
      return b.confidence - a.confidence;
    });

  const bullish = filtered.filter(p => p.bullish).slice(0, maxItems);
  const bearish = filtered.filter(p => !p.bullish).slice(0, maxItems);

  const getExplosiveBadge = (explosivePotential?: string) => {
    if (!explosivePotential || explosivePotential === 'None') return null;
    const config = {
      'High': { color: 'text-red-400 bg-red-900/30 border-red-400/50', icon: '🚀', label: 'HIGH' },
      'Medium': { color: 'text-orange-400 bg-orange-900/30 border-orange-400/50', icon: '⚡', label: 'MED' },
      'Low': { color: 'text-yellow-400 bg-yellow-900/30 border-yellow-400/50', icon: '📈', label: 'LOW' }
    };
    const badge = config[explosivePotential as keyof typeof config];
    if (!badge) return null;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${badge.color}`}>
        <span>{badge.icon}</span>
        <span>{badge.label}</span>
      </div>
    );
  };

  const getPriceActionSignals = (signal?: PriceActionSignal): string[] => {
    if (!signal) return [];
    const signalsList: string[] = [];
    if (signal.isBreakout) signalsList.push('💥 Volume Breakout');
    if (signal.isExpansion) signalsList.push('📊 Volatilidade Expansão');
    if (signal.isAccelerating) signalsList.push('🚀 Momentum Aceleração');
    return signalsList;
  };

  const indicatorsFromFactors = (p: Prediction): string[] => {
    const result: string[] = [];
    const lowerFactors = p.factors.map(f => f.toLowerCase());
    if (lowerFactors.some(f => f.includes('rsi'))) result.push('🔁 RSI Divergência');
    if (lowerFactors.some(f => f.includes('macd'))) result.push('📊 MACD Cruzamento');
    if (lowerFactors.some(f => f.includes('volume'))) result.push('💥 Volume Anômalo');
    if (lowerFactors.some(f => f.includes('flow') || f.includes('inflow') || f.includes('outflow'))) result.push('🌊 Fluxo de Capital');
    if (lowerFactors.some(f => f.includes('support') || f.includes('resistance'))) result.push('🧱 Suporte/Resistência');
    const signal = signals.get(p.symbol);
    const priceActionSignals = getPriceActionSignals(signal);
    result.push(...priceActionSignals);
    return result.length > 0 ? result : ['📈 Análise Técnica'];
  };

  // Função para calcular estratégia com base em dados históricos (se disponíveis)
  const calculateStrategy = (p: Prediction, history: HistoricalDataPoint[] | undefined) => {
    const currentPrice = parseFloat(p.price || '0') || 1;
    let entryPrice = currentPrice; // Entrada padrão é o preço atual
    let stopLossPrice = p.bullish ? currentPrice * 0.97 : currentPrice * 1.03; // Stop padrão 3%
    let stopBasis = "(3% Padrão)";

    if (history && history.length > 1) {
      const recentLows = history.map(h => h.low).sort((a, b) => a - b);
      const recentHighs = history.map(h => h.high).sort((a, b) => b - a);
      const previousLow = recentLows[0]; // Mínima mais recente do período buscado
      const previousHigh = recentHighs[0]; // Máxima mais recente

      if (p.bullish) {
        // Entrada: Tenta encontrar um ponto de retração/suporte (ex: média entre low e high recentes)
        const potentialSupport = (previousLow + previousHigh) / 2; 
        // Se o suporte calculado for razoável (abaixo do preço atual mas acima da mínima)
        if (potentialSupport < currentPrice && potentialSupport > previousLow) {
             entryPrice = potentialSupport; 
        } else {
             // Ou entra perto da mínima anterior se o preço estiver muito esticado
             entryPrice = previousLow * 1.01; // Um pouco acima da mínima
        }
        entryPrice = Math.min(entryPrice, currentPrice); // Não entra acima do preço atual

        // Stop: Abaixo da mínima anterior
        stopLossPrice = previousLow * 0.99; // 1% abaixo da mínima
        stopBasis = `(Abaixo da Mínima ${previousLow.toFixed(2)})`;

      } else { // Bearish
        // Entrada: Tenta encontrar um ponto de retração/resistência
        const potentialResistance = (previousLow + previousHigh) / 2;
        if (potentialResistance > currentPrice && potentialResistance < previousHigh) {
            entryPrice = potentialResistance;
        } else {
            entryPrice = previousHigh * 0.99; // Um pouco abaixo da máxima
        }
        entryPrice = Math.max(entryPrice, currentPrice); // Não entra abaixo do preço atual

        // Stop: Acima da máxima anterior
        stopLossPrice = previousHigh * 1.01; // 1% acima da máxima
        stopBasis = `(Acima da Máxima ${previousHigh.toFixed(2)})`;
      }
    }

    // Garante que stop loss não seja zero ou negativo
    stopLossPrice = Math.max(stopLossPrice, 0.0001); 
    entryPrice = Math.max(entryPrice, 0.0001);

    const stopDistance = Math.abs(entryPrice - stopLossPrice);
    const stopPercent = (stopDistance / entryPrice) * 100;

    // Take Profit baseado em Risco:Retorno (ex: 1:1.5 e 1:2.5)
    const takeProfit1 = p.bullish ? entryPrice + stopDistance * 1.5 : entryPrice - stopDistance * 1.5;
    const takeProfit2 = p.bullish ? entryPrice + stopDistance * 2.5 : entryPrice - stopDistance * 2.5;
    const rewardPercent = (Math.abs(takeProfit2 - entryPrice) / entryPrice) * 100;

    const indicators = indicatorsFromFactors(p);
    const signal = signals.get(p.symbol);
    const priceActionSignals = getPriceActionSignals(signal);

    let overview = `${p.symbol} (${p.name || ''}) apresenta potencial ${p.bullish ? 'bullish' : 'bearish'} (${Math.round(p.confidence * 100)}% conf.) baseado em ${indicators.slice(0, 2).join(', ')}.`;
    if (signal?.explosivePotential && signal.explosivePotential !== 'None') {
      overview += ` Potencial explosivo ${signal.explosivePotential.toLowerCase()} detectado.`;
    }
    overview += ` Estratégia sugerida para ${chartTimeframe}.`;

    setStrategy({
      symbol: p.symbol,
      name: p.name || p.symbol,
      direction: p.bullish ? 'bullish' : 'bearish',
      entry: entryPrice.toFixed(4), // Mais casas decimais para cripto
      stopLoss: stopLossPrice.toFixed(4),
      takeProfit1: Math.max(0, takeProfit1).toFixed(4),
      takeProfit2: Math.max(0, takeProfit2).toFixed(4),
      risk: `${stopPercent.toFixed(1)}% ${stopBasis}`,
      reward: `${rewardPercent.toFixed(1)}%`,
      overview,
      indicators,
      timeframe: chartTimeframe,
      explosivePotential: signal?.explosivePotential,
      priceActionSignals
    });
  };

  // Atualiza a estratégia quando os dados históricos carregam
  useEffect(() => {
    if (strategy && selectedSymbolForHistory === strategy.symbol && historicalData && !isLoadingHistory) {
      const prediction = predictions.find(p => p.symbol === strategy.symbol);
      if (prediction) {
        calculateStrategy(prediction, historicalData);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historicalData, isLoadingHistory]); // Depende do histórico e do loading

  // Função chamada ao clicar em "Ver Estratégia"
  const handleShowStrategyClick = (p: Prediction) => {
    setSelectedSymbolForHistory(p.symbol); // Inicia busca de dados históricos
    calculateStrategy(p, undefined); // Mostra estratégia inicial (com stops padrão)
  };

  const renderCard = (p: Prediction) => {
    const signal = signals.get(p.symbol);
    
    if (signalsLoading) {
      return (
        <div key={p.symbol} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={p.symbol}
        className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors text-white border border-gray-700 relative"
      >
        {signal?.explosivePotential && signal.explosivePotential !== 'None' && (
          <div className="absolute -top-2 -right-2 z-10">
            {getExplosiveBadge(signal.explosivePotential)}
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <img
            src={getCryptoLogoUrl(p.symbol)}
            alt={p.symbol}
            className="w-8 h-8 rounded-full flex-shrink-0 mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm truncate">{p.symbol}</span>
              <div className={`flex items-center gap-1 ${p.bullish ? 'text-green-400' : 'text-red-400'}`}>
                {p.bullish ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span className="text-xs font-medium">{Math.round(p.confidence * 100)}%</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-400 mb-2 line-clamp-2">{p.factors[0]}</div>
            
            {/* Price Action Signals from Supabase */}
            {signal && (signal.isBreakout || signal.isExpansion || signal.isAccelerating) && (
              <div className="flex flex-wrap gap-1 mb-2">
                {signal.isBreakout && (
                  <span className="text-xs bg-red-900/30 text-red-300 px-1.5 py-0.5 rounded border border-red-400/30">
                    💥 Breakout
                  </span>
                )}
                {signal.isExpansion && (
                  <span className="text-xs bg-orange-900/30 text-orange-300 px-1.5 py-0.5 rounded border border-orange-400/30">
                    📊 Expansão
                  </span>
                )}
                {signal.isAccelerating && (
                  <span className="text-xs bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">
                    🚀 Aceleração
                  </span>
                )}
              </div>
            )}
            
            {p.confidence > 0.6 && (
              <button
                onClick={() => handleShowStrategyClick(p)} // Chama a função que busca histórico
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                Ver Estratégia
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black border border-gray-700 rounded-lg h-full flex flex-col min-w-[380px] max-w-[450px]">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
          🧠 AI Watchlist
          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
            Price Action
          </span>
        </h2>
        <input
          className="w-full p-2 rounded-md bg-gray-900 border border-gray-600 text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          placeholder="🔍 Buscar ativo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-green-400 text-sm font-medium mb-3 flex items-center gap-2">
              🐂 Bullish Signals
            </h3>
            <div className="space-y-2">
              {bullish.length ? (
                bullish.map(renderCard)
              ) : (
                <div className="text-gray-500 text-xs text-center py-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  Nenhum sinal bullish disponível
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-red-400 text-sm font-medium mb-3 flex items-center gap-2">
              🐻 Bearish Signals
            </h3>
            <div className="space-y-2">
              {bearish.length ? (
                bearish.map(renderCard)
              ) : (
                <div className="text-gray-500 text-xs text-center py-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  Nenhum sinal bearish disponível
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Dialog */}
      {strategy && (
        <Dialog open={!!strategy} onOpenChange={() => setStrategy(null)}>
          <DialogContent className="bg-gray-900 border border-gray-700 max-w-lg w-full text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-center flex items-center justify-center gap-2">
                Estratégia: {strategy.name} ({strategy.symbol})
                {strategy.explosivePotential && strategy.explosivePotential !== 'None' && (
                  <span className="text-xs bg-gradient-to-r from-red-500 to-orange-500 px-2 py-1 rounded-full">
                    🚀 {strategy.explosivePotential}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-400">
                Baseada no timeframe {strategy.timeframe}
                {isLoadingHistory && " (Carregando dados históricos...)"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-300">{strategy.overview}</p>
              </div>
              
              {strategy.priceActionSignals && strategy.priceActionSignals.length > 0 && (
                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-3 rounded-lg border border-purple-500/30">
                  <h4 className="font-medium mb-2 text-purple-300">🔥 Sinais de Price Action:</h4>
                  <ul className="space-y-1">
                    {strategy.priceActionSignals.map((signal, idx) => (
                      <li key={idx} className="text-xs text-purple-200">• {signal}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="bg-gray-800 p-3 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-400">📊 Indicadores Técnicos:</h4>
                <ul className="space-y-1">
                  {strategy.indicators.slice(0, 5).map((indicator, idx) => (
                    <li key={idx} className="text-xs text-gray-400">• {indicator}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-900/30 p-3 rounded-lg border border-green-700/50">
                  <div className="text-green-400 text-xs font-medium">📥 Entrada Sugerida</div>
                  <div className="text-white font-bold">${strategy.entry}</div>
                </div>
                <div className="bg-red-900/30 p-3 rounded-lg border border-red-700/50">
                  <div className="text-red-400 text-xs font-medium">🛑 Stop Loss Sugerido</div>
                  <div className="text-white font-bold">${strategy.stopLoss}</div>
                </div>
                <div className="bg-green-900/20 p-3 rounded-lg border border-green-600/50">
                  <div className="text-green-300 text-xs font-medium">🎯 Take Profit 1 (R:R 1.5)</div>
                  <div className="text-white font-bold">${strategy.takeProfit1}</div>
                </div>
                <div className="bg-green-900/20 p-3 rounded-lg border border-green-600/50">
                  <div className="text-green-300 text-xs font-medium">🎯 Take Profit 2 (R:R 2.5)</div>
                  <div className="text-white font-bold">${strategy.takeProfit2}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-yellow-900/30 p-2 rounded-lg border border-yellow-700/50 text-center">
                  <div className="text-yellow-300 text-xs">⚠️ Risco Calculado</div>
                  <div className="text-white font-bold text-sm">{strategy.risk}</div>
                </div>
                <div className="bg-blue-900/30 p-2 rounded-lg border border-blue-700/50 text-center">
                  <div className="text-blue-300 text-xs">📈 Retorno Potencial (TP2)</div>
                  <div className="text-white font-bold text-sm">{strategy.reward}</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center pt-2">Nota: Esta é uma estratégia gerada por IA e não constitui aconselhamento financeiro. Faça a sua própria pesquisa.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AIWatchlist;