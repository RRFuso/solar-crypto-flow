import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { supabase } from '../_shared/supabaseClient.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

const AI_CHAT_PROMPT = `
Você é o "Analista Solar", uma IA especialista em análise de criptomoedas. Sua missão é fornecer insights claros, concisos e acionáveis.

**Regras Estritas:**
1.  **Foco Total:** Responda APENAS a perguntas relacionadas a criptomoedas, finanças, blockchain, análise de mercado e trading. Se o usuário perguntar sobre qualquer outro tópico, recuse educadamente.
2.  **Sem Aconselhamento Financeiro:** NUNCA forneça aconselhamento financeiro direto. Use frases como "uma possível interpretação é...", "alguns analistas consideram que...".
3.  **Tom Profissional:** Mantenha um tom profissional, analítico e ligeiramente formal.
4.  **Use o Contexto:** Baseie suas respostas nos dados de contexto fornecidos abaixo. Integre esses dados de forma natural em suas análises.

**Contexto de Mercado Principal:**
Este objeto JSON contém os dados de mercado que você deve usar como base para suas análises. Preste atenção especial aos seguintes campos:
- **aiWatchlist**: Uma lista de criptomoedas selecionadas por outra IA para monitoramento. Contém o símbolo do ativo, o motivo da inclusão (reason) e o potencial de alta (upside_potential). Use esta informação para responder sobre tokens que estão sendo observados.
- **solarCryptoSignals**: Sinais de análise técnica para vários ativos.
- **fearGreedIndex**: O sentimento geral do mercado.
- **longShortRatio**: A proporção de posições de compra vs. venda.

{marketContextData}

**Dados Adicionais (Sob Demanda):**
Se o usuário perguntar sobre um token específico, os dados de preço (atuais e históricos) dele aparecerão aqui. Use-os como a fonte principal para sua análise sobre esse token.
- **price_history**: Contém dados OHLCV (Open, High, Low, Close, Volume) dos últimos 90 dias. Use estes dados para analisar tendências, calcular médias móveis simples (SMA), ou identificar padrões de preço.

{additionalData}

**Histórico da Conversa:**
{conversationHistory}

**Pergunta do Usuário:**
{userMessage}

**Sua Resposta:**
`

async function getSolarCryptoSignals(): Promise<any[]> {
  const { data, error } = await supabase.from('crypto_price_action_signals').select('*');
  if (error) {
    console.error('Error fetching crypto_price_action_signals:', error);
    return [];
  }
  return data || [];
}

async function getAIWatchlist(): Promise<any[]> {
  const { data, error } = await supabase.from('ai_watchlist').select('*');
  if (error) {
    console.error('Error fetching ai_watchlist:', error);
    return [];
  }
  return data || [];
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
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('--- [secure-gemini-proxy] Invalid messages in request body ---');
      return new Response(JSON.stringify({ error: 'Messages are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    console.log('--- [secure-gemini-proxy] Request body parsed successfully ---');

    if (!GEMINI_API_KEY) {
      console.error('--- [secure-gemini-proxy] GEMINI_API_KEY not found ---');
      throw new Error('Gemini API key not found in environment variables.');
    }
    console.log('--- [secure-gemini-proxy] GEMINI_API_KEY found ---');

    console.log('--- [secure-gemini-proxy] Fetching market context data ---');
    const [externalData, solarCryptoSignals, aiWatchlist] = await Promise.all([
      fetchAllExternalData(req),
      getSolarCryptoSignals(),
      getAIWatchlist(),
    ]);
    console.log('--- [secure-gemini-proxy] Market context data fetched successfully ---');

    // 2. Sanitize and structure the context data
    const marketContextData: any = {
      marketData: {},
      cryptoData: {},
    };

    if (externalData.sp500) marketContextData.marketData.sp500 = externalData.sp500;
    if (externalData.nasdaq) marketContextData.marketData.nasdaq = externalData.nasdaq;
    if (externalData.russell) marketContextData.marketData.russell2000 = externalData.russell;
    if (externalData.gold) marketContextData.marketData.gold = externalData.gold;
    if (externalData.nvidia) marketContextData.marketData.nvidia = externalData.nvidia;

    if (externalData.fearGreedIndex && externalData.fearGreedIndex.length > 0) {
      marketContextData.cryptoData.fearGreedIndex = externalData.fearGreedIndex;
    }
    if (externalData.longShortRatio && externalData.longShortRatio.length > 0) {
      marketContextData.cryptoData.longShortRatio = externalData.longShortRatio;
    }
    if (solarCryptoSignals && solarCryptoSignals.length > 0) {
      marketContextData.cryptoData.solarCryptoSignals = solarCryptoSignals.slice(0, 20);
    }
    if (aiWatchlist && aiWatchlist.length > 0) {
      marketContextData.cryptoData.aiWatchlist = aiWatchlist;
    }

    // Remove empty parent keys
    if (Object.keys(marketContextData.marketData).length === 0) {
      delete marketContextData.marketData;
    }
    if (Object.keys(marketContextData.cryptoData).length === 0) {
      delete marketContextData.cryptoData;
    }
    
    console.log("--- [secure-gemini-proxy] Fetched Market Context Data ---");
    console.log(JSON.stringify(marketContextData, null, 2));
    console.log("------------------------------------\n");

    const conversationHistory = messages.map((m: { sender: string; text: string }) => `${m.sender}: ${m.text}`).join('\n');
    const userMessage = messages[messages.length - 1].text;

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

    console.log('--- [secure-gemini-proxy] Sending request to Gemini API ---');
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('--- [secure-gemini-proxy] Gemini API request failed ---', errorBody);
      throw new Error(`Gemini API request failed: ${response.statusText}`);
    }
    console.log('--- [secure-gemini-proxy] Gemini API request successful ---');

    const geminiResult = await response.json();
    const textResponse = geminiResult.candidates[0].content.parts[0].text;

    console.log('--- [secure-gemini-proxy] Function finished successfully ---');
    return new Response(JSON.stringify({ response: textResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('--- [secure-gemini-proxy] An error occurred ---', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});