
import React from 'react';
import MarketRotationIndicator from './MarketRotationIndicator';
import { useCryptoData } from '@/hooks/useCryptoData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowDownRight, ArrowUpRight, Loader2, AlertTriangle } from 'lucide-react';

const CryptoMarketSummary = () => {
  const { data: cryptos = [], isLoading, error } = useCryptoData({ timeframe: '4h' });

  // Get top 5 gainers and losers
  const topGainers = [...cryptos]
    .sort((a, b) => (b.performance || 0) - (a.performance || 0))
    .slice(0, 5);

  const topLosers = [...cryptos]
    .sort((a, b) => (a.performance || 0) - (b.performance || 0))
    .slice(0, 5);

  return (
    <Card className="w-full bg-black/50 border border-gray-800 overflow-hidden">
      <CardHeader className="border-b border-gray-800 p-4">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Mercado Crypto
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-white">Carregando dados de crypto...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-amber-400">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p className="text-white">Erro ao carregar dados de crypto</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Top Gainers</h3>
              <div className="space-y-2">
                {topGainers.map((crypto) => (
                  <div key={crypto.id} className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{crypto.symbol}</span>
                      <span className="text-gray-400 text-sm">{crypto.name}</span>
                    </div>
                    <div className="text-green-400 flex items-center">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      {crypto.performance ? crypto.performance.toFixed(2) : "0.00"}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Top Losers</h3>
              <div className="space-y-2">
                {topLosers.map((crypto) => (
                  <div key={crypto.id} className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{crypto.symbol}</span>
                      <span className="text-gray-400 text-sm">{crypto.name}</span>
                    </div>
                    <div className="text-red-400 flex items-center">
                      <ArrowDownRight className="w-4 h-4 mr-1" />
                      {crypto.performance ? Math.abs(crypto.performance).toFixed(2) : "0.00"}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const HomePanel = () => {
  return (
    <div className="space-y-8">
      <div className="w-full h-[600px]">
        <MarketRotationIndicator />
      </div>
      <div className="w-full">
        <CryptoMarketSummary />
      </div>
    </div>
  );
};

export default HomePanel;
