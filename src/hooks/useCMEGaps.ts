import { useState, useEffect, useMemo, useCallback } from 'react';
import { CMEGap, GapAnalysis, GapMonitorData } from '@/types/cmeGaps';
import { detectCMEGaps } from '@/services/cmeGapDetector';

// Fallback historical gaps (well-documented in crypto community)
const HISTORICAL_GAPS: CMEGap[] = [
  {
    id: 'gap-2024-12-01',
    type: 'bearish',
    gapLow: 95200,
    gapHigh: 96800,
    createdAt: new Date('2024-12-01'),
    fridayClose: 96800,
    sundayOpen: 95200,
    filled: false,
    fillPercentage: 0,
  },
  {
    id: 'gap-2024-11-24',
    type: 'bullish',
    gapLow: 97500,
    gapHigh: 99100,
    createdAt: new Date('2024-11-24'),
    fridayClose: 97500,
    sundayOpen: 99100,
    filled: false,
    fillPercentage: 0,
  },
  {
    id: 'gap-2024-11-10',
    type: 'bullish',
    gapLow: 76800,
    gapHigh: 81200,
    createdAt: new Date('2024-11-10'),
    fridayClose: 76800,
    sundayOpen: 81200,
    filled: false,
    fillPercentage: 0,
  },
];

