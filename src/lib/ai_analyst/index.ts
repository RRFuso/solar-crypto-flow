import { AIAnalysisResult, ChatMessage } from '@/types/ai_analyst';
import { supabase } from '@/integrations/supabase/client';

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
    // 1. Invoke the secure Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('secure-gemini-proxy', {
      body: { messages: messages },
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
    // Re-throw the error to be caught by the calling function, making debugging clearer.
    throw error;
  }
}
