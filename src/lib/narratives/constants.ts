
import { NarrativeData, RepresentativeToken } from '@/types/narratives';

// Define representative tokens with their logo URLs - use consistent method
const getRepresentativeTokens = (symbols: string[]): RepresentativeToken[] => {
  return symbols.map(symbol => ({
    symbol,
    name: symbol,
    logoUrl: `https://s2.coinmarketcap.com/static/img/coins/64x64/1.png` // Default that will be replaced by context
  }));
};

// Define the main crypto narratives
export const NARRATIVES: NarrativeData[] = [
  {
    id: 'ai',
    name: 'AI',
    marketCap: 15200000000,
    volume24h: 980000000,
    dominance: 1.2,
    change24h: 2.3, // Reduced performance
    change7d: 5.7,  // Reduced performance
    tokens: ['FET', 'OCEAN', 'AGIX', 'RLC', 'NMR', 'GRT', 'RNDR'],
    representativeTokens: getRepresentativeTokens(['FET', 'OCEAN', 'AGIX']),
    color: '#FF5733'
  },
  {
    id: 'defi',
    name: 'DeFi',
    marketCap: 42500000000,
    volume24h: 3200000000,
    dominance: 3.4,
    change24h: -2.1,
    change7d: 4.5,
    tokens: ['UNI', 'AAVE', 'MKR', 'COMP', 'SNX', 'CAKE', 'CRV', 'SUSHI', 'BAL'],
    representativeTokens: getRepresentativeTokens(['UNI', 'AAVE', 'MKR']),
    color: '#6A0DAD'
  },
  {
    id: 'defi-ai',
    name: 'DeFi AI',
    marketCap: 8900000000,
    volume24h: 720000000,
    dominance: 0.7,
    change24h: 3.8, // Reduced performance
    change7d: 9.2,  // Reduced performance
    tokens: ['INJ', 'TRB', 'RNDR', 'LPT', 'ICP', 'NEAR', 'QNT'],
    representativeTokens: getRepresentativeTokens(['INJ', 'TRB', 'RNDR']),
    color: '#3498DB'
  },
  {
    id: 'meme',
    name: 'Meme',
    marketCap: 29800000000,
    volume24h: 4100000000,
    dominance: 2.4,
    change24h: 1.9, // Reduced performance
    change7d: -5.3,
    tokens: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'WIF', 'BONK', 'MEME'],
    representativeTokens: getRepresentativeTokens(['DOGE', 'SHIB', 'PEPE']),
    color: '#F1C40F'
  },
  {
    id: 'rwa',
    name: 'RWA',
    marketCap: 5100000000,
    volume24h: 310000000,
    dominance: 0.4,
    change24h: 1.2,
    change7d: 3.8,
    tokens: ['RWA', 'RNDR', 'LDO', 'PAXG', 'MNT', 'FXS', 'XAUt'],
    representativeTokens: getRepresentativeTokens(['PAXG', 'MNT', 'FXS']),
    color: '#27AE60'
  },
  {
    id: 'l1',
    name: 'Layer 1',
    marketCap: 220000000000,
    volume24h: 12000000000,
    dominance: 17.6,
    change24h: 4.5, // Improved performance to reflect current market
    change7d: 7.1, // Improved performance to reflect current market
    tokens: ['ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'FTM', 'ONE'],
    representativeTokens: getRepresentativeTokens(['ETH', 'SOL', 'ADA']),
    color: '#E74C3C'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    marketCap: 18500000000,
    volume24h: 1500000000,
    dominance: 1.5,
    change24h: 3.2,
    change7d: 8.9,
    tokens: ['SAND', 'MANA', 'AXS', 'ILV', 'ENJ', 'GALA', 'IMX', 'MAGIC', 'APE'],
    representativeTokens: getRepresentativeTokens(['AXS', 'MANA', 'SAND']),
    color: '#16A085'
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    marketCap: 1700000000000,
    volume24h: 25000000000,
    dominance: 52.5,
    change24h: 2.2, // Moderate positive change
    change7d: 2.9,
    tokens: ['BTC'],
    representativeTokens: getRepresentativeTokens(['BTC']),
    color: '#F7931A'
  }
];
