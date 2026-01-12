import { supabase } from '@/integrations/supabase/client';
import { ApiUsageTracker } from './api-usage-tracker';

// Alchemy JSON-RPC interface
interface AlchemyRpcRequest {
  id: number;
  jsonrpc: string;
  method: string;
  params?: any[];
}

interface AlchemyRpcResponse {
  id: number;
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export const fetchAlchemyData = async (
  method: string, 
  params: any[] = [],
  chain: string = 'ethereum'
): Promise<any> => {
  const startTime = performance.now();
  
  try {
    const { data, error } = await supabase.functions.invoke('secure-api-proxy', {
      body: {
        endpoint: 'alchemy',
        chain,
        rpcRequest: {
          id: 1,
          jsonrpc: '2.0',
          method,
          params
        }
      }
    });

    const responseTime = performance.now() - startTime;
    
    // Track request (Alchemy has free tier, then ~$0.0001 per request)
    ApiUsageTracker.trackRequest('alchemy', method, false, responseTime);

    if (error) {
      console.error('Secure API proxy error:', error);
      throw new Error(`API proxy error: ${error.message}`);
    }

    if (data?.error) {
      console.error('Alchemy RPC Error:', data.error);
      throw new Error(`Alchemy API error: ${data.error.message || 'Unknown error'}`);
    }

    return data?.result;
  } catch (error) {
    console.error('Error fetching data from Alchemy API:', error);
    throw error;
  }
};

// Get current block number
export const getBlockNumber = async (chain: string = 'ethereum'): Promise<number> => {
  const result = await fetchAlchemyData('eth_blockNumber', [], chain);
  return parseInt(result, 16);
};

// Get account balance
export const getAccountBalance = async (address: string, chain: string = 'ethereum'): Promise<string> => {
  const result = await fetchAlchemyData('eth_getBalance', [address, 'latest'], chain);
  return result;
};

// Get transaction count (nonce)
export const getTransactionCount = async (address: string, chain: string = 'ethereum'): Promise<number> => {
  const result = await fetchAlchemyData('eth_getTransactionCount', [address, 'latest'], chain);
  return parseInt(result, 16);
};

// Get token balances using Alchemy's Token API
export const getTokenBalances = async (address: string, chain: string = 'ethereum'): Promise<any> => {
  const result = await fetchAlchemyData('alchemy_getTokenBalances', [address], chain);
  return result;
};

// Get asset transfers (transactions) - Alchemy specific method
export const getAssetTransfers = async (
  address: string,
  options: {
    fromBlock?: string;
    toBlock?: string;
    category?: string[];
    maxCount?: number;
    order?: 'asc' | 'desc';
  } = {},
  chain: string = 'ethereum'
): Promise<any[]> => {
  const params = {
    fromBlock: options.fromBlock || '0x0',
    toBlock: options.toBlock || 'latest',
    category: options.category || ['external', 'erc20', 'erc721', 'erc1155'],
    withMetadata: true,
    maxCount: options.maxCount ? `0x${options.maxCount.toString(16)}` : '0x64', // default 100
    order: options.order || 'desc',
    fromAddress: address
  };

  const result = await fetchAlchemyData('alchemy_getAssetTransfers', [params], chain);
  return result?.transfers || [];
};

// Get ERC-20 token transfers for a specific address
export const getERC20Transfers = async (
  address: string,
  options: {
    contractAddress?: string;
    fromBlock?: string;
    toBlock?: string;
    maxCount?: number;
  } = {},
  chain: string = 'ethereum'
): Promise<any[]> => {
  const params: any = {
    fromBlock: options.fromBlock || '0x0',
    toBlock: options.toBlock || 'latest',
    category: ['erc20'],
    withMetadata: true,
    maxCount: options.maxCount ? `0x${options.maxCount.toString(16)}` : '0x64',
    order: 'desc',
    fromAddress: address
  };

  if (options.contractAddress) {
    params.contractAddresses = [options.contractAddress];
  }

  const result = await fetchAlchemyData('alchemy_getAssetTransfers', [params], chain);
  return result?.transfers || [];
};

// Get token metadata
export const getTokenMetadata = async (contractAddress: string, chain: string = 'ethereum'): Promise<any> => {
  const result = await fetchAlchemyData('alchemy_getTokenMetadata', [contractAddress], chain);
  return result;
};

// Get logs (events)
export const getLogs = async (
  filter: {
    address?: string;
    topics?: (string | null)[];
    fromBlock?: string;
    toBlock?: string;
  },
  chain: string = 'ethereum'
): Promise<any[]> => {
  const result = await fetchAlchemyData('eth_getLogs', [filter], chain);
  return result || [];
};

// Get transaction by hash
export const getTransactionByHash = async (txHash: string, chain: string = 'ethereum'): Promise<any> => {
  const result = await fetchAlchemyData('eth_getTransactionByHash', [txHash], chain);
  return result;
};

// Get transaction receipt
export const getTransactionReceipt = async (txHash: string, chain: string = 'ethereum'): Promise<any> => {
  const result = await fetchAlchemyData('eth_getTransactionReceipt', [txHash], chain);
  return result;
};
