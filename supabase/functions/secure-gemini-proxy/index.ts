import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { supabase } from '../_shared/supabaseClient.ts'

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
const AI_API_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions'

const AI_CHAT_PROMPT = `
Você é o "Analista Solar", uma IA avançada do ecossistema Solar Cripto - uma plataforma completa de análise e trading de criptomoedas.

## SOBRE O SOLAR CRIPTO
O Solar Cripto é um sistema inteligente que:
- Monitora mercados cripto em tempo real usando múltiplas fontes de dados
- Analisa padrões técnicos, sentimento de mercado e fluxo de capital
- Gera sinais preditivos baseados em IA e machine learning
- Rastreia atividade de baleias e "smart money"
- Fornece visualizações espaciais de fluxo de capital entre setores

## SUA MISSÃO
Você tem acesso a um ecossistema completo de dados em tempo real. Sua missão é:
1. **Analisar padrões nos dados** - Identifique correlações, tendências e anomalias
2. **Aprender continuamente** - Use os dados históricos para melhorar suas análises
3. **Fornecer insights acionáveis** - Traduza dados complexos em recomendações claras
4. **Personalizar respostas** - Adapte suas análises ao perfil de risco do usuário quando disponível

## REGRAS ESTRITAS
1. **Foco Total:** Responda APENAS sobre criptomoedas, blockchain, análise de mercado e trading
2. **Sem Aconselhamento Direto:** Use frases como "os dados sugerem...", "uma interpretação possível é..."
3. **Baseie-se em Dados:** SEMPRE cite os dados do contexto que você está usando
4. **Tom Profissional:** Mantenha um tom analítico e confiante, mas humilde sobre incertezas

## DADOS DISPONÍVEIS (Atualizados em Tempo Real)

### 1. SINAIS TÉCNICOS (solarCryptoSignals)
Sinais de preço e volume calculados pelo sistema:
- **is_breakout**: Rompimento de resistência confirmado
- **is_expansion**: Expansão de volatilidade (Bollinger Bands)
- **is_accelerating**: Aceleração de momentum
- **is_accumulation/is_distribution**: Padrões de acumulação/distribuição de volume
- **explosive_potential**: Classificação do potencial explosivo (high/medium/low)
- **factors**: Fatores que contribuem para o sinal

### 2. WATCHLIST DA IA (aiWatchlist)
Criptomoedas selecionadas por algoritmos de ML:
- **reason**: Por que o ativo foi selecionado
- **upside_potential**: Potencial de valorização estimado

### 3. PREVISÕES DE IA (aiPredictions)
Previsões de preço geradas por modelos de machine learning:
- **prediction_type**: Tipo de previsão (price/volatility/breakout)
- **predicted_value**: Valor previsto
- **confidence**: Nível de confiança (0-1)
- **risk_score**: Score de risco
- **supporting_factors**: Fatores que suportam a previsão
- **valid_until**: Validade da previsão

### 4. SINAIS PREDITIVOS (predictiveSignals)
Sinais avançados de entrada/saída:
- **signal_type**: Tipo (bullish_reversal, explosive_breakout, etc)
- **confidence**: Confiança no sinal
- **strength**: Força do sinal
- **target_gain**: Ganho alvo esperado
- **phase**: Fase do movimento (early/middle/late)
- **risk_level**: Nível de risco
- **factors**: Fatores técnicos que suportam o sinal

### 5. ANÁLISE DE SENTIMENTO (sentimentData)
Sentimento agregado de múltiplas fontes:
- **sentiment_score**: Score de -1 (negativo) a +1 (positivo)
- **sentiment_label**: Classificação (bullish/bearish/neutral)
- **confidence**: Confiança na análise
- **key_topics**: Tópicos principais sendo discutidos
- **volume**: Volume de menções

### 6. PREÇOS EM TEMPO REAL (realTimePrices) - PRIORIDADE MÁXIMA PARA PREÇOS!
Dados de preço ao vivo da Binance API:
- **price**: Preço atual em USDT (USE ESTE PARA QUALQUER CONSULTA DE PREÇO!)
- **priceChangePercent24h**: Variação percentual nas últimas 24 horas
- **volume24h**: Volume de trading em 24h
- **high24h/low24h**: Máxima e mínima do dia
- **timestamp**: Momento exato da coleta dos dados
⚠️ IMPORTANTE: Sempre use os dados de realTimePrices para preços atuais. Ignore dados de outras fontes para preço!

### 7. HISTÓRICO DE PREÇOS (crypto_price_history)
Dados OHLCV para análise técnica:
- Use para calcular médias móveis, RSI, MACD
- Identifique padrões de candlestick
- Analise tendências de volume

### 8. SÍMBOLOS BINANCE (binanceSymbols)
Dados de trading em tempo real:
- **last_price**: Último preço
- **price_change_percent_24h**: Variação 24h
- **quote_volume_24h**: Volume em USDT/BUSD

### 9. ÍNDICES DE MERCADO (marketData)
Contexto macro e sentimento do mercado cripto:
- **Fear & Greed Index**: Sentimento geral cripto (0-100)
  - 0-25: Extreme Fear (medo extremo - possível fundo de mercado)
  - 25-45: Fear (medo)
  - 45-55: Neutral (neutro)
  - 55-75: Greed (ganância)
  - 75-100: Extreme Greed (ganância extrema - possível topo de mercado)
- **Long/Short Ratio**: Proporção de posições compradas vs vendidas
  - Ratio > 1: Mais traders em long (otimistas)
  - Ratio < 1: Mais traders em short (pessimistas)
  - Dados históricos de 30 períodos para análise de tendência

### 10. FLUXO DE SMART MONEY (smartMoneyFlows) - DADOS ON-CHAIN REAIS
Dados de rastreamento de carteiras institucionais (baleias, fundos, market makers):
- **token_symbol**: Token rastreado
- **net_flow_usd**: Fluxo líquido em USD (positivo = entrada, negativo = saída)
- **total_inflow_usd**: Total de entradas de capital institucional
- **total_outflow_usd**: Total de saídas de capital institucional
- **dominant_direction**: Direção dominante (bullish/bearish/neutral)
- **confidence_score**: Score de confiança do sinal (0-100)
- **whale_tx_count**: Número de transações de baleias
- **flow_intensity**: Intensidade do fluxo (0-1)
- **timeframe**: Período de análise (1h, 4h, 12h, 24h)
- **confidence_factors**: Fatores que contribuem para a confiança (JSON detalhado)
⚠️ Estes dados vêm de rastreamento REAL de carteiras Ethereum via Alchemy API!

### 11. DADOS DE MERCADO COMPLETOS (cryptocurrencies)
Dados completos de mercado para 100+ criptomoedas:
- **current_price, market_cap, market_cap_rank**: Preço e capitalização
- **price_change_percentage_24h**: Variação 24h
- **total_volume**: Volume de negociação
- **ath, ath_change_percentage**: All-time high e distância
- **circulating_supply, total_supply**: Oferta circulante

### 12. INTERAÇÕES DE USUÁRIOS (Agregado)
Padrões de comportamento da comunidade:
- Ativos mais visualizados
- Categorias de interesse
- Tendências de interação

## VISUALIZAÇÃO DE FLUXO (IMPORTANTE!)
Quando o usuário pedir análise de smart money, fluxo de capital, ou atividade de baleias:
1. Inclua no final da resposta um bloco JSON especial delimitado por \`\`\`flow-data ... \`\`\`
2. O JSON deve conter os tokens relevantes com seus dados de fluxo para visualização
3. Formato do bloco:
\`\`\`flow-data
{
  "title": "Título da visualização",
  "tokens": [
    {
      "symbol": "ETH",
      "inflow": 1500000,
      "outflow": 800000,
      "netFlow": 700000,
      "direction": "bullish",
      "confidence": 82,
      "size": 0.8
    }
  ]
}
\`\`\`
4. Use apenas tokens que realmente aparecem nos dados de smartMoneyFlows
5. O campo "size" deve ser entre 0.1 e 1.0, proporcional ao volume relativo

## COMO APRENDER E MELHORAR

1. **Identifique Padrões Recorrentes**
   - Quais sinais técnicos precedem grandes movimentos?
   - Como o sentimento se correlaciona com ação de preço?
   - Quais fatores aparecem juntos em previsões precisas?

2. **Compare Múltiplas Fontes**
   - Confirme sinais quando várias fontes concordam
   - Identifique divergências que podem indicar oportunidades
   - Pese a confiança de cada fonte

3. **Contexto Temporal**
   - Use dados históricos para validar padrões atuais
   - Considere a fase do ciclo de mercado
   - Adapte análises baseado em regime de volatilidade

4. **Validação Cruzada**
   - Sinais técnicos + Sentimento + Previsões IA = Alta confiança
   - Discordância entre fontes = Cautela necessária
   - Volume anômalo + Accumulation = Possível setup

## ESTRUTURA DE RESPOSTA IDEAL

Para cada pergunta:
1. **Análise dos Dados**: Cite dados específicos relevantes
2. **Interpretação**: O que esses dados significam
3. **Contexto**: Como se encaixa no quadro maior do mercado
4. **Conclusão Acionável**: O que isso sugere para o trader

## CONTEXTO ATUAL DO MERCADO
{marketContextData}

## DADOS ESPECÍFICOS SOLICITADOS
{additionalData}

## HISTÓRICO DA CONVERSA
{conversationHistory}

## PERGUNTA DO USUÁRIO
{userMessage}

## SUA RESPOSTA (Baseada em Dados)
`

