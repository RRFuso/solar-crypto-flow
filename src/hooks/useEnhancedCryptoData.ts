import { useEffect, useState } from 'react';
import { CryptoData } from '@/types/crypto';
import { useCryptoData } from './useCryptoData';
import { realDataCalculator } from '@/lib/signals/realDataCalculator';

/**
 * Hook para dados de crypto aprimorados com métricas reais calculadas
 */
export const useEnhancedCryptoData = () => {
  const { data: baseCryptoData, isLoading, error } = useCryptoData();
  const [enhancedData, setEnhancedData] = useState<CryptoData[]>([]);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    if (!baseCryptoData || baseCryptoData.length === 0) {
      setEnhancedData([]);
      return;
    }

    const enhanceData = async () => {
      setEnhancing(true);
      
      try {
        const enhanced = await Promise.all(
          baseCryptoData.map(async (crypto) => {
            if (!crypto.symbol) return crypto;
            
            // Calcular métricas reais em paralelo
            const [avgVolume, volatility, supportResistance] = await Promise.all([
              realDataCalculator.calculateRealAverageVolume(crypto.symbol, 7),
              realDataCalculator.calculateRealVolatility(crypto.symbol, 30),
              realDataCalculator.calculateSupportResistance(crypto.symbol, 30)
            ]);

            return {
              ...crypto,
              avgVolume24h: avgVolume > 0 ? avgVolume : crypto.volume24h * 0.8,
              volatility,
              supportLevel: supportResistance.support,
              resistanceLevel: supportResistance.resistance
            };
          })
        );

        setEnhancedData(enhanced);
      } catch (error) {
        console.error('Erro ao aprimorar dados de crypto:', error);
        // Fallback para dados base com valores padrão
        const fallbackData = baseCryptoData.map(crypto => ({
          ...crypto,
          avgVolume24h: crypto.volume24h ? crypto.volume24h * 0.8 : undefined,
          volatility: 0.5, // Volatilidade padrão
          supportLevel: crypto.price ? crypto.price * 0.95 : undefined,
          resistanceLevel: crypto.price ? crypto.price * 1.05 : undefined
        }));
        setEnhancedData(fallbackData);
      } finally {
        setEnhancing(false);
      }
    };

    enhanceData();
  }, [baseCryptoData]);

  return {
    data: enhancedData,
    isLoading: isLoading || enhancing,
    error
  };
};