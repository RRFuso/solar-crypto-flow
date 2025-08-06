
export interface OnChainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string; // Em Wei, precisa ser convertido
  timeStamp: string;
  contractAddress: string;
  tokenSymbol: string;
}

export interface WhaleTransaction extends OnChainTransaction {
  isWhale: boolean;
}

export interface ExchangeFlow {
  symbol: string;
  timestamp: number;
  netFlow: number; // Positivo para inflow, negativo para outflow
  inflow: number;
  outflow: number;
}

export interface HolderDistribution {
  symbol: string;
  top10Percentage: number;
  top50Percentage: number;
  top100Percentage: number;
}

export interface OnChainMetrics {
  symbol: string;
  exchangeFlow: ExchangeFlow;
  whaleTransactions: WhaleTransaction[];
  holderDistribution: HolderDistribution;
  activeAddresses?: number;
  newWallets?: number;
  whaleMovements?: number;
  dormantWakeups?: number;
}
