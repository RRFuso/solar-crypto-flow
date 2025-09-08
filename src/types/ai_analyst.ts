export interface EntrySignal {
  asset: string;
  suggestedEntryPrice: number;
  justification: string;
  confidence: number;
}

export interface ExitSignal {
  asset: string;
  suggestedExitPrice: number;
  justification: string;
}

export interface AIAnalysisResult {
  entrySignals: EntrySignal[];
  exitSignals: ExitSignal[];
  marketSummary: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}