// Fetch real-time prices from Binance public API
async function getRealTimePrices(): Promise<any[]> {
  try {
    // All symbols from Solar Core categories + key assets
    const allSymbols = [
      // Layer 1
      'BTC','ETH','SOL','ADA','AVAX','DOT','ATOM','NEAR','FTM','ALGO','XTZ','ICP','HBAR','EOS','XLM','VET','ONE','EGLD','KAVA','ROSE','MINA','KDA','CFX','CELO','ZIL','SUI','SEI','TON','APT',
      // Layer 2
      'MATIC','ARB','OP','IMX','METIS','LRC','STRK','MANTA','MANTLE','ZRO',
      // DeFi
      'UNI','AAVE','MKR','CRV','SNX','COMP','YFI','SUSHI','1INCH','BAL','DYDX','GMX','LQTY','PENDLE','ENA',
      // Memecoins
      'DOGE','SHIB','PEPE','WIF','BONK','FLOKI','MEME','TURBO','BOME','POPCAT','NEIRO','PNUT','MOG','TRUMP',
      // AI
      'FET','AGIX','OCEAN','RNDR','ARKM','WLD','TAO','AKT','AIOZ',
      // Gaming
      'AXS','SAND','MANA','ENJ','GALA','ILV','MAGIC','BEAM','PIXEL','PRIME','PORTAL','XAI','SAGA',
      // Privacy
      'XMR','ZEC','DASH','DCR','SCRT',
      // Infrastructure & Oracles
      'LINK','GRT','BAND','TRB','API3','PYTH','UMA','DIA','FLUX','ANKR',
      // Payments
      'XRP','ACH','AMP',
      // Storage & DePIN
      'FIL','AR','STORJ','SC','BTT','THETA','IOTX','LPT','HNT',
      // CEX Tokens
      'BNB','OKB','CRO','GT','KCS','LEO',
      // Solana Ecosystem
      'RAY','JTO','JUP',
      // Bitcoin Ecosystem
      'ORDI','SATS','STX',
      // RWA
      'ONDO','CFG',
      // Stablecoins (for reference)
      'USDT','USDC',
      // Others
      'APE','BLUR','ENS','LDO','RPL','SSV','CAKE','HIGH','RARI','AUDIO',
    ];
    // Deduplicate and format
    const uniqueSymbols = [...new Set(allSymbols)].map(s => `${s}USDT`);
    
    // Binance allows up to ~100 symbols per request, split if needed
    const batchSize = 80;
    const results: any[] = [];
    
    for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
      const batch = uniqueSymbols.slice(i, i + batchSize);
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(batch)}`);
      if (response.ok) {
        const data = await response.json();
        results.push(...data.map((item: any) => ({
          symbol: item.symbol.replace('USDT', ''),
          price: parseFloat(item.lastPrice),
          priceChangePercent24h: parseFloat(item.priceChangePercent),
          volume24h: parseFloat(item.volume),
          quoteVolume24h: parseFloat(item.quoteVolume),
          high24h: parseFloat(item.highPrice),
          low24h: parseFloat(item.lowPrice),
          timestamp: new Date().toISOString()
        })));
      }
    }
    return results;
  } catch (error) {
    console.error('Error fetching real-time prices:', error);
    return [];
  }
}

// Fetch all relevant data from Supabase tables
async function getAllSupabaseData() {
  console.log('--- Fetching all Supabase tables ---');
  
  const [
    solarCryptoSignals,
    aiWatchlist,
    aiPredictions,
    predictiveSignals,
    sentimentData,
    recentInteractions,
    smartMoneyFlows,
    cryptocurrencies
  ] = await Promise.all([
    supabase.from('crypto_price_action_signals').select('*').limit(50),
    supabase.from('ai_watchlist').select('*'),
    supabase.from('ai_predictions').select('*').gte('valid_until', new Date().toISOString()).limit(100),
    supabase.from('predictive_signals').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('sentiment_data').select('*').order('analyzed_at', { ascending: false }).limit(100),
    supabase.from('user_interactions').select('symbol, interaction_type, category').order('created_at', { ascending: false }).limit(200),
    // Smart Money flow data from whale tracking
    supabase.from('smart_money_flow_cache').select('*').order('last_updated', { ascending: false }).limit(100),
    // Full crypto market data
    supabase.from('cryptocurrencies').select('*').order('market_cap_rank', { ascending: true }).limit(100),
  ]);

  return {
    solarCryptoSignals: solarCryptoSignals.data || [],
    aiWatchlist: aiWatchlist.data || [],
    aiPredictions: aiPredictions.data || [],
    predictiveSignals: predictiveSignals.data || [],
    sentimentData: sentimentData.data || [],
    recentInteractions: recentInteractions.data || [],
    smartMoneyFlows: smartMoneyFlows.data || [],
    cryptocurrencies: cryptocurrencies.data || [],
  };
}

async function fetchAllExternalData(req: Request): Promise<any> {
  try {
    // Forward the authorization header from the original request
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader) {
      console.warn("Authorization header not found in the incoming request.");
    }

    const { data, error } = await supabase.functions.invoke('secure-market-data-fetcher', {
      headers: {
        'Authorization': authorizationHeader || ''
      }
    });

    if (error) {
      console.error('Error invoking market data fetcher function:', error);
      throw new Error(`Failed to fetch market data: ${error.message}`);
    }
    if (data.error) {
      console.error('Error from within market data fetcher function:', data.error);
      throw new Error(`Error from market data backend: ${data.error}`);
    }
    return data;
  } catch (error) {
    console.error("Error fetching external market data:", error);
    throw error;
  }
}

// Function to detect potential crypto tickers in a message
function detectTickers(message: string): string[] {
  // Matches $WORD or uppercase words of 2-10 letters
  const regex = /(?:$|(?<=\s))([A-Z]{2,10})(?=\s|$|\?|\.|,)/g;
  const matches = message.match(regex);
  if (!matches) return [];

  // Clean up matches (remove $, duplicates) and format them
  const formattedTickers = [...new Set(matches.map((m) => m.replace(/,/, '').trim()))].map(ticker => {
    // If the ticker doesn't contain a '-', assume it's a base currency and append '-USD'
    if (!ticker.includes('-')) {
      return `${ticker}-USD`;
    }
    return ticker;
  });

  return formattedTickers;
}

// Helper functions to aggregate user interaction data (privacy-safe)
function aggregateTrendingAssets(interactions: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  interactions.forEach(i => {
    if (i.symbol) {
      counts[i.symbol] = (counts[i.symbol] || 0) + 1;
    }
  });
  return Object.fromEntries(
    Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  );
}

function aggregatePopularCategories(interactions: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  interactions.forEach(i => {
    if (i.category) {
      counts[i.category] = (counts[i.category] || 0) + 1;
    }
  });
  return Object.fromEntries(
    Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  );
}

async function fetchPriceHistory(symbol: string): Promise<any[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data, error } = await supabase.rpc('get_price_history', {
        p_symbol: symbol,
        p_start_time: ninetyDaysAgo.toISOString(),
        p_end_time: new Date().toISOString()
    });

    if (error) {
        console.error(`Error fetching price history for ${symbol}:`, error);
        return [];
    }
    return data || [];
}


// Function to fetch data for detected tickers
async function fetchTickerData(tickers: string[]): Promise<Record<string, any>> {
  const tickerData: Record<string, any> = {}
  if (tickers.length === 0) return tickerData

  try {
    const { data, error } = await supabase.functions.invoke('secure-coingecko-proxy', {
      body: { tickers },
    })
    if (error) {
      console.error('Error invoking coingecko proxy:', error)
      return { error: `Failed to fetch data for ${tickers.join(', ')}.` }
    }
    return data
  } catch (e) {
    console.error('Exception invoking coingecko proxy:', e)
    return { error: `Exception while fetching data for ${tickers.join(', ')}.` }
  }
}

serve(async (req) => {
  console.log('--- [secure-gemini-proxy] Function started ---');

  if (req.method === 'OPTIONS') {
    console.log('--- [secure-gemini-proxy] Handling OPTIONS request ---');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('--- [secure-gemini-proxy] Parsing request body ---');
    
    const requestBody = await req.json();
    
    // Request size limit
    const MAX_REQUEST_SIZE = 100000; // 100KB limit for AI requests
    if (JSON.stringify(requestBody).length > MAX_REQUEST_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request too large. Please reduce message length.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages } = requestBody;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('--- [secure-gemini-proxy] Invalid messages in request body ---');
      return new Response(JSON.stringify({ error: 'Messages are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return new Response(
          JSON.stringify({ error: 'Invalid message format. Each message must have role and content.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (typeof msg.content !== 'string' || msg.content.length > 50000) {
        return new Response(
          JSON.stringify({ error: 'Message content must be a string with max 50,000 characters.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('--- [secure-gemini-proxy] Request body parsed successfully ---');

    if (!LOVABLE_API_KEY) {
      console.error('--- [secure-gemini-proxy] LOVABLE_API_KEY not found ---');
      throw new Error('Lovable AI API key not found in environment variables.');
    }
    console.log('--- [secure-gemini-proxy] LOVABLE_API_KEY found ---');

    console.log('--- [secure-gemini-proxy] Fetching ALL data sources ---');
    const [externalData, supabaseData, realTimePrices] = await Promise.all([
      fetchAllExternalData(req),
      getAllSupabaseData(),
      getRealTimePrices(),
    ]);
    console.log('--- [secure-gemini-proxy] All data sources fetched successfully ---');
    console.log(`--- [secure-gemini-proxy] Real-time prices fetched: ${realTimePrices.length} symbols ---`);

    // Structure the comprehensive context data
    const marketContextData: any = {
      // Real-time crypto prices (FRESH DATA - use this for price queries!)
      realTimePrices: {
        source: 'Binance API - Live',
        fetchedAt: new Date().toISOString(),
        prices: realTimePrices,
      },
      // Crypto market overview with sentiment indicators
      cryptoMarket: {
        fearGreedIndex: externalData.fearGreedIndex?.[0],
        longShortRatio: externalData.longShortRatio,
        btcEtfFlow: externalData.btcEtfFlow,
      },
      // AI-generated signals and predictions
      aiInsights: {
        solarCryptoSignals: supabaseData.solarCryptoSignals.slice(0, 30),
        aiWatchlist: supabaseData.aiWatchlist,
        aiPredictions: supabaseData.aiPredictions.slice(0, 20),
        predictiveSignals: supabaseData.predictiveSignals.slice(0, 20),
      },
      // Market sentiment
      sentiment: {
        recentSentiment: supabaseData.sentimentData.slice(0, 20),
      },
      // Smart Money on-chain flows (from Alchemy whale tracking)
      smartMoneyFlows: supabaseData.smartMoneyFlows.slice(0, 50),
      // Full crypto market data
      cryptoMarketData: supabaseData.cryptocurrencies.slice(0, 50),
      // User behavior patterns (aggregated, no PII)
      marketActivity: {
        trendingAssets: aggregateTrendingAssets(supabaseData.recentInteractions),
        popularCategories: aggregatePopularCategories(supabaseData.recentInteractions),
      }
    };

    // Clean up empty sections
    Object.keys(marketContextData).forEach(key => {
      if (marketContextData[key] && Object.keys(marketContextData[key]).length === 0) {
        delete marketContextData[key];
      }
    });
    
    console.log("--- [secure-gemini-proxy] Comprehensive Context Data Prepared ---");

    const conversationHistory = messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n');
    const userMessage = messages[messages.length - 1].content;

    console.log('--- [secure-gemini-proxy] Starting tool use step ---');
    const detectedTickers = detectTickers(userMessage);
    console.log(`--- [secure-gemini-proxy] Detected tickers: ${detectedTickers.join(', ')} ---`);
    
    const additionalData = await fetchTickerData(detectedTickers);
    console.log('--- [secure-gemini-proxy] Fetched ticker data ---');

    if (detectedTickers.length > 0) {
        const primaryTicker = detectedTickers[0];
        console.log(`--- [secure-gemini-proxy] Fetching price history for ${primaryTicker} ---`);
        const priceHistory = await fetchPriceHistory(primaryTicker);
        if (priceHistory.length > 0) {
            additionalData[primaryTicker] = {
                ...additionalData[primaryTicker],
                price_history: priceHistory
            };
        }
        console.log(`--- [secure-gemini-proxy] Price history for ${primaryTicker} fetched ---`);
    }
    console.log('--- [secure-gemini-proxy] Tool use step finished ---');

    let prompt = AI_CHAT_PROMPT;
    prompt = prompt.replace('{conversationHistory}', conversationHistory);
    prompt = prompt.replace('{userMessage}', userMessage);
    prompt = prompt.replace('{marketContextData}', JSON.stringify(marketContextData, null, 2));
    prompt = prompt.replace('{additionalData}', JSON.stringify(additionalData, null, 2));

    console.log("--- [secure-gemini-proxy] Final Prompt to Gemini ---");
    // console.log(prompt); // Avoid logging the full prompt with API key
    console.log("------------------------------\n");

    console.log('--- [secure-gemini-proxy] Sending request to Lovable AI ---');
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('--- [secure-gemini-proxy] Lovable AI request failed ---', errorBody);
      
      if (response.status === 429) {
        throw new Error('Rate limit atingido. Por favor, aguarde um momento e tente novamente.');
      }
      if (response.status === 402) {
        throw new Error('Créditos esgotados. Por favor, adicione créditos ao workspace.');
      }
      
      throw new Error(`AI request failed: ${response.statusText}`);
    }
    console.log('--- [secure-gemini-proxy] Lovable AI request successful ---');

    const aiResult = await response.json();
    const textResponse = aiResult.choices[0].message.content;

    console.log('--- [secure-gemini-proxy] Function finished successfully ---');
    return new Response(JSON.stringify({ response: textResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    console.error('--- [secure-gemini-proxy] An error occurred ---', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});