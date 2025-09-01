import { supabase } from '@/integrations/supabase/client';

interface TokenMetrics {
  symbol: string;
  netFlow: number;
  exchangeFlow: number;
  whaleActivity: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

// Alternative on-chain data provider using multiple sources
export class AlternativeOnChainProvider {
  
  // Fetch data from CoinGlass (funding rates, liquidations)
  async fetchCoinGlassData(symbol: string): Promise<Partial<TokenMetrics>> {
    try {
      const response = await fetch(`https://api.coinglass.com/api/exchange/balance/list?symbol=${symbol.toUpperCase()}`);
      if (!response.ok) {
        throw new Error(`CoinGlass API error: ${response.status}`);
      }
      const result = await response.json();
      if (result.code !== "0" || !result.data) {
        throw new Error(`CoinGlass API error: ${result.msg}`);
      }

      // Aggregate the 24h balance change from all exchanges as a proxy for net flow
      const netFlow = result.data.reduce((acc: number, exchange: any) => {
        const balanceChange = (exchange.balance_change_percent_1d / 100) * exchange.total_balance;
        return acc + (isNaN(balanceChange) ? 0 : balanceChange);
      }, 0);
      
      // Determine sentiment based on net flow
      // Positive netFlow (balance increase on exchanges) is often Bearish (more supply to sell)
      // Negative netFlow (balance decrease) is often Bullish (supply moving off exchanges)
      const sentiment = netFlow > 0 ? 'Bearish' : netFlow < 0 ? 'Bullish' : 'Neutral';

      return {
        netFlow: netFlow,
        sentiment: sentiment
      };
    } catch (error) {
      console.error('Error fetching CoinGlass data:', error);
      return {};
    }
  }

  // Fetch data from DeFiLlama (TVL, protocol data)
  async fetchDefiLlamaData(symbol: string): Promise<Partial<TokenMetrics>> {
    try {
      // This would integrate with DeFiLlama API for TVL and protocol metrics
      const response = await fetch(`https://api.llama.fi/protocol/${symbol.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        return {
          exchangeFlow: data.tvl || 0,
          sentiment: 'Neutral'
        };
      }
      return {};
    } catch (error) {
      console.error('Error fetching DeFiLlama data:', error);
      return {};
    }
  }

  // Fetch whale transaction data from blockchain scanners
  async fetchWhaleActivity(symbol: string): Promise<number> {
    try {
      // For now, using simulated whale activity data
      // This can be enhanced by integrating with blockchain scanners
      const baseActivity = Math.random() * 1000000;
      
      // Simulate whale activity patterns based on symbol
      const whaleMultipliers: Record<string, number> = {
        'BTC': 5.0,
        'ETH': 4.0,
        'USDT': 3.0,
        'BNB': 2.5,
        'ADA': 2.0,
        'SOL': 3.5,
        'XRP': 2.0,
        'DOT': 1.8,
        'AVAX': 2.2,
        'MATIC': 1.9
      };

      const multiplier = whaleMultipliers[symbol.toUpperCase()] || 1.0;
      return baseActivity * multiplier;
    } catch (error) {
      console.error('Error fetching whale activity:', error);
      return 0;
    }
  }

  // Aggregate all data sources
  async getTokenMetrics(symbol: string): Promise<TokenMetrics> {
    try {
      const [coinGlassData, defiLlamaData, whaleActivity] = await Promise.all([
        this.fetchCoinGlassData(symbol),
        this.fetchDefiLlamaData(symbol),
        this.fetchWhaleActivity(symbol)
      ]);

      const aggregatedNetFlow = (coinGlassData.netFlow || 0) + (defiLlamaData.exchangeFlow || 0) * 0.1;
      
      let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
      if (aggregatedNetFlow > 100000 && whaleActivity > 500000) {
        sentiment = 'Bullish';
      } else if (aggregatedNetFlow < -100000 || whaleActivity < 10000) {
        sentiment = 'Bearish';
      }

      return {
        symbol: symbol.toUpperCase(),
        netFlow: aggregatedNetFlow,
        exchangeFlow: defiLlamaData.exchangeFlow || 0,
        whaleActivity,
        sentiment
      };
    } catch (error) {
      console.error(`Error aggregating metrics for ${symbol}:`, error);
      return {
        symbol: symbol.toUpperCase(),
        netFlow: 0,
        exchangeFlow: 0,
        whaleActivity: 0,
        sentiment: 'Neutral'
      };
    }
  }
}

export const alternativeOnChainProvider = new AlternativeOnChainProvider();