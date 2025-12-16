export interface CMEGap {
  id: string;
  type: 'bullish' | 'bearish';
  gapLow: number;
  gapHigh: number;
  createdAt: Date;
  fridayClose: number;
  sundayOpen: number;
  filled: boolean;
  filledAt?: Date;
  fillPercentage: number; // How much of the gap has been filled (0-100)
}

export interface GapAnalysis {
  gap: CMEGap;
  currentPrice: number;
  distancePercent: number;
  fillProbability: number;
  daysOpen: number;
  gapSizePercent: number;
}

export interface GapMonitorData {
  gaps: GapAnalysis[];
  lastUpdate: Date;
  totalOpenGaps: number;
  totalFilledGaps: number;
  averageFillTime: number; // in days
}
