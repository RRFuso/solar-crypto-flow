import { CMEGap } from '@/types/cmeGaps';

// CME Bitcoin Futures trading hours (Chicago time):
// Sunday 5:00 PM - Friday 4:00 PM CT (with a 1-hour break daily 4:00-5:00 PM CT)
// Weekend gap = Friday 4PM close to Sunday 5PM open

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

interface WeekendPriceData {
  fridayClosePrice: number;
  fridayCloseTime: Date;
  sundayOpenPrice: number;
  sundayOpenTime: Date;
}

// Fetch historical klines from Binance
async function fetchBinanceKlines(
  symbol: string = 'BTCUSDT',
  interval: string = '1h',
  limit: number = 500
): Promise<BinanceKline[]> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
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

// Find Friday close and Sunday open prices from kline data
function findWeekendPrices(klines: BinanceKline[]): WeekendPriceData[] {
  const weekendData: WeekendPriceData[] = [];
  
  for (let i = 0; i < klines.length - 1; i++) {
    const currentTime = new Date(klines[i].closeTime);
    const currentDay = currentTime.getUTCDay();
    const currentHour = currentTime.getUTCHours();
    
    // CME closes Friday at 4PM CT (21:00 UTC in winter, 20:00 UTC in summer)
    // We look for Friday around 21:00-22:00 UTC
    if (currentDay === 5 && currentHour >= 20 && currentHour <= 22) {
      const fridayClose = parseFloat(klines[i].close);
      const fridayCloseTime = new Date(klines[i].closeTime);
      
      // Find Sunday open (around 22:00-23:00 UTC - 5PM CT)
      for (let j = i + 1; j < klines.length && j < i + 72; j++) {
        const nextTime = new Date(klines[j].openTime);
        const nextDay = nextTime.getUTCDay();
        const nextHour = nextTime.getUTCHours();
        
        if (nextDay === 0 && nextHour >= 21 && nextHour <= 23) {
          const sundayOpen = parseFloat(klines[j].open);
          const sundayOpenTime = new Date(klines[j].openTime);
          
          weekendData.push({
            fridayClosePrice: fridayClose,
            fridayCloseTime,
            sundayOpenPrice: sundayOpen,
            sundayOpenTime,
          });
          break;
        }
      }
    }
  }
  
  return weekendData;
}

// Detect gaps from weekend price movements
function detectGapsFromWeekendData(weekendData: WeekendPriceData[]): CMEGap[] {
  const gaps: CMEGap[] = [];
  const minGapPercent = 0.5; // Minimum 0.5% gap to be significant
  
  weekendData.forEach((weekend, index) => {
    const priceDiff = weekend.sundayOpenPrice - weekend.fridayClosePrice;
    const percentDiff = Math.abs(priceDiff / weekend.fridayClosePrice) * 100;
    
    // Only consider significant gaps (> 0.5%)
    if (percentDiff >= minGapPercent) {
      const isBullish = priceDiff > 0;
      
      const gap: CMEGap = {
        id: `gap-detected-${weekend.fridayCloseTime.toISOString().split('T')[0]}`,
        type: isBullish ? 'bullish' : 'bearish',
        gapLow: isBullish ? weekend.fridayClosePrice : weekend.sundayOpenPrice,
        gapHigh: isBullish ? weekend.sundayOpenPrice : weekend.fridayClosePrice,
        createdAt: weekend.sundayOpenTime,
        fridayClose: weekend.fridayClosePrice,
        sundayOpen: weekend.sundayOpenPrice,
        filled: false,
        fillPercentage: 0,
      };
      
      gaps.push(gap);
    }
  });
  
  return gaps;
}

