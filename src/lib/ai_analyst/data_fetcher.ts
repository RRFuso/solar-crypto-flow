import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all external market data by invoking a secure Supabase Edge Function.
 * This function consolidates multiple API calls (Alpha Vantage, Binance, etc.)
 * on the backend, preventing API key exposure on the client-side.
 *
 * @returns {Promise<any>} A promise that resolves with the combined market data.
 */
export async function fetchAllExternalData(): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('secure-market-data-fetcher');

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
    // Re-throw the error to be caught by the calling function, making debugging clearer.
    throw error;
  }
}