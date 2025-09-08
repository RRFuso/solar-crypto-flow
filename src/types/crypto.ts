
export interface CryptoData {
  id: string;
  name: string;
  symbol?: string;
  performance: number;
  price?: number;  // Changed from string to number
  volume?: number;
  volume24h?: number;
  avgVolume24h?: number; // Volume médio histórico
  volatility?: number; // Volatilidade calculada
  supportLevel?: number; // Nível de suporte calculado
  resistanceLevel?: number; // Nível de resistência calculado
  marketCap?: number;
  change24h?: number;
  change7d?: number;
  change30d?: number;
  change90d?: number;
  change1y?: number;
  ath?: number;
  atl?: number;
  rsi?: number;
  rsi4h?: number;
  macd?: {
    value: number;
    signal: number;
    histogram: number;
  };
  ema12?: number;
  ema26?: number;
  aboveMA14?: boolean;
  priceChange1h?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  volumeChange24h?: number;
  high24h?: number;  // Changed from string to number
  low24h?: number;   // Changed from string to number
  // Compatibility properties for existing code
  priceChangePercent?: string;
  highPrice?: string;
  lowPrice?: string;
  category?: string;
  description?: string;
  website?: string;
  twitter?: string;
  reddit?: string;
  telegram?: string;
  discord?: string;
  whitepaper?: string;
  github?: string;
  blockExplorer?: string;
  tags?: string[];
  totalSupply?: number;
  maxSupply?: number;
  circulatingSupply?: number;
  launchDate?: string;
  genesisDate?: string;
  hashingAlgorithm?: string;
  proofType?: string;
  blockTime?: number;
  blockReward?: number;
  blockHeight?: number;
  lastBlockTime?: number;
  nextHalvingDate?: string;
  nextHalvingBlockHeight?: number;
  nextDifficultyAdjustmentDate?: string;
  nextDifficultyAdjustmentBlockHeight?: number;
  difficulty?: number;
  hashRate?: number;
  inflationRate?: number;
  roi?: number;
  communityScore?: number;
  developerScore?: number;
  liquidityScore?: number;
  publicInterestScore?: number;
  sentimentVotesUpPercentage?: number;
  sentimentVotesDownPercentage?: number;
  icoPrice?: number;
  fundraisingGoal?: number;
  acceptedCurrencies?: string[];
  teamDescription?: string;
  advisorDescription?: string;
  investorDescription?: string;
  tokenDistributionDescription?: string;
  tokenUsageDescription?: string;
  tokenEconomicsDescription?: string;
  tokenSaleDescription?: string;
  tokenAllocationDescription?: string;
  tokenReleaseScheduleDescription?: string;
  tokenVestingScheduleDescription?: string;
  tokenBurnMechanismDescription?: string;
  tokenGovernanceDescription?: string;
  tokenUtilityDescription?: string;
  tokenValueAccrualDescription?: string;
  tokenIncentivesDescription?: string;
  tokenSecurityDescription?: string;
  tokenScalabilityDescription?: string;
  tokenPrivacyDescription?: string;
  tokenInteroperabilityDescription?: string;
  tokenSustainabilityDescription?: string;
  tokenDecentralizationDescription?:.ts
  tokenCommunityGovernanceDescription?: string;
  tokenTreasuryManagementDescription?: string;
  tokenRiskManagementDescription?: string;
  tokenComplianceDescription?: string;
  tokenLegalDescription?: string;
  tokenRegulatoryDescription?: string;
  tokenTaxationDescription?: string;
  tokenInsuranceDescription?: string;
  tokenAuditsDescription?: string;
  tokenBugBountyDescription?: string;
  tokenSmartContractDescription?: string;
  tokenOracleDescription?: string;
  tokenDataFeedsDescription?: string;
  tokenStorageDescription?: string;
  tokenComputeDescription?: string;
  tokenBandwidthDescription?: string;
  tokenIdentityDescription?: string;
  tokenReputationDescription?: string;
  tokenCreditDescription?: string;
  tokenPredictionMarketsDescription?: string;
  tokenDerivativesDescription?: string;
  tokenStablecoinsDescription?: string;
  tokenSyntheticAssetsDescription?: string;
  tokenWrappedAssetsDescription?: string;
  tokenIndexFundsDescription?: string;
  tokenEtfsDescription?: string;
  tokenRealWorldAssetsDescription?: string;
  tokenNftDescription?: string;
  tokenMetaverseDescription?: string;
  tokenGamingDescription?: string;
  tokenSocialMediaDescription?: string;
  tokenContentCreationDescription?: string;
  tokenAdvertisingDescription?: string;
  tokenDataMonetizationDescription?: string;
  tokenAiDescription?: string;
  tokenIotDescription?: string;
  tokenSupplyChainDescription?: string;
  tokenHealthcareDescription?: string;
  tokenEducationDescription?: string;
  tokenEnergyDescription?: string;
  tokenRealEstateDescription?: string;
  tokenFinanceDescription?: string;
  tokenLawDescription?: string;
  tokenGovernmentDescription?: string;
  tokenCharityDescription?: string;
  tokenScienceDescription?: string;
  tokenArtDescription?: string;
  tokenMusicDescription?: string;
  tokenSportsDescription?: string;
  tokenTravelDescription?: string;
  tokenFoodDescription?: string;
  tokenFashionDescription?: string;
  tokenMediaDescription?: string;
  tokenEntertainmentDescription?: string;
  hasBullishDivergence?: boolean;
  hasBearishDivergence?: boolean;
}

export interface FlowData {
  id?: string;  // Make id optional to fix typescript errors
  from: string;
  to: string;
  value: number;
  percentage: number;
  volume?: number;
  outflow?: number;
  price?: number;
  previousPrice?: number;
  gasFees?: number;
  dexActivity?: number;
  marketCap?: number;
  category?: string;
  name?: string;
  change?: number;
  fromCategory?: string;
  toCategory?: string;
  categories?: string[];
}

export interface IndexData {
  id: string;
  name: string;
  value: number;
  change: number;
  color: string;
  marketCap?: number;
}

export interface FearGreedIndex {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

export interface LongShortRatio {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: number;
}
