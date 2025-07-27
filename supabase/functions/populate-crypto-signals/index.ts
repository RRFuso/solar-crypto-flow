import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
const handleCORS = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// URLs da API da Binance
const BINANCE_EXCHANGE_INFO_URL = "https://api.binance.com/api/v3/exchangeInfo";
const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";

// Função para obter dinamicamente todos os pares de trading USDT ativos
async function fetchUSDTTradingPairs(): Promise<string[]> {
  try {
    console.log("Fetching USDT trading pairs from Binance Exchange Info...");
    const response = await fetch(BINANCE_EXCHANGE_INFO_URL);
    if (!response.ok) {
      throw new Error(`Binance Exchange Info API error: ${response.statusText}`);
    }
    const exchangeInfo = await response.json();

    const usdtPairs = exchangeInfo.symbols
      .filter((s: any) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map((s: any) => s.symbol);

    console.log(`Found ${usdtPairs.length} USDT trading pairs.`);
    return usdtPairs;
  } catch (e: any) {
    console.error(`Error fetching USDT trading pairs: ${e.message}`);
    return []; // Retorna uma lista vazia em caso de erro
  }
}

// A função principal que será executada pela Edge Function
Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // 1. Obter a lista dinâmica de símbolos USDT
    const symbolsToProcess = await fetchUSDTTradingPairs();
    if (symbolsToProcess.length === 0) {
      console.log("No USDT symbols found to process. Exiting.");
      return new Response(JSON.stringify({ message: "No USDT symbols found to process." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      });
    }

    // 2. Obter dados de ticker para todos os símbolos
    console.log("Fetching Binance ticker data for all symbols...");
    const response = await fetch(BINANCE_TICKER_URL);
    if (!response.ok) {
      throw new Error(`Binance Ticker API error: ${response.statusText}`);
    }
    const allTickers = await response.json();
    const tickersData = new Map(allTickers.map((t: any) => [t.symbol, t]));
    console.log(`Fetched ${tickersData.size} tickers.`);

    const signalsToUpsert: any[] = [];

    // 3. Processar apenas os símbolos USDT que foram encontrados
    for (const symbol of symbolsToProcess) {
      const ticker = tickersData.get(symbol);
      if (!ticker) {
        // Isso pode acontecer se um símbolo foi listado no exchangeInfo mas não tem dados de ticker 24hr
        console.log(`Skipping ${symbol}: Ticker data not found in 24hr ticker list.`);
        continue;
      }

      try {
        const volume24h = parseFloat(ticker.quoteVolume || '0');
        const change24h = parseFloat(ticker.priceChangePercent || '0');

        let explosivePotential = "None";
        // Ajuste os thresholds conforme sua necessidade
        if (volume24h > 100_000_000 && change24h > 5) {
          explosivePotential = "High";
        } else if (volume24h > 50_000_000 && change24h > 2) {
          explosivePotential = "Medium";
        } else if (volume24h > 10_000_000 && change24h > 0.5) {
          explosivePotential = "Low";
        }

        // --- INÍCIO DO BLOCO DE TESTE TEMPORÁRIO ---
        // REMOVA ESTE BLOCO APÓS O TESTE
        if (symbol === "BTCUSDT") {
            explosivePotential = "High";
        } else if (symbol === "ETHUSDT") {
            explosivePotential = "Medium";
        } else if (symbol === "SOLUSDT") {
            explosivePotential = "Low";
        }
        // --- FIM DO BLOCO DE TESTE TEMPORÁRIO ---

        const signalData = {
          symbol: symbol.replace("USDT", ""), // Armazena apenas o símbolo da cripto (ex: BTC)
          explosive_potential: explosivePotential,
          is_breakout: false, // Placeholder
          is_expansion: false, // Placeholder
          is_accelerating: false, // Placeholder
          last_updated: new Date().toISOString(), // Timestamp atual no formato ISO
        };
        signalsToUpsert.push(signalData);
        // console.log(`Prepared signal for ${symbol}: Explosive Potential = ${explosivePotential}, Volume = ${volume24h.toFixed(2)}, Change = ${change24h.toFixed(2)}%`); // Descomente para ver logs detalhados
      } catch (e: any) {
        console.error(`Error processing data for ${symbol}: ${e.message}`);
      }
    }

    if (signalsToUpsert.length > 0) {
      console.log(`Upserting ${signalsToUpsert.length} signals to Supabase...`);
      const { data, error } = await supabase
        .from("crypto_price_action_signals")
        .upsert(signalsToUpsert, { onConflict: "symbol" });

      if (error) {
        console.error("Supabase upsert error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 500,
        });
      } else {
        console.log("Upsert successful!");
        return new Response(JSON.stringify({ message: "Signals updated successfully", data }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 200,
        });
      }
    } else {
      console.log("No signals to upsert.");
      return new Response(JSON.stringify({ message: "No signals to upsert." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      });
    }
  } catch (e: any) {
    console.error("Error in Edge Function:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});