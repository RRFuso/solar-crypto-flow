import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { CryptoData } from '@/types/crypto';
import { TrendingUp, Minus, TrendingDown } from 'lucide-react';

interface SocialHypeTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

// Temporary mock data for social metrics
const socialMetrics = {
  'BTC': { mentions: 15000, growth: 25, sentiment: 'positive' },
  'ETH': { mentions: 12000, growth: 15, sentiment: 'positive' },
  'SOL': { mentions: 8000, growth: 120, sentiment: 'positive' },
  'AVAX': { mentions: 5000, growth: -10, sentiment: 'negative' },
  // Add more as needed
};

const SocialHypeTab = ({ cryptos, selectedCrypto, onSelectCrypto }: SocialHypeTabProps) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  // Filter and sort cryptos by social metrics
  const socialHypeCryptos = cryptos
    .filter(c => socialMetrics[c.id as keyof typeof socialMetrics])
    .sort((a, b) => {
      const aMetrics = socialMetrics[a.id as keyof typeof socialMetrics];
      const bMetrics = socialMetrics[b.id as keyof typeof socialMetrics];
      return bMetrics.mentions - aMetrics.mentions;
    });

  return (
    <TabsContent value="social" className="m-0 h-full">
      <div className="h-full flex flex-col">
        <ColumnHeader 
          title="Social Hype" 
          subtitle="Trending nas redes sociais" 
        />
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {socialHypeCryptos.map((crypto) => {
              const metrics = socialMetrics[crypto.id as keyof typeof socialMetrics];
              const isExplosive = metrics.growth > 100;
              const isHyperExplosive = metrics.growth > 500;
              
              return (
                <div
                  key={crypto.id}
                  className={`
                    ${isExplosive ? 'bg-amber-500/10 border-amber-500/50' : ''}
                    ${isHyperExplosive ? 'animate-pulse' : ''}
                  `}
                >
                  <CryptoCard
                    crypto={crypto}
                    onClick={() => onSelectCrypto(crypto)}
                    isSelected={selectedCrypto.id === crypto.id}
                    extraContent={
                      <div className="flex items-center gap-2 mt-2">
                        {getSentimentIcon(metrics.sentiment)}
                        <span className={`text-sm ${metrics.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metrics.growth > 0 ? '+' : ''}{metrics.growth}% 24h
                        </span>
                        <span className="text-sm text-gray-400">
                          {metrics.mentions.toLocaleString()} menções
                        </span>
                      </div>
                    }
                  />
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </TabsContent>
  );
};

export default SocialHypeTab;