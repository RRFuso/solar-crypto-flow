import { useState, useEffect, useMemo } from 'react';
import { CMEGap, GapAnalysis, GapMonitorData } from '@/types/cmeGaps';
import { useQuery } from '@tanstack/react-query';

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

// Fetch historical klines from Binance
async function fetchBinanceKlines(limit: number = 120): Promise<BinanceKline[]> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=${limit}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch Binance data');
    
    const data = await response.json();
    return data.map((kline: any[]) => ({
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: kline[6],
    }));
  } catch (error) {
    console.error('Error fetching Binance klines:', error);
    return [];
  }
}

// Detect gaps from kline data
function detectGapsFromKlines(klines: BinanceKline[]): CMEGap[] {
  const gaps: CMEGap[] = [];
  
  for (let i = 1; i < klines.length; i++) {
    const current = klines[i];
    const previous = klines[i - 1];
    
    const currentDate = new Date(current.openTime);
    const previousDate = new Date(previous.closeTime);
    
    // Check if this is a weekend gap (Friday to Sunday/Monday)
    const prevDay = previousDate.getUTCDay(); // 0 = Sunday, 5 = Friday
    const currDay = currentDate.getUTCDay();
    
    // Friday close to Monday open (skip Saturday/Sunday)
    const isWeekendGap = prevDay === 5 && (currDay === 0 || currDay === 1);
    
    if (!isWeekendGap) continue;
    
    const fridayClose = parseFloat(previous.close);
    const sundayOpen = parseFloat(current.open);
    const gapSize = Math.abs(sundayOpen - fridayClose);
    const gapPercent = (gapSize / fridayClose) * 100;
    
    // Only consider gaps larger than 0.5%
    if (gapPercent < 0.5) continue;
    
    const gapLow = Math.min(fridayClose, sundayOpen);
    const gapHigh = Math.max(fridayClose, sundayOpen);
    const type = sundayOpen > fridayClose ? 'bullish' : 'bearish';
    
    gaps.push({
      id: `gap-${previousDate.toISOString().split('T')[0]}`,
      type,
      gapLow,
      gapHigh,
      createdAt: previousDate,
      fridayClose,
      sundayOpen,
      filled: false,
      fillPercentage: 0,
    });
  }
  
  return gaps;
}

// Check if gaps have been filled
function checkGapFillStatus(gaps: CMEGap[], klines: BinanceKline[], currentPrice: number): CMEGap[] {
  return gaps.map(gap => {
    // Find all klines after the gap was created
    const gapTimestamp = gap.createdAt.getTime();
    const subsequentKlines = klines.filter(k => k.openTime > gapTimestamp);
    
    let filled = false;
    let fillPercentage = 0;
    
    // For bullish gaps (price jumped up), we need price to come back down to fill
    // For bearish gaps (price dropped), we need price to come back up to fill
    if (gap.type === 'bullish') {
      // Check if price ever went back down to gapLow
      const lowestAfterGap = Math.min(
        ...subsequentKlines.map(k => parseFloat(k.low)),
        currentPrice
      );
      
      if (lowestAfterGap <= gap.gapLow) {
        filled = true;
        fillPercentage = 100;
      } else {
        // Calculate partial fill
        const gapSize = gap.gapHigh - gap.gapLow;
        const filledAmount = gap.gapHigh - lowestAfterGap;
        fillPercentage = Math.max(0, Math.min(100, (filledAmount / gapSize) * 100));
      }
    } else {
      // Bearish gap - check if price went back up to gapHigh
      const highestAfterGap = Math.max(
        ...subsequentKlines.map(k => parseFloat(k.high)),
        currentPrice
      );
      
      if (highestAfterGap >= gap.gapHigh) {
        filled = true;
        fillPercentage = 100;
      } else {
        const gapSize = gap.gapHigh - gap.gapLow;
        const filledAmount = highestAfterGap - gap.gapLow;
        fillPercentage = Math.max(0, Math.min(100, (filledAmount / gapSize) * 100));
      }
    }
    
    return { ...gap, filled, fillPercentage };
  });
}

