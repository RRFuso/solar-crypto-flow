
import { supabase } from "@/integrations/supabase/client";
import { WhaleTransaction, ExchangeFlow } from '@/types/onchain';

// Fetch generic results from Dune using a pre-executed Execution ID via Edge Function
export async function fetchDuneExecutionResults(executionId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.functions.invoke('dune-fetch', {
      body: { executionId },
    });
    if (error) throw error;
    // Dune returns { result: { rows: [...] } } in v1 responses
    // Normalize to rows array
    // @ts-ignore - depending on Dune response shape
    return data?.result?.rows ?? data?.rows ?? [];
  } catch (err) {
    console.error('Error fetching Dune execution results:', err);
    return [];
  }
}

// Placeholder helper kept for compatibility. Prefer using fetchDuneExecutionResults.
export async function fetchOnChainDataFromDune(
  symbols: string[]
): Promise<Map<string, { whaleTransactions: WhaleTransaction[]; exchangeFlow: ExchangeFlow | null }>> {
  console.warn(
    'fetchOnChainDataFromDune: configure query-based workflow or use fetchDuneExecutionResults(executionId) for immediate results.'
  );
  return new Map();
}
