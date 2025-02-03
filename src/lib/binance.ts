import { toast } from 'sonner';
import { CryptoData } from '@/types/crypto';

export const fetchTickers = async (): Promise<CryptoData[]> => {
  console.info('Fetching tickers from Binance...');
  
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filtra e formata os dados
    return data
      .filter((ticker: any) => 
        ticker.symbol.endsWith('USDT') && 
        !ticker.symbol.includes('UP') && 
        !ticker.symbol.includes('DOWN')
      )
      .map((ticker: any) => {
        const id = ticker.symbol.replace('USDT', '');
        return {
          id,
          name: id,
          performance: parseFloat(ticker.priceChangePercent),
          price: ticker.lastPrice,
          rsi: 50 + (Math.random() * 20 - 10), // Simulado
          rsi4h: 50 + (Math.random() * 20 - 10), // Simulado
          volume: parseFloat(ticker.volume),
          priceChange: parseFloat(ticker.priceChange)
        };
      })
      .sort((a: CryptoData, b: CryptoData) => b.performance - a.performance);
      
  } catch (error) {
    console.error('Error fetching tickers:', error);
    toast.error('Erro ao buscar dados da Binance');
    throw error;
  }
};