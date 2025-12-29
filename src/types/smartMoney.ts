// Tipos para o sistema de Smart Money Tracking

export interface SmartMoneyWallet {
  id: string;
  wallet_address: string;
  label: string;
  wallet_type: 'whale' | 'institution' | 'exchange' | 'dex' | 'fund';
  chain: string;
  priority: number;
  historical_impact_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SmartMoneyTransaction {
  id: string;
  wallet_id: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  token_symbol: string;
  value_usd: number;
  direction: 'inflow' | 'outflow';
  chain: string;
  block_number: number;
  timestamp: string;
  created_at: string;
}

export interface SmartMoneyFlowCache {
  id: string;
  token_symbol: string;
  timeframe: string;
  net_flow_usd: number;
  total_inflow_usd: number;
  total_outflow_usd: number;
  whale_tx_count: number;
  dominant_direction: 'bullish' | 'bearish' | 'neutral';
  flow_intensity: number;
  ema_flow: number;
  last_updated: string;
  expires_at: string;
}

export interface FlowParticleConfig {
  direction: 1 | -1 | 0;
  color: string;
  speed: number;
  intensity?: number;
  isRealData?: boolean;
}

export interface WalletActivity {
  wallet: SmartMoneyWallet;
  recentTransactions: SmartMoneyTransaction[];
  netFlowUSD: number;
  activityLevel: 'high' | 'medium' | 'low';
}

// Constantes de cores para visualização
export const SMART_MONEY_COLORS = {
  bullish: '#22c55e', // green-500 - dinheiro saindo de exchanges
  bearish: '#ef4444', // red-500 - dinheiro entrando em exchanges
  neutral: '#facc15', // yellow-400 - fluxo equilibrado
  whale: '#8b5cf6', // violet-500 - atividade de baleias
  institution: '#3b82f6', // blue-500 - instituições
} as const;

// Thresholds para classificação
export const FLOW_THRESHOLDS = {
  significant: 50000, // $50k+ para considerar significativo
  whale: 1000000, // $1M+ para classificar como whale
  massive: 10000000, // $10M+ para fluxo massivo
} as const;