// Check if a gap has been filled based on price history
function checkGapFillStatus(
  gap: CMEGap,
  klines: BinanceKline[],
  currentPrice: number
): CMEGap {
  const gapCreationTime = gap.createdAt.getTime();
  
  // Filter klines after gap creation
  const relevantKlines = klines.filter(k => k.openTime > gapCreationTime);
  
  let maxFillPercent = gap.fillPercentage;
  let filled = gap.filled;
  let filledAt = gap.filledAt;
  
  for (const kline of relevantKlines) {
    const high = parseFloat(kline.high);
    const low = parseFloat(kline.low);
    const gapSize = gap.gapHigh - gap.gapLow;
    
    if (gap.type === 'bearish') {
      // Bearish gap: price needs to rise into the gap
      if (low <= gap.gapHigh && high >= gap.gapLow) {
        const fillAmount = Math.min(high, gap.gapHigh) - gap.gapLow;
        const fillPercent = (fillAmount / gapSize) * 100;
        
        if (fillPercent > maxFillPercent) {
          maxFillPercent = fillPercent;
          
          if (fillPercent >= 100 && !filled) {
            filled = true;
            filledAt = new Date(kline.closeTime);
          }
        }
      }
    } else {
      // Bullish gap: price needs to fall into the gap
      if (high >= gap.gapLow && low <= gap.gapHigh) {
        const fillAmount = gap.gapHigh - Math.max(low, gap.gapLow);
        const fillPercent = (fillAmount / gapSize) * 100;
        
        if (fillPercent > maxFillPercent) {
          maxFillPercent = fillPercent;
          
          if (fillPercent >= 100 && !filled) {
            filled = true;
            filledAt = new Date(kline.closeTime);
          }
        }
      }
    }
  }
  
  // Also check current price
  if (!filled) {
    const gapSize = gap.gapHigh - gap.gapLow;
    
    if (gap.type === 'bearish' && currentPrice >= gap.gapLow && currentPrice <= gap.gapHigh) {
      const fillAmount = currentPrice - gap.gapLow;
      const fillPercent = (fillAmount / gapSize) * 100;
      maxFillPercent = Math.max(maxFillPercent, fillPercent);
    } else if (gap.type === 'bullish' && currentPrice <= gap.gapHigh && currentPrice >= gap.gapLow) {
      const fillAmount = gap.gapHigh - currentPrice;
      const fillPercent = (fillAmount / gapSize) * 100;
      maxFillPercent = Math.max(maxFillPercent, fillPercent);
    }
  }
  
  return {
    ...gap,
    filled,
    filledAt,
    fillPercentage: Math.min(100, Math.round(maxFillPercent)),
  };
}

// Main function to detect and analyze CME gaps
export async function detectCMEGaps(currentPrice: number): Promise<CMEGap[]> {
  try {
    // Fetch last 6 weeks of hourly data (reduced from 3 months to improve performance)
    const klines = await fetchBinanceKlines('BTCUSDT', '1h', 1008);
    
    if (klines.length === 0) {
      console.warn('No kline data available, returning empty gaps');
      return [];
    }
    
    // Find weekend price movements
    const weekendData = findWeekendPrices(klines);
    
    // Detect gaps from weekend data
    const detectedGaps = detectGapsFromWeekendData(weekendData);
    
    // Check fill status for each gap
    const analyzedGaps = detectedGaps.map(gap => 
      checkGapFillStatus(gap, klines, currentPrice)
    );
    
    // Sort by date (newest first)
    return analyzedGaps.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  } catch (error) {
    console.error('Error detecting CME gaps:', error);
    return [];
  }
}

// Export utility for manual gap entry
export function createManualGap(
  fridayClose: number,
  sundayOpen: number,
  date: Date
): CMEGap {
  const isBullish = sundayOpen > fridayClose;
  
  return {
    id: `gap-manual-${date.toISOString().split('T')[0]}`,
    type: isBullish ? 'bullish' : 'bearish',
    gapLow: isBullish ? fridayClose : sundayOpen,
    gapHigh: isBullish ? sundayOpen : fridayClose,
    createdAt: date,
    fridayClose,
    sundayOpen,
    filled: false,
    fillPercentage: 0,
  };
}
