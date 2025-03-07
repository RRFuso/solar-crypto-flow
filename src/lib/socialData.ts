
import { SocialMentionsData } from '@/types/social';
import { toast } from 'sonner';

// Mock data for trending crypto mentions
export const getTrendingCryptoMentions = async (timeframe: string): Promise<SocialMentionsData> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, this would call an API like Twitter/X API
  // For now, return mock data
  try {
    const topMentions = [
      { symbol: 'BTC', name: 'Bitcoin', count: 24587, trend: 3.2, sentiment: 0.68 },
      { symbol: 'ETH', name: 'Ethereum', count: 18392, trend: 1.7, sentiment: 0.72 },
      { symbol: 'SOL', name: 'Solana', count: 12456, trend: 5.4, sentiment: 0.81 },
      { symbol: 'DOGE', name: 'Dogecoin', count: 8732, trend: -2.1, sentiment: 0.56 },
      { symbol: 'XRP', name: 'Ripple', count: 6543, trend: 0.8, sentiment: 0.62 },
      { symbol: 'ADA', name: 'Cardano', count: 4982, trend: -1.2, sentiment: 0.49 },
      { symbol: 'LINK', name: 'Chainlink', count: 3756, trend: 4.3, sentiment: 0.73 },
      { symbol: 'DOT', name: 'Polkadot', count: 3421, trend: 1.5, sentiment: 0.65 },
      { symbol: 'AVAX', name: 'Avalanche', count: 3287, trend: 2.7, sentiment: 0.71 },
      { symbol: 'MATIC', name: 'Polygon', count: 2954, trend: -0.9, sentiment: 0.58 },
      { symbol: 'SHIB', name: 'Shiba Inu', count: 2743, trend: -3.2, sentiment: 0.42 },
    ];

    // Generate time series data for the chart
    const mentionsOverTime = generateTimeSeries(timeframe, topMentions.slice(0, 5));

    console.log("Social data loaded for timeframe:", timeframe);
    
    return {
      topMentions,
      mentionsOverTime,
    };
  } catch (error) {
    console.error("Error fetching social mentions:", error);
    toast.error("Falha ao carregar dados sociais");
    throw error;
  }
};

// Helper function to generate time series data
const generateTimeSeries = (timeframe: string, topCoins: any[]) => {
  const now = new Date();
  const series = [];
  
  // Determine number of data points based on timeframe
  const dataPoints = timeframe === '1h' ? 12 : timeframe === '24h' ? 24 : 7;
  const interval = timeframe === '1h' ? 5 * 60 * 1000 : timeframe === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(now.getTime() - (dataPoints - i) * interval).toISOString();
    
    // Generate random count fluctuations for each coin
    const symbols = topCoins.map(coin => {
      const baseCount = coin.count * 0.7;  // 70% of the final count as base
      // Random fluctuation between 70% and 130% of base count
      const randomFactor = 0.7 + Math.random() * 0.6;
      // For the last data point, use the exact count from topCoins
      const count = i === dataPoints - 1 ? coin.count : Math.round(baseCount * randomFactor);
      
      return {
        symbol: coin.symbol,
        count: count
      };
    });
    
    series.push({
      timestamp,
      symbols
    });
  }
  
  return series;
};
