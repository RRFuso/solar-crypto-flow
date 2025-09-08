import { AIAnalysisResult, ChatMessage } from '@/types/ai_analyst';
import { fetchAllExternalData } from './data_fetcher';
import { AI_ANALYST_PROMPT, AI_CHAT_PROMPT } from './prompts';
import { supabase } from '@/integrations/supabase/client';

const GEMINI_API_KEY = 'AIzaSyBWPTRMt8W_bjPB12_gt5cxISQdEKANpLE';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

async function getSolarCryptoSignals(): Promise<any[]> {
  const { data, error } = await supabase.from('crypto_signals').select('*');
  if (error) {
    console.error('Error fetching data from Supabase:', error);
    throw new Error('Failed to fetch data from Supabase.');
  }
  return data;
}

export async function analyzeAndGenerateSignals(): Promise<AIAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not found in environment variables.');
  }

  try {
    // 1. Fetch all data
    const [externalData, solarCryptoSignals] = await Promise.all([
      fetchAllExternalData(),
      getSolarCryptoSignals(),
    ]);

    // 2. Construct the prompt
    const inputData = {
      marketData: {
        sp500: externalData.sp500,
        nasdaq: externalData.nasdaq,
        russell2000: externalData.russell,
        gold: externalData.gold,
        nvidia: externalData.nvidia,
      },
      cryptoData: {
        fearGreedIndex: externalData.fearGreedIndex,
        longShortRatio: externalData.longShortRatio,
        solarCryptoSignals: solarCryptoSignals,
      },
    };

    const prompt = AI_ANALYST_PROMPT.replace('{ ... }', JSON.stringify(inputData, null, 2));

    // 3. Call the Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.statusText}`);
    }

    const geminiResult = await response.json();
    
    // 4. Parse the response
    const jsonResponseString = geminiResult.candidates[0].content.parts[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedResult: AIAnalysisResult = JSON.parse(jsonResponseString);

    return parsedResult;

  } catch (error) {
    console.error('Error in AI analysis:', error);
    // In case of an error, return a mock result for the UI to display
    return {
      entrySignals: [],
      exitSignals: [],
      marketSummary: 'Failed to get analysis from AI. Please check the console for more details.',
    };
  }
}

export async function getAIChatResponse(messages: ChatMessage[]): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not found in environment variables.');
  }

  try {
    // 1. Fetch market context data
    const [externalData, solarCryptoSignals] = await Promise.all([
      fetchAllExternalData(),
      getSolarCryptoSignals(),
    ]);

    const marketContextData = {
      marketData: {
        sp500: externalData.sp500,
        nasdaq: externalData.nasdaq,
        russell2000: externalData.russell,
        gold: externalData.gold,
        nvidia: externalData.nvidia,
      },
      cryptoData: {
        fearGreedIndex: externalData.fearGreedIndex,
        longShortRatio: externalData.longShortRatio,
        solarCryptoSignals: solarCryptoSignals.slice(0, 20), // Limit signals to keep prompt size manageable
      },
    };

    // 2. Format conversation history and the new message
    const conversationHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const userMessage = messages[messages.length - 1].text;

    // 3. Construct the prompt
    let prompt = AI_CHAT_PROMPT;
    prompt = prompt.replace('{conversationHistory}', conversationHistory);
    prompt = prompt.replace('{userMessage}', userMessage);
    prompt = prompt.replace('{marketContextData}', JSON.stringify(marketContextData, null, 2));

    // 4. Call the Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.statusText}`);
    }

    const geminiResult = await response.json();
    const textResponse = geminiResult.candidates[0].content.parts[0].text;

    return textResponse;
  } catch (error) {
    console.error('Error in AI chat response:', error);
    return "Sorry, I encountered an error trying to generate a response. Please check the server logs.";
  }
}
