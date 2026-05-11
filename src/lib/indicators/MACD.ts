export interface Crossover {
  type: 'bullish' | 'bearish';
  index: number;
  strength: number;
}

export interface Divergence {
  type: 'bullish' | 'bearish';
  index: number;
  strength: number;
}

interface Pivot {
  index: number;
  value: number;
}

interface Pivots {
  tops: Pivot[];
  bottoms: Pivot[];
}

export interface MACDResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
  crosses: Crossover[];
  divergences: Divergence[];
  signal: 'buy' | 'sell' | 'neutral';
  confidence: number;
  factors: string[];
}

export class MACD {
  /**
   * Calcula MACD com detecção automática de divergências.
   */
  static calculate(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): MACDResult {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);

    // Alinhar arrays (fastEMA é mais longo)
    const offset = fastEMA.length - slowEMA.length;
    const fastAligned = fastEMA.slice(offset);
    const macdLine = fastAligned.map((fast, i) => fast - slowEMA[i]);

    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    const macdAligned = macdLine.slice(macdLine.length - signalLine.length);
    const histogram = macdAligned.map((m, i) => m - signalLine[i]);

    const crosses = this.detectCrossovers(macdAligned, signalLine);
    const pricesAligned = prices.slice(prices.length - histogram.length);
    const divergences = this.detectDivergences(pricesAligned, histogram);

    const latestCross = crosses[crosses.length - 1];
    const latestDivergence = divergences[divergences.length - 1];

    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let confidence = 0;
    const factors: string[] = [];

    if (latestCross && latestCross.index > macdAligned.length - 4) {
      if (latestCross.type === 'bullish') {
        signal = 'buy';
        confidence = 0.65;
        factors.push('MACD crossover bullish');
      } else {
        signal = 'sell';
        confidence = 0.65;
        factors.push('MACD crossover bearish');
      }
    }

    if (latestDivergence && latestDivergence.index > histogram.length - 10) {
      if (latestDivergence.type === 'bullish' && signal === 'buy') {
        confidence = Math.min(0.95, confidence + 0.2);
        factors.push('Divergência bullish confirmada');
      } else if (latestDivergence.type === 'bearish' && signal === 'sell') {
        confidence = Math.min(0.95, confidence + 0.2);
        factors.push('Divergência bearish confirmada');
      } else if (latestDivergence.type === 'bullish') {
        signal = 'buy';
        confidence = 0.75;
        factors.push('Divergência bullish detectada');
      } else if (latestDivergence.type === 'bearish') {
        signal = 'sell';
        confidence = 0.75;
        factors.push('Divergência bearish detectada');
      }
    }

    return {
      macdLine: macdAligned,
      signalLine,
      histogram,
      crosses,
      divergences,
      signal,
      confidence,
      factors,
    };
  }

  private static calculateEMA(values: number[], period: number): number[] {
    if (values.length < period) return [];
    const result: number[] = [];
    const multiplier = 2 / (period + 1);

    let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);

    for (let i = period; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema;
      result.push(ema);
    }
    return result;
  }

  private static detectCrossovers(
    macdLine: number[],
    signalLine: number[]
  ): Crossover[] {
    const crosses: Crossover[] = [];
    for (let i = 1; i < macdLine.length; i++) {
      const prevMACD = macdLine[i - 1];
      const currMACD = macdLine[i];
      const prevSignal = signalLine[i - 1];
      const currSignal = signalLine[i];

      if (prevMACD <= prevSignal && currMACD > currSignal) {
        crosses.push({
          type: 'bullish',
          index: i,
          strength: Math.abs(currMACD - currSignal),
        });
      } else if (prevMACD >= prevSignal && currMACD < currSignal) {
        crosses.push({
          type: 'bearish',
          index: i,
          strength: Math.abs(currMACD - currSignal),
        });
      }
    }
    return crosses;
  }

  private static detectDivergences(
    prices: number[],
    histogram: number[]
  ): Divergence[] {
    const divergences: Divergence[] = [];
    const pricePivots = this.findPivots(prices);
    const histogramPivots = this.findPivots(histogram);

    if (pricePivots.bottoms.length >= 2 && histogramPivots.bottoms.length >= 2) {
      const pb1 = pricePivots.bottoms[pricePivots.bottoms.length - 2];
      const pb2 = pricePivots.bottoms[pricePivots.bottoms.length - 1];
      const hb1 = histogramPivots.bottoms[histogramPivots.bottoms.length - 2];
      const hb2 = histogramPivots.bottoms[histogramPivots.bottoms.length - 1];

      if (
        prices[pb2.index] < prices[pb1.index] &&
        histogram[hb2.index] > histogram[hb1.index]
      ) {
        const denom = histogram[hb2.index] - histogram[hb1.index] || 1e-9;
        divergences.push({
          type: 'bullish',
          index: pb2.index,
          strength: Math.abs(
            (prices[pb2.index] - prices[pb1.index]) / denom
          ),
        });
      }
    }

    if (pricePivots.tops.length >= 2 && histogramPivots.tops.length >= 2) {
      const pt1 = pricePivots.tops[pricePivots.tops.length - 2];
      const pt2 = pricePivots.tops[pricePivots.tops.length - 1];
      const ht1 = histogramPivots.tops[histogramPivots.tops.length - 2];
      const ht2 = histogramPivots.tops[histogramPivots.tops.length - 1];

      if (
        prices[pt2.index] > prices[pt1.index] &&
        histogram[ht2.index] < histogram[ht1.index]
      ) {
        const denom = histogram[ht2.index] - histogram[ht1.index] || 1e-9;
        divergences.push({
          type: 'bearish',
          index: pt2.index,
          strength: Math.abs(
            (prices[pt2.index] - prices[pt1.index]) / denom
          ),
        });
      }
    }

    return divergences;
  }

  private static findPivots(data: number[]): Pivots {
    const tops: Pivot[] = [];
    const bottoms: Pivot[] = [];
    const lookback = 5;

    for (let i = lookback; i < data.length - lookback; i++) {
      let isTop = true;
      let isBottom = true;
      for (let j = 1; j <= lookback; j++) {
        if (data[i] <= data[i - j] || data[i] <= data[i + j]) isTop = false;
        if (data[i] >= data[i - j] || data[i] >= data[i + j]) isBottom = false;
      }
      if (isTop) tops.push({ index: i, value: data[i] });
      if (isBottom) bottoms.push({ index: i, value: data[i] });
    }
    return { tops, bottoms };
  }
}
