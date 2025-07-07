
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExplosiveCryptos } from '@/hooks/useExplosiveCryptos';
import CryptoLogo from './CryptoLogo';
import { Button } from '@/components/ui/button';

export const ExplosiveWatchPanel: React.FC = () => {
  const { explosiveCryptos, loading } = useExplosiveCryptos();

  const handleAnalyze = (symbol: string) => {
    const event = new CustomEvent('node-click', { detail: { nodeId: symbol } });
    document.dispatchEvent(event);
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">Explosive Watch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">Explosive Watch</CardTitle>
      </CardHeader>
      <CardContent>
        {explosiveCryptos.length > 0 ? (
          <ul className="space-y-4">
            {explosiveCryptos.slice(0, 3).map((crypto) => (
              <li key={crypto.symbol} className="flex items-center justify-between p-2 rounded-lg bg-gray-700">
                <div className="flex items-center">
                  <CryptoLogo symbol={crypto.symbol} className="w-8 h-8 mr-3" />
                  <div>
                    <div className="font-bold text-white">{crypto.symbol}</div>
                    <div className="text-sm text-gray-400">{crypto.factors.join(', ')}</div>
                  </div>
                </div>
                <Button onClick={() => handleAnalyze(crypto.symbol)} size="sm">
                  Analyze
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-400">No explosive signals detected.</div>
        )}
      </CardContent>
    </Card>
  );
};
