
export interface CryptoMention {
  symbol: string;
  name: string;
  count: number;
  trend: number;
  sentiment: number;
}

export interface SymbolMention {
  symbol: string;
  count: number;
}

export interface MentionTimeSeries {
  timestamp: string;
  symbols: SymbolMention[];
}

export interface SocialMentionsData {
  topMentions: CryptoMention[];
  mentionsOverTime: MentionTimeSeries[];
}
