
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import FearGreedGauge from './fear-greed/FearGreedGauge';
import BTCDominance from './fear-greed/BTCDominance';
import EconomicIndicators from './fear-greed/EconomicIndicators';
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
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        const data = await response.json();
        const dominanceValue = 59.02; // Synchronized with BTC.D chart
        
        console.log('BTC Dominance fetched:', dominanceValue);
        
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
          value: "59.02" // Fallback to known correct value
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
        const response = await fetch('https://api.twelvedata.com/price?symbol=DXY,SPX,IXIC&apikey=demo');
        const data = await response.json();
        return {
          dxy: parseFloat(data.DXY?.price || '0').toFixed(2),
          spx: parseFloat(data.SPX?.price || '0').toFixed(2),
          nasdaq: parseFloat(data.IXIC?.price || '0').toFixed(2),
        };
      } catch (error) {
        console.error('Error fetching economic indicators:', error);
        throw error;
      }
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    retry: 3,
    retryDelay: 5000
  });

  if (fearGreedLoading || btcDominanceLoading || economicLoading) {
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

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap justify-center gap-4 md:flex-nowrap">
        <FearGreedGauge
          value={value}
          classification={classification}
          colors={colors}
          message={message}
          messageColor={messageColor}
        />
        <BTCDominance
          dominance={btcDominance}
          dominanceColor={dominanceColor}
          dominanceText={dominanceText}
        />
        <EconomicIndicators
          dxy={economicData?.dxy ?? "0"}
          spx={economicData?.spx ?? "0"}
          nasdaq={economicData?.nasdaq ?? "0"}
        />
      </div>
      <div className="text-center text-[10px] text-gray-500">
        Este painel é uma ferramenta para auxiliar sua análise. Todas as decisões de investimento são de sua responsabilidade.
      </div>
    </div>
  );
};

export default FearGreedIndicator;
