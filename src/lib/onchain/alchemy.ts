import { OnChainTransaction, WhaleTransaction, ExchangeFlow, HolderDistribution } from '@/types/onchain';
import { 
  getAssetTransfers, 
  getERC20Transfers, 
  getTokenBalances,
  getBlockNumber 
} from '@/services/alchemy';

// Endereços de exchanges conhecidas (exemplo)
export const KNOWN_EXCHANGES: { [key: string]: string } = {
  'binance': '0x28c6c06298d514db089934071355e5743bf21d60',
  'kraken': '0x267a5240229152364691a751755323ac272a575f',
  'coinbase': '0x71660c4005ba85c37ccec55d0c4493e66fe775d3',
  'ftx': '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2',
  'kucoin': '0xd6216fc19db775df9774a6e33526131da7d19a2c',
};

/**
 * Busca as últimas transações de um token usando Alchemy.
 * @param contractAddress O endereço do contrato do token.
 * @param chain O nome da blockchain (ex: 'ethereum', 'polygon').
 * @param limit O número de transações a buscar.
 * @returns Uma promessa que resolve para uma lista de transações.
 */
export const getERC20TokenTransactions = async (
  contractAddress: string,
  chain: string = 'ethereum',
  limit: number = 100
): Promise<OnChainTransaction[]> => {
  try {
    // Use Alchemy's getAssetTransfers for ERC20 transactions
    const transfers = await getAssetTransfers(
      contractAddress,
      {
        category: ['erc20'],
        maxCount: limit,
        order: 'desc'
      },
      chain
    );

    // Transform Alchemy response to OnChainTransaction format
    return transfers.map((transfer: any) => ({
      blockNumber: transfer.blockNum,
      timeStamp: Math.floor(new Date(transfer.metadata?.blockTimestamp || Date.now()).getTime() / 1000).toString(),
      hash: transfer.hash,
      from: transfer.from,
      to: transfer.to,
      value: transfer.value?.toString() || '0',
      tokenName: transfer.asset || '',
      tokenSymbol: transfer.asset || '',
      tokenDecimal: '18',
      gas: '0',
      gasPrice: '0',
      gasUsed: '0',
      contractAddress: transfer.rawContract?.address || contractAddress
    }));
  } catch (error) {
    console.error(`Failed to fetch transactions for ${contractAddress} on ${chain}:`, error);
    return [];
  }
};

/**
 * Busca transações recebidas por um endereço usando Alchemy.
 * @param address O endereço da carteira.
 * @param chain O nome da blockchain.
 * @param limit O número de transações a buscar.
 */
export const getIncomingTransfers = async (
  address: string,
  chain: string = 'ethereum',
  limit: number = 100
): Promise<OnChainTransaction[]> => {
  try {
    const transfers = await getAssetTransfers(
      address,
      {
        category: ['external', 'erc20'],
        maxCount: limit,
        order: 'desc'
      },
      chain
    );

    return transfers.map((transfer: any) => ({
      blockNumber: transfer.blockNum,
      timeStamp: Math.floor(new Date(transfer.metadata?.blockTimestamp || Date.now()).getTime() / 1000).toString(),
      hash: transfer.hash,
      from: transfer.from,
      to: transfer.to,
      value: transfer.value?.toString() || '0',
      tokenName: transfer.asset || 'ETH',
      tokenSymbol: transfer.asset || 'ETH',
      tokenDecimal: '18',
      gas: '0',
      gasPrice: '0',
      gasUsed: '0',
      contractAddress: transfer.rawContract?.address || ''
    }));
  } catch (error) {
    console.error(`Failed to fetch incoming transfers for ${address} on ${chain}:`, error);
    return [];
  }
};

/**
 * Identifica transações de "baleias" com base em um valor mínimo.
 * @param transactions A lista de transações a serem analisadas.
 * @param minValueThreshold O valor mínimo para ser considerado uma baleia (em ETH/tokens).
 * @returns Uma lista de transações de baleias.
 */
export const identifyWhaleTransactions = (
  transactions: OnChainTransaction[],
  minValueThreshold: number = 1000, // Ex: 1000 tokens/ETH
  chain: string = 'ethereum'
): WhaleTransaction[] => {
  const whaleTxs: WhaleTransaction[] = [];
  const decimals = 1e18; // Most tokens use 18 decimals

  for (const tx of transactions) {
    const value = parseFloat(tx.value) / decimals;

    if (value >= minValueThreshold) {
      whaleTxs.push({
        ...tx,
        isWhale: true,
      });
    }
  }

  return whaleTxs;
};

/**
 * Calcula o fluxo líquido de um token para/de exchanges conhecidas.
 * @param transactions A lista de transações a serem analisadas.
 * @param symbol O símbolo do token.
 * @returns O fluxo de exchange calculado.
 */
export const calculateExchangeFlow = (
  transactions: OnChainTransaction[],
  symbol: string,
  chain: string = 'ethereum'
): ExchangeFlow => {
  let inflow = 0;
  let outflow = 0;
  const exchangeAddresses = Object.values(KNOWN_EXCHANGES).map(a => a.toLowerCase());
  const decimals = 1e18;

  for (const tx of transactions) {
    const value = parseFloat(tx.value) / decimals;

    if (exchangeAddresses.includes(tx.to.toLowerCase())) {
      inflow += value;
    } else if (exchangeAddresses.includes(tx.from.toLowerCase())) {
      outflow += value;
    }
  }

  return {
    symbol,
    timestamp: Date.now(),
    netFlow: inflow - outflow,
    inflow,
    outflow,
  };
};

/**
 * Busca os balances de tokens de um endereço usando Alchemy.
 * @param address O endereço da carteira.
 * @param chain O nome da blockchain.
 */
export const getWalletTokenBalances = async (
  address: string,
  chain: string = 'ethereum'
): Promise<any> => {
  try {
    const balances = await getTokenBalances(address, chain);
    return balances;
  } catch (error) {
    console.error(`Failed to fetch token balances for ${address}:`, error);
    return null;
  }
};

/**
 * Busca o número do bloco atual.
 * @param chain O nome da blockchain.
 */
export const getCurrentBlockNumber = async (chain: string = 'ethereum'): Promise<number> => {
  try {
    return await getBlockNumber(chain);
  } catch (error) {
    console.error('Failed to fetch block number:', error);
    return 0;
  }
};

/**
 * (Placeholder) Busca a distribuição de detentores de um token.
 * @param contractAddress O endereço do contrato do token.
 * @returns A distribuição de detentores.
 */
export const getHolderDistribution = async (
  contractAddress: string
): Promise<HolderDistribution> => {
  console.log(`Fetching holder distribution for ${contractAddress}`);
  return {
    symbol: 'ETH',
    top10Percentage: 0,
    top50Percentage: 0,
    top100Percentage: 0,
  };
};