function calculateFillProbability(gap: CMEGap, currentPrice: number): number {
  const now = new Date();
  const daysOpen = Math.floor((now.getTime() - gap.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const gapSize = Math.abs(gap.gapHigh - gap.gapLow);
  const gapMidpoint = (gap.gapHigh + gap.gapLow) / 2;
  const distanceFromPrice = Math.abs(currentPrice - gapMidpoint);
  const distancePercent = (distanceFromPrice / currentPrice) * 100;

  // Base probability (historical CME gap fill rate is ~77%)
  let probability = 77;

  // Time factor
  if (daysOpen < 7) probability += 15;
  else if (daysOpen < 30) probability += 10;
  else if (daysOpen < 90) probability += 5;
  else if (daysOpen > 180) probability -= 15;

  // Distance factor
  if (distancePercent < 5) probability += 20;
  else if (distancePercent < 10) probability += 10;
  else if (distancePercent > 30) probability -= 10;

  // Size factor
  const gapSizePercent = (gapSize / gapMidpoint) * 100;
  if (gapSizePercent < 2) probability += 10;
  else if (gapSizePercent > 10) probability -= 10;

  // Fill percentage bonus
  probability += gap.fillPercentage * 0.1;

  return Math.min(95, Math.max(5, Math.round(probability)));
}

function analyzeGap(gap: CMEGap, currentPrice: number): GapAnalysis {
  const now = new Date();
  const daysOpen = Math.floor((now.getTime() - gap.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const gapMidpoint = (gap.gapHigh + gap.gapLow) / 2;
  const gapSize = Math.abs(gap.gapHigh - gap.gapLow);
  
  let distanceToGap: number;
  if (currentPrice > gap.gapHigh) {
    distanceToGap = currentPrice - gap.gapHigh;
  } else if (currentPrice < gap.gapLow) {
    distanceToGap = gap.gapLow - currentPrice;
  } else {
    distanceToGap = 0;
  }
  
  const distancePercent = (distanceToGap / currentPrice) * 100 * (currentPrice > gapMidpoint ? -1 : 1);
  const gapSizePercent = (gapSize / gapMidpoint) * 100;

  return {
    gap,
    currentPrice,
    distancePercent,
    fillProbability: gap.filled ? 100 : calculateFillProbability(gap, currentPrice),
    daysOpen,
    gapSizePercent,
  };
}

export function useCMEGapsLive(currentBTCPrice: number | null) {
  const { data: klines, isLoading: klinesLoading, refetch } = useQuery({
    queryKey: ['binance-klines-cme'],
    queryFn: () => fetchBinanceKlines(120),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });

  const gapMonitorData = useMemo<GapMonitorData | null>(() => {
    if (!klines || klines.length === 0) return null;
    
    const price = currentBTCPrice || parseFloat(klines[klines.length - 1]?.close || '100000');
    
    // Detect gaps from historical data
    const detectedGaps = detectGapsFromKlines(klines);
    
    // Check fill status
    const gapsWithFillStatus = checkGapFillStatus(detectedGaps, klines, price);
    
    // Analyze each gap
    const analyzedGaps = gapsWithFillStatus
      .map(gap => analyzeGap(gap, price))
      .sort((a, b) => b.fillProbability - a.fillProbability);

    const filledGaps = gapsWithFillStatus.filter(g => g.filled);
    const openGaps = gapsWithFillStatus.filter(g => !g.filled);

    // Calculate average fill time from filled gaps
    let averageFillTime = 14; // Default
    if (filledGaps.length > 0) {
      const totalDays = filledGaps.reduce((sum, gap) => {
        const daysToFill = Math.floor(
          (new Date().getTime() - gap.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + daysToFill;
      }, 0);
      averageFillTime = Math.round(totalDays / filledGaps.length);
    }

    return {
      gaps: analyzedGaps,
      lastUpdate: new Date(),
      totalOpenGaps: openGaps.length,
      totalFilledGaps: filledGaps.length,
      averageFillTime,
    };
  }, [klines, currentBTCPrice]);

  return {
    data: gapMonitorData,
    isLoading: klinesLoading,
    dataSource: 'live' as 'live' | 'historical',
    refetch,
  };
}

// Default export maintains compatibility with existing useCMEGaps
export default useCMEGapsLive;
