import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { corsHeaders } from '../_shared/cors.ts'

interface BinanceTickerData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting crypto data collection...');

    // Fetch Binance ticker data
    const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!tickerResponse.ok) {
      throw new Error(`Binance API error: ${tickerResponse.status}`);
    }
    
    const tickerData: BinanceTickerData[] = await tickerResponse.json();
    console.log(`Fetched ${tickerData.length} tickers from Binance`);

    // Filter for USDT pairs with expanded coverage
    const usdtPairs = tickerData
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .filter(ticker => parseFloat(ticker.quoteVolume) > 100000) // Reduced min to $100K daily volume
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 200); // Expanded to top 200 by volume

    console.log(`Processing ${usdtPairs.length} USDT pairs`);

    for (const ticker of usdtPairs) {
      try {
        const symbol = ticker.symbol.replace('USDT', '');
        
        // Calculate technical indicators using kline data
        const klineResponse = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${ticker.symbol}&interval=4h&limit=100`
        );
        
        if (!klineResponse.ok) {
          console.log(`Skipping kline data for ${ticker.symbol}: ${klineResponse.status}`);
          continue;
        }

        const klineData: KlineData[] = await klineResponse.json();
        const technicalIndicators = calculateTechnicalIndicators(klineData);
        
        // Store technical indicators
        const { error: techError } = await supabase
          .from('crypto_technical_indicators')
          .upsert({
            symbol,
            timeframe: '4h',
            rsi: technicalIndicators.rsi,
            macd_line: technicalIndicators.macd.line,
            macd_signal: technicalIndicators.macd.signal,
            macd_histogram: technicalIndicators.macd.histogram,
            bollinger_upper: technicalIndicators.bollinger.upper,
            bollinger_middle: technicalIndicators.bollinger.middle,
            bollinger_lower: technicalIndicators.bollinger.lower,
            ema_12: technicalIndicators.ema12,
            ema_26: technicalIndicators.ema26,
            sma_20: technicalIndicators.sma20,
            volume_sma: technicalIndicators.volumeSma,
            atr: technicalIndicators.atr,
            timestamp: new Date().toISOString()
          }, {
            onConflict: 'symbol,timeframe,timestamp'
          });

        if (techError) {
          console.error(`Error storing technical indicators for ${symbol}:`, techError);
        }

        // Fetch on-chain metrics from CoinGlass
        const { error: invokeError } = await supabase.functions.invoke('coinglass-fetcher', {
          body: { symbol },
        });

        if (invokeError) {
          console.error(`Error invoking coinglass-fetcher for ${symbol}:`, invokeError);
        }

        // Read the newly stored on-chain metrics to use in potential calculation
        const { data: onChainMetrics, error: onChainError } = await supabase
          .from('crypto_onchain_metrics')
          .select('exchange_net_flow')
          .eq('symbol', symbol)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (onChainError || !onChainMetrics) {
          console.error(`Error fetching on-chain metrics for ${symbol}:`, onChainError);
          continue; // Skip if we don't have on-chain data
        }

        // Calculate and store social metrics (still simulated)
        const socialMetrics = calculateSocialMetrics(ticker, technicalIndicators);
        
        const { error: socialError } = await supabase
          .from('crypto_social_metrics')
          .upsert({
            symbol,
            sentiment_score: socialMetrics.sentimentScore,
            mention_volume: socialMetrics.mentionVolume,
            twitter_mentions: socialMetrics.twitterMentions,
            reddit_mentions: socialMetrics.redditMentions,
            telegram_mentions: socialMetrics.telegramMentions,
            sentiment_change_24h: socialMetrics.sentimentChange24h,
            fear_greed_index: socialMetrics.fearGreedIndex,
            timestamp: new Date().toISOString()
          }, {
            onConflict: 'symbol,timestamp'
          });

        if (socialError) {
          console.error(`Error storing social metrics for ${symbol}:`, socialError);
        }

        // Calculate explosive potential using real on-chain flow
        const explosivePotential = calculateExplosivePotential(ticker, technicalIndicators, onChainMetrics, socialMetrics);
        
        const { error: signalError } = await supabase
          .from('crypto_price_action_signals')
          .upsert({
            symbol,
            explosive_potential: explosivePotential.score,
            volume_anomaly: explosivePotential.volumeAnomaly,
            price_momentum: explosivePotential.priceMomentum,
            social_buzz: explosivePotential.socialBuzz,
            whale_activity: explosivePotential.whaleActivity, // This is now based on net flow
            technical_breakout: explosivePotential.technicalBreakout,
            confidence_score: explosivePotential.confidence,
            prediction_horizon: '4h',
            timestamp: new Date().toISOString()
          }, {
            onConflict: 'symbol'
          });

        if (signalError) {
          console.error(`Error storing price action signals for ${symbol}:`, signalError);
        }

        console.log(`Processed ${symbol}`);
        
        // Rate limit to avoid hitting Binance limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing ${ticker.symbol}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: usdtPairs.length,
        message: 'Crypto data collection completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in crypto data collector:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function calculateTechnicalIndicators(klineData: KlineData[]) {
  const closes = klineData.map(k => parseFloat(k.close));
  const highs = klineData.map(k => parseFloat(k.high));
  const lows = klineData.map(k => parseFloat(k.low));
  const volumes = klineData.map(k => parseFloat(k.volume));
  
  // RSI calculation
  const rsi = calculateRSI(closes, 14);
  
  // MACD calculation
  const macd = calculateMACD(closes);
  
  // Bollinger Bands
  const bollinger = calculateBollingerBands(closes, 20, 2);
  
  // EMAs
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  // SMA
  const sma20 = calculateSMA(closes, 20);
  
  // Volume SMA
  const volumeSma = calculateSMA(volumes, 20);
  
  // ATR
  const atr = calculateATR(highs, lows, closes, 14);
  
  return {
    rsi: rsi[rsi.length - 1] || 50,
    macd: {
      line: macd.line[macd.line.length - 1] || 0,
      signal: macd.signal[macd.signal.length - 1] || 0,
      histogram: macd.histogram[macd.histogram.length - 1] || 0
    },
    bollinger: {
      upper: bollinger.upper[bollinger.upper.length - 1] || closes[closes.length - 1],
      middle: bollinger.middle[bollinger.middle.length - 1] || closes[closes.length - 1],
      lower: bollinger.lower[bollinger.lower.length - 1] || closes[closes.length - 1]
    },
    ema12: ema12[ema12.length - 1] || closes[closes.length - 1],
    ema26: ema26[ema26.length - 1] || closes[closes.length - 1],
    sma20: sma20[sma20.length - 1] || closes[closes.length - 1],
    volumeSma: volumeSma[volumeSma.length - 1] || volumes[volumes.length - 1],
    atr: atr[atr.length - 1] || 0
  };
}



function calculateSocialMetrics(ticker: BinanceTickerData, technicalIndicators: any) {
  const priceChange = parseFloat(ticker.priceChangePercent);
  const volume = parseFloat(ticker.quoteVolume);
  
  // Simulate sentiment based on price action and volume
  const sentimentBase = Math.tanh(priceChange / 10); // Range -1 to 1
  const volumeFactor = Math.min(volume / 50000000, 2); // Normalize volume impact
  
  return {
    sentimentScore: Math.max(-1, Math.min(1, sentimentBase * (0.5 + volumeFactor * 0.5))),
    mentionVolume: Math.floor(100 + volumeFactor * 500),
    twitterMentions: Math.floor(50 + volumeFactor * 200),
    redditMentions: Math.floor(20 + volumeFactor * 80),
    telegramMentions: Math.floor(30 + volumeFactor * 120),
    sentimentChange24h: priceChange * 0.8, // Sentiment follows price but with lag
    fearGreedIndex: Math.max(0, Math.min(100, 50 + priceChange * 2))
  };
}

function calculateExplosivePotential(ticker: BinanceTickerData, tech: any, onChain: any, social: any) {
  const priceChange = parseFloat(ticker.priceChangePercent);
  const volume = parseFloat(ticker.quoteVolume);
  const rsi = tech.rsi;
  
  // Volume anomaly: high volume compared to usual
  const volumeAnomaly = volume > 20000000;
  
  // Price momentum: significant price movement
  const priceMomentum = Math.abs(priceChange) > 5;
  
  // Social buzz: high sentiment and mentions
  const socialBuzz = social.sentimentScore > 0.3 && social.mentionVolume > 300;
  
  // Whale activity: significant net outflow from exchanges (bullish)
  // A negative net flow means assets are leaving exchanges.
  const whaleActivity = onChain.exchange_net_flow && onChain.exchange_net_flow < -1000000; // Example: > $1M outflow
  
  // Technical breakout: RSI conditions and price action
  const technicalBreakout = (rsi > 70 && priceChange > 0) || (rsi < 30 && priceChange < 0);
  
  // Calculate composite score
  const factors = [volumeAnomaly, priceMomentum, socialBuzz, whaleActivity, technicalBreakout];
  const score = factors.filter(Boolean).length / factors.length;
  
  // Confidence based on multiple confirmations
  const confidence = Math.min(1, score * 1.2);
  
  return {
    score,
    volumeAnomaly,
    priceMomentum,
    socialBuzz,
    whaleActivity,
    technicalBreakout,
    confidence
  };
}

// Technical indicator calculation functions
function calculateRSI(prices: number[], period: number): number[] {
  const rsi: number[] = [];
  if (prices.length < period + 1) return rsi;
  
  for (let i = period; i < prices.length; i++) {
    let gains = 0;
    let losses = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      const change = prices[j] - prices[j - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
}

function calculateMACD(prices: number[]) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const line: number[] = [];
  for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
    line.push(ema12[i] - ema26[i]);
  }
  
  const signal = calculateEMA(line, 9);
  const histogram: number[] = [];
  
  for (let i = 0; i < Math.min(line.length, signal.length); i++) {
    histogram.push(line[i] - signal[i]);
  }
  
  return { line, signal, histogram };
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  if (prices.length === 0) return ema;
  
  const multiplier = 2 / (period + 1);
  ema[0] = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
  }
  
  return ema;
}

function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j];
    }
    sma.push(sum / period);
  }
  
  return sma;
}

function calculateBollingerBands(prices: number[], period: number, stdDev: number) {
  const sma = calculateSMA(prices, period);
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b) / period;
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    middle.push(mean);
    upper.push(mean + (standardDeviation * stdDev));
    lower.push(mean - (standardDeviation * stdDev));
  }
  
  return { upper, middle, lower };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number): number[] {
  const atr: number[] = [];
  if (highs.length < 2) return atr;
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < highs.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    trueRanges.push(Math.max(hl, hc, lc));
  }
  
  for (let i = period - 1; i < trueRanges.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += trueRanges[j];
    }
    atr.push(sum / period);
  }
  
  return atr;
}