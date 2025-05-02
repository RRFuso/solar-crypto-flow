import { toast } from 'sonner';
import { CryptoData } from '@/types/crypto';

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/24hr';

export const fetchTickers = async (): Promise<CryptoData[]> => {
  console.info('Fetching tickers from Binance...');
  
  // First try direct API call
  try {
    const response = await fetchWithTimeout(BINANCE_API);
    if (response.ok) {
      return processBinanceResponse(await response.json());
    }
  } catch (error) {
    console.warn('Direct API call failed, trying with CORS proxy...', error);
  }

  // If direct call fails, try with CORS proxy
  try {
    const response = await fetchWithTimeout(`${CORS_PROXY}${BINANCE_API}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return processBinanceResponse(await response.json());
  } catch (error) {
    console.error('Error fetching tickers with proxy:', error);
    toast.error('Erro ao buscar dados da Binance. Usando dados de fallback.');
    return getFallbackData();
  }
};

// Helper function to process Binance API response
const processBinanceResponse = (data: any[]): CryptoData[] => {
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
        rsi: calculateMockRSI(), // Simulado
        rsi4h: calculateMockRSI(), // Simulado
        volume: parseFloat(ticker.volume),
        priceChange: parseFloat(ticker.priceChange),
        high24h: ticker.highPrice,
        low24h: ticker.lowPrice,
        ema12: calculateMockEMA(12), // Simulado
        ema26: calculateMockEMA(26), // Simulado
        aboveMA14: Math.random() > 0.5, // Simulado
      };
    })
    .sort((a: CryptoData, b: CryptoData) => b.performance - a.performance);
};

// Helper function for fetch with timeout
const fetchWithTimeout = async (url: string, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Mock data calculation helpers
const calculateMockRSI = () => 30 + Math.random() * 40;
const calculateMockEMA = (period: number) => 100 + (Math.random() * 20 - 10);

// Fallback data in case API fails
const getFallbackData = (): CryptoData[] => [
  { 
    id: 'BTC',
    name: 'Bitcoin',
    performance: 2.5,
    price: '48000',
    rsi: 55,
    rsi4h: 58,
    volume: 1000000,
    ema12: 47500,
    ema26: 47000,
    aboveMA14: true
  },
  { 
    id: 'ETH',
    name: 'Ethereum',
    performance: 3.2,
    price: '2300',
    rsi: 52,
    rsi4h: 54,
    volume: 500000,
    ema12: 2250,
    ema26: 2200,
    aboveMA14: true
  },
  { 
    id: 'SOL',
    name: 'Solana',
    performance: 5.1,
    price: '98',
    rsi: 62,
    rsi4h: 65,
    volume: 200000,
    ema12: 95,
    ema26: 92,
    aboveMA14: true
  },
  { 
    id: 'AVAX',
    name: 'Avalanche',
    performance: 4.2,
    price: '34',
    rsi: 58,
    rsi4h: 60,
    volume: 150000,
    ema12: 33,
    ema26: 32,
    aboveMA14: true
  },
  { 
    id: 'MATIC',
    name: 'Polygon',
    performance: -1.5,
    price: '0.85',
    rsi: 45,
    rsi4h: 42,
    volume: 100000,
    ema12: 0.84,
    ema26: 0.86,
    aboveMA14: false
  }
];