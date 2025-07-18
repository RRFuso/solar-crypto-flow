import axios from 'axios';

const ETHERSCAN_API_BASE_URL = 'https://api.etherscan.io/v2/api';
const ETHERSCAN_API_KEY = '9HGIH5R2UJE3X6Y54QP6XH93SA6TTM977D'; // Your single Etherscan V2 API key

export const fetchEtherscanData = async (params: Record<string, any>, chainId: number) => {
  try {
    const response = await axios.get(ETHERSCAN_API_BASE_URL, {
      params: {
        ...params,
        apikey: ETHERSCAN_API_KEY,
        chainid: chainId, // Pass the chainId for V2 API
      },
    });
    if (response.data.status === '1') {
      return response.data.result;
    } else {
      console.error(`Etherscan API Error:`, response.data.message);
      throw new Error(`Etherscan API error: ${response.data.message}`);
    }
  } catch (error) {
    console.error(`Error fetching data from Etherscan API:`, error);
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
  }, chainId);
};
