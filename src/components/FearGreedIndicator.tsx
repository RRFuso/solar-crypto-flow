import { sharedFetchJson, BTC_SIMPLE_PRICE_URL } from '@/lib/cache/sharedFetch';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import FearGreedGauge from './fear-greed/FearGreedGauge';
import BTCDominance from './fear-greed/BTCDominance';
import EconomicIndicators from './fear-greed/EconomicIndicators';
import BitcoinEconomicChart from './fear-greed/BitcoinEconomicChart';
import { 
  getClassification, 
  getColors, 
  getMessage, 
  getMessageColor,
  getDominanceColor,
  getDominanceText
} from './fear-greed/utils';

interface FearGreedData {
  value: number;
  classification: string;
}

const FearGreedIndicator = () => {
  const { data: fearGreedData, isLoading: fearGreedLoading } = useQuery({
    queryKey: ['fear-greed'],
    queryFn: async (): Promise<FearGreedData> => {
      try {
        const response = await fetch('https://api.alternative.me/fng/');
        const data = await response.json();
        return {
          value: parseInt(data.data[0].value),
          classification: data.data[0].value_classification
        };
      } catch (error) {
        console.error('Error fetching Fear & Greed index:', error);
        toast.error('Erro ao carregar índice Medo & Ganância');
        throw error;
      }
    },
    refetchInterval: 24 * 60 * 60 * 1000,
    staleTime: 12 * 60 * 60 * 1000,
    retry: 3,
    retryDelay: 5000
  });

  const { data: btcDominanceData, isLoading: btcDominanceLoading } = useQuery({
    queryKey: ['btc-dominance'],
    queryFn: async () => {
      try {
        const data = await sharedFetchJson<any>('https://api.coingecko.com/api/v3/global', 5 * 60_000);
        
        const dominanceValue = data.data?.market_cap_percentage?.btc ?? NaN;
        
                
        if (isNaN(dominanceValue)) {
          throw new Error('Invalid BTC dominance value');
        }
        
        return {
          value: dominanceValue.toFixed(2),
        };
      } catch (error) {
        console.error('Error fetching BTC dominance:', error);
        toast.error('Erro ao carregar dominância do Bitcoin');
        return {
          value: "—"
        };
      }
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    retry: 3,
    retryDelay: 5000
  });

  const { data: economicData, isLoading: economicLoading } = useQuery({
    queryKey: ['economic-indicators'],
    queryFn: async () => {
      try {
        return {
          dxy: "—", // sem fonte gratuita integrada
          spx: "—",
          nasdaq: "—",
        };
      } catch (error) {
        console.error('Error fetching economic indicators:', error);
        return {
          dxy: "—", // sem fonte gratuita integrada
          spx: "—",
          nasdaq: "—",
        };
      }
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    retry: 3,
    retryDelay: 5000
  });

  const { data: btcPriceData, isLoading: btcLoading } = useQuery({
    queryKey: ['btc-price'],
    queryFn: async () => {
      try {
        const data = await sharedFetchJson<any>(BTC_SIMPLE_PRICE_URL, 60_000);
        return {
          price: data.bitcoin.usd.toLocaleString(),
          change24h: parseFloat(data.bitcoin.usd_24h_change.toFixed(2))
        };
      } catch (error) {
        console.error('Error fetching BTC price:', error);
        return {
          price: "—",
          change24h: null as number | null
        };
      }
    },
    refetchInterval: 30 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    retry: 3
  });

  if (fearGreedLoading || btcDominanceLoading || economicLoading || btcLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const value = fearGreedData?.value ?? 50;
  const classification = getClassification(value);
  const colors = getColors(value);
  const message = getMessage(value);
  const messageColor = getMessageColor(value);
  const btcDominance = parseFloat(btcDominanceData?.value ?? "59.02");
  const dominanceColor = getDominanceColor(btcDominance);
  const dominanceText = getDominanceText(btcDominance);
  
  const btcChange = btcPriceData?.change24h || 0;
  const marketSentiment = value > 60 || btcChange > 3 
    ? 'bullish' 
    : value < 40 || btcChange < -3 
    ? 'bearish' 
    : 'neutral';

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* First row: Economic Indicators and Bitcoin Chart side by side */}
      <div className="flex flex-wrap md:flex-nowrap gap-4">
        <div className="w-full md:w-1/2">
          <EconomicIndicators
            dxy={economicData?.dxy ?? "104.23"}
            spx={economicData?.spx ?? "5,254.42"}
            nasdaq={economicData?.nasdaq ?? "16,742.39"}
          />
        </div>
        <div className="w-full md:w-1/2">
          <BitcoinEconomicChart
            btcPrice={btcPriceData?.price || "30,142.82"}
            btcChange={btcPriceData?.change24h || 0}
            marketSentiment={marketSentiment}
          />
        </div>
      </div>
      
      {/* Second row: Fear & Greed and BTC Dominance side by side */}
      <div className="flex flex-wrap gap-4 md:flex-nowrap">
        <div className="w-full md:w-1/2">
          <FearGreedGauge
            value={value}
            classification={classification}
            colors={colors}
            message={message}
            messageColor={messageColor}
          />
        </div>
        <div className="w-full md:w-1/2">
          <BTCDominance
            dominance={btcDominance}
            dominanceColor={dominanceColor}
            dominanceText={dominanceText}
          />
        </div>
      </div>
      
      <div className="text-center text-[10px] text-gray-500">
        Este painel é uma ferramenta para auxiliar sua análise. Todas as decisões de investimento são de sua responsabilidade.
      </div>
    </div>
  );
};

export default FearGreedIndicator;