// Calculate fill probability based on multiple factors
function calculateFillProbability(gap: CMEGap, currentPrice: number): number {
  const now = new Date();
  const daysOpen = Math.floor((now.getTime() - gap.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const gapSize = Math.abs(gap.gapHigh - gap.gapLow);
  const gapMidpoint = (gap.gapHigh + gap.gapLow) / 2;
  const distanceFromPrice = Math.abs(currentPrice - gapMidpoint);
  const distancePercent = (distanceFromPrice / currentPrice) * 100;

  // Base probability from historical fill rate (~77% of CME gaps fill)
  let probability = 77;

  // Adjust for time (newer gaps have higher probability)
  if (daysOpen < 7) probability += 15;
  else if (daysOpen < 30) probability += 10;
  else if (daysOpen < 90) probability += 5;
  else if (daysOpen > 180) probability -= 15;
  else if (daysOpen > 365) probability -= 25;

  // Adjust for distance from current price
  if (distancePercent < 5) probability += 20;
  else if (distancePercent < 10) probability += 10;
  else if (distancePercent < 20) probability += 5;
  else if (distancePercent > 30) probability -= 10;
  else if (distancePercent > 50) probability -= 25;

  // Adjust for gap size (smaller gaps fill faster)
  const gapSizePercent = (gapSize / gapMidpoint) * 100;
  if (gapSizePercent < 2) probability += 10;
  else if (gapSizePercent < 5) probability += 5;
  else if (gapSizePercent > 10) probability -= 10;

  // Adjust for gap type relative to price direction
  if (gap.type === 'bearish' && currentPrice > gap.gapHigh) {
    probability += 5;
  } else if (gap.type === 'bullish' && currentPrice < gap.gapLow) {
    probability += 5;
  }

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

// Merge detected gaps with historical fallback, removing duplicates
function mergeGaps(detected: CMEGap[], historical: CMEGap[]): CMEGap[] {
  const gapMap = new Map<string, CMEGap>();
  
  // Add historical gaps first
  historical.forEach(gap => {
    const key = `${gap.gapLow}-${gap.gapHigh}`;
    gapMap.set(key, gap);
  });
  
  // Override with detected gaps (more accurate)
  detected.forEach(gap => {
    const key = `${Math.round(gap.gapLow / 100) * 100}-${Math.round(gap.gapHigh / 100) * 100}`;
    // Check for similar existing gap (within 2% range)
    let found = false;
    gapMap.forEach((existing, existingKey) => {
      const existingMid = (existing.gapLow + existing.gapHigh) / 2;
      const newMid = (gap.gapLow + gap.gapHigh) / 2;
      if (Math.abs(existingMid - newMid) / existingMid < 0.02) {
        // Replace with more recent data
        gapMap.delete(existingKey);
        gapMap.set(key, gap);
        found = true;
      }
    });
    if (!found) {
      gapMap.set(key, gap);
    }
  });
  
  return Array.from(gapMap.values());
}

export function useCMEGaps(currentBTCPrice: number | null) {
  const [gaps, setGaps] = useState<CMEGap[]>(HISTORICAL_GAPS);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'live' | 'historical'>('historical');

  // Fetch real-time gap data
  const fetchRealTimeGaps = useCallback(async (price: number) => {
    setIsLoading(true);
    try {
      const detectedGaps = await detectCMEGaps(price);
      
      if (detectedGaps.length > 0) {
        const mergedGaps = mergeGaps(detectedGaps, HISTORICAL_GAPS);
        setGaps(mergedGaps);
        setDataSource('live');
      } else {
        // Use historical data as fallback
        setGaps(HISTORICAL_GAPS);
        setDataSource('historical');
      }
    } catch (error) {
      console.error('Error fetching real-time gaps:', error);
      setGaps(HISTORICAL_GAPS);
      setDataSource('historical');
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  }, []);

  // Initial fetch and periodic updates
  useEffect(() => {
    if (!currentBTCPrice) return;

    // Only fetch once on mount or when price significantly changes
    let isMounted = true;
    
    const doFetch = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        const detectedGaps = await detectCMEGaps(currentBTCPrice);
        
        if (!isMounted) return;
        
        if (detectedGaps.length > 0) {
          const mergedGaps = mergeGaps(detectedGaps, HISTORICAL_GAPS);
          setGaps(mergedGaps);
          setDataSource('live');
        } else {
          setGaps(HISTORICAL_GAPS);
          setDataSource('historical');
        }
      } catch (error) {
        console.error('Error fetching real-time gaps:', error);
        if (isMounted) {
          setGaps(HISTORICAL_GAPS);
          setDataSource('historical');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setLastUpdate(new Date());
        }
      }
    };

    doFetch();
    
    // Update every 5 minutes
    const interval = setInterval(doFetch, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentBTCPrice]);

  // Update gap fill status based on current price
  useEffect(() => {
    if (!currentBTCPrice) return;

    setGaps(prevGaps => 
      prevGaps.map(gap => {
        if (gap.filled) return gap;

        let fillPercentage = gap.fillPercentage;
        if (gap.type === 'bearish' && currentBTCPrice < gap.gapHigh) {
          const filled = gap.gapHigh - Math.max(currentBTCPrice, gap.gapLow);
          fillPercentage = Math.max(gap.fillPercentage, (filled / (gap.gapHigh - gap.gapLow)) * 100);
        } else if (gap.type === 'bullish' && currentBTCPrice > gap.gapLow) {
          const filled = Math.min(currentBTCPrice, gap.gapHigh) - gap.gapLow;
          fillPercentage = Math.max(gap.fillPercentage, (filled / (gap.gapHigh - gap.gapLow)) * 100);
        }

        const isFilled = fillPercentage >= 100;

        return {
          ...gap,
          fillPercentage: Math.min(100, fillPercentage),
          filled: isFilled,
          filledAt: isFilled && !gap.filled ? new Date() : gap.filledAt,
        };
      })
    );
  }, [currentBTCPrice]);

  const gapMonitorData = useMemo<GapMonitorData | null>(() => {
    if (!currentBTCPrice) return null;

    const analyzedGaps = gaps
      .map(gap => analyzeGap(gap, currentBTCPrice))
      .sort((a, b) => b.fillProbability - a.fillProbability);

    const filledGaps = gaps.filter(g => g.filled);
    const openGaps = gaps.filter(g => !g.filled);
    
    const fillTimes = filledGaps
      .filter(g => g.filledAt)
      .map(g => Math.floor((g.filledAt!.getTime() - g.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    const averageFillTime = fillTimes.length > 0 
      ? fillTimes.reduce((a, b) => a + b, 0) / fillTimes.length 
      : 0;

    return {
      gaps: analyzedGaps,
      lastUpdate,
      totalOpenGaps: openGaps.length,
      totalFilledGaps: filledGaps.length,
      averageFillTime,
    };
  }, [gaps, currentBTCPrice, lastUpdate]);

  return {
    data: gapMonitorData,
    isLoading,
    dataSource,
    refetch: () => currentBTCPrice && fetchRealTimeGaps(currentBTCPrice),
  };
}
