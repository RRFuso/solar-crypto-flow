import { supabase } from '@/integrations/supabase/client';
import { ApiUsageTracker } from './api-usage-tracker';

export const fetchEtherscanData = async (params: Record<string, any>, chainId: number) => {
  const startTime = performance.now();
  const endpoint = `${params.module}/${params.action}`;
  
  try {
    const { data, error } = await supabase.functions.invoke('secure-api-proxy', {
      body: {
        endpoint: 'etherscan',
        params: {
          ...params,
          chainid: chainId
        }
      }
    });

    const responseTime = performance.now() - startTime;
    
    // Track request (Etherscan costs ~$0.0005 per request)
    ApiUsageTracker.trackRequest('etherscan', endpoint, false, responseTime);

    if (error) {
      console.error('Secure API proxy error:', error);
      throw new Error(`API proxy error: ${error.message}`);
    }

    if (data?.status === '1') {
      return data.result;
    } else {
      console.error('Etherscan API Error:', data?.message);
      throw new Error(`Etherscan API error: ${data?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error fetching data from Etherscan API:', error);
    throw error;
  }
};

export const getAccountBalance = async (address: string, chainId: number) => {
  return fetchEtherscanData({
    module: 'account',
    action: 'balance',
    address,
    tag: 'latest',
  }, chainId);
};

export const getNormalTransactions = async (address: string, chainId: number, startblock: number = 0, endblock: number = 99999999, sort: 'asc' | 'desc' = 'asc') => {
  return fetchEtherscanData({
    module: 'account',
    action: 'txlist',
    address,
    startblock,
    endblock,
    sort,
  }, chainId);
};

export const getERC20TokenTransfers = async (address: string, chainId: number, startblock: number = 0, endblock: number = 99999999, sort: 'asc' | 'desc' = 'asc') => {
  return fetchEtherscanData({
    module: 'account',
    action: 'tokentx',
    address,
    startblock,
    endblock,
    sort,
  }, chainId)
};
