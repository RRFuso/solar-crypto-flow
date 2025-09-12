import { AIAnalysisResult, ChatMessage } from '@/types/ai_analyst';
import { fetchAllExternalData } from './data_fetcher';
import { AI_ANALYST_PROMPT } from './prompts';
import { supabase } from '@/integrations/supabase/client';

async function getSolarCryptoSignals(): Promise<any[]> {
  const { data, error } = await supabase.from('crypto_price_action_signals').select('*');
  if (error) {
    console.error('Error fetching data from Supabase:', error);
    throw new Error('Failed to fetch data from Supabase.');
  }
  return data;
}

// This function is not being used by the chat, but we leave it here.
// It also has a security issue, but we will address the chat first.
export async function analyzeAndGenerateSignals(): Promise<AIAnalysisResult> {
    // MOCK IMPLEMENTATION TO AVOID USING HARDCODED KEY
    console.warn("analyzeAndGenerateSignals is using a mock implementation to avoid exposing an API key.");
    return {
      entrySignals: [],
      exitSignals: [],
      marketSummary: 'This is a mock summary. The original function was disabled for security reasons.',
    };
}

export async function getAIChatResponse(messages: ChatMessage[]): Promise<string> {
  try {
    // 1. Fetch market context data
    const [externalData, solarCryptoSignals] = await Promise.all([
      fetchAllExternalData(),
      getSolarCryptoSignals(),
    ]);

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

    // Remove empty parent keys
    if (Object.keys(marketContextData.marketData).length === 0) {
      delete marketContextData.marketData;
    }
    if (Object.keys(marketContextData.cryptoData).length === 0) {
      delete marketContextData.cryptoData;
    }

    // 2. Invoke the secure Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('secure-gemini-proxy', {
      body: { messages: messages, context: marketContextData },
    });

    if (error) {
      console.error('Error invoking Supabase function:', error);
      throw new Error(`Supabase function error: ${error.message}`);
    }

    if (data.error) {
      console.error('Error from within Supabase function:', data.error);
      throw new Error(`Error from AI backend: ${data.error}`);
    }

    return data.response;

  } catch (error) {
    console.error('Error in getAIChatResponse:', error);
    return "Sorry, I encountered an error trying to generate a response. Please check the server logs for details.";
  }
}
