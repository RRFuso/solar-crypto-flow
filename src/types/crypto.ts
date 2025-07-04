export interface HistoricalDataPoint {
  date: string;
  low: number;
  high: number;
  close: number;
  volume?: number;
}