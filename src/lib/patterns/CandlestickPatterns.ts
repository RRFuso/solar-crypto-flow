export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PatternSignal {
  pattern: string;
  signal: 'buy' | 'sell' | 'neutral';
  confidence: number;
  description: string;
}

export class CandlestickPatterns {
  /**
   * Doji - indecisão. Body muito pequeno comparado ao range.
   */
  static isDoji(candle: OHLC): boolean {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    if (range === 0) return false;
    return body < range * 0.1;
  }

  /**
   * Hammer - reversão bullish. Long lower shadow, small body no topo.
   */
  static isHammer(candle: OHLC): boolean {
    const body = Math.abs(candle.close - candle.open);
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const range = candle.high - candle.low;
    if (range === 0 || body === 0) return false;
    return (
      lowerShadow >= body * 2 &&
      upperShadow < body * 0.5 &&
      body < range * 0.3
    );
  }

  /**
   * Shooting Star - reversão bearish. Long upper shadow, small body na base.
   */
  static isShootingStar(candle: OHLC): boolean {
    const body = Math.abs(candle.close - candle.open);
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const range = candle.high - candle.low;
    if (range === 0 || body === 0) return false;
    return (
      upperShadow >= body * 2 &&
      lowerShadow < body * 0.5 &&
      body < range * 0.3
    );
  }

  /**
   * Engulfing Pattern (2 velas).
   */
  static detectEngulfing(candles: OHLC[]): 'bullish' | 'bearish' | null {
    if (candles.length < 2) return null;
    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];
    const prevBody = Math.abs(prev.close - prev.open);
    const currBody = Math.abs(curr.close - curr.open);

    if (
      prev.close < prev.open &&
      curr.close > curr.open &&
      curr.open <= prev.close &&
      curr.close >= prev.open &&
      currBody > prevBody
    ) {
      return 'bullish';
    }

    if (
      prev.close > prev.open &&
      curr.close < curr.open &&
      curr.open >= prev.close &&
      curr.close <= prev.open &&
      currBody > prevBody
    ) {
      return 'bearish';
    }

    return null;
  }

  /**
   * Morning Star (3 velas) - reversão bullish.
   */
  static isMorningStar(candles: OHLC[]): boolean {
    if (candles.length < 3) return false;
    const c1 = candles[candles.length - 3];
    const c2 = candles[candles.length - 2];
    const c3 = candles[candles.length - 1];
    const body1 = Math.abs(c1.close - c1.open);
    const body2 = Math.abs(c2.close - c2.open);
    const body3 = Math.abs(c3.close - c3.open);
    const r1 = c1.high - c1.low;
    const r3 = c3.high - c3.low;
    if (r1 === 0 || r3 === 0) return false;

    return (
      c1.close < c1.open &&
      body1 > r1 * 0.6 &&
      body2 < body1 * 0.3 &&
      c2.high < c1.close &&
      c3.close > c3.open &&
      body3 > r3 * 0.6 &&
      c3.open > c2.high &&
      c3.close > (c1.open + c1.close) / 2
    );
  }

  /**
   * Evening Star (3 velas) - reversão bearish.
   */
  static isEveningStar(candles: OHLC[]): boolean {
    if (candles.length < 3) return false;
    const c1 = candles[candles.length - 3];
    const c2 = candles[candles.length - 2];
    const c3 = candles[candles.length - 1];
    const body1 = Math.abs(c1.close - c1.open);
    const body2 = Math.abs(c2.close - c2.open);
    const body3 = Math.abs(c3.close - c3.open);
    const r1 = c1.high - c1.low;
    const r3 = c3.high - c3.low;
    if (r1 === 0 || r3 === 0) return false;

    return (
      c1.close > c1.open &&
      body1 > r1 * 0.6 &&
      body2 < body1 * 0.3 &&
      c2.low > c1.close &&
      c3.close < c3.open &&
      body3 > r3 * 0.6 &&
      c3.open < c2.low &&
      c3.close < (c1.open + c1.close) / 2
    );
  }

  /**
   * Analisa múltiplos padrões e retorna sinais.
   */
  static analyzePatterns(candles: OHLC[]): PatternSignal[] {
    const signals: PatternSignal[] = [];
    if (candles.length < 1) return signals;

    const last = candles[candles.length - 1];

    if (this.isDoji(last)) {
      signals.push({
        pattern: 'doji',
        signal: 'neutral',
        confidence: 0.5,
        description: 'Indecisão - aguardar confirmação',
      });
    }

    if (this.isHammer(last)) {
      signals.push({
        pattern: 'hammer',
        signal: 'buy',
        confidence: 0.7,
        description: 'Possível reversão bullish',
      });
    }

    if (this.isShootingStar(last)) {
      signals.push({
        pattern: 'shooting_star',
        signal: 'sell',
        confidence: 0.7,
        description: 'Possível reversão bearish',
      });
    }

    if (candles.length >= 2) {
      const eng = this.detectEngulfing(candles);
      if (eng === 'bullish') {
        signals.push({
          pattern: 'bullish_engulfing',
          signal: 'buy',
          confidence: 0.8,
          description: 'Forte reversão bullish',
        });
      } else if (eng === 'bearish') {
        signals.push({
          pattern: 'bearish_engulfing',
          signal: 'sell',
          confidence: 0.8,
          description: 'Forte reversão bearish',
        });
      }
    }

    if (candles.length >= 3) {
      if (this.isMorningStar(candles)) {
        signals.push({
          pattern: 'morning_star',
          signal: 'buy',
          confidence: 0.85,
          description: 'Padrão de reversão bullish forte',
        });
      }
      if (this.isEveningStar(candles)) {
        signals.push({
          pattern: 'evening_star',
          signal: 'sell',
          confidence: 0.85,
          description: 'Padrão de reversão bearish forte',
        });
      }
    }

    return signals;
  }
}
