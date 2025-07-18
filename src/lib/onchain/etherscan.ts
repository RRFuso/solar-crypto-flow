import { OnChainTransaction, WhaleTransaction, ExchangeFlow, HolderDistribution } from '@/types/onchain';
import { fetchEtherscanData } from '@/services/etherscan';

const chainIdMap: { [key: string]: string } = {
  ethereum: '1',
  bsc: '56',
  arbitrum: '42161',
  optimism: '10',
  polygon: '137',
  avalanche: '43114',
  base: '8453',
  celo: '42220',
  cronos: '25',
  gnosis: '100',
  linea: '59144',
  mantle: '5000',
  'polygon-zkevm': '1101',
  fraxtal: '252',
  sepolia: '11155111',
  holesky: '17000',
  'arbitrum-sepolia': '421614',
  'avalanche-fuji': '43113',
  'base-sepolia': '84532',
  'bsc-testnet': '97',
  // Add other supported chain names and IDs here
};

// Endereços de exchanges conhecidas (exemplo)
export const KNOWN_EXCHANGES = {
  'binance': '0x28c6c06298d514db089934071355e5743bf21d60',
  'kraken': '0x267a5240229152364691a751755323ac272a575f',
  // Adicionar mais exchanges
};

/**
 * Busca as últimas transações de um token ERC-20.
 * @param contractAddress O endereço do contrato do token.
 * @param chain O nome da blockchain (ex: 'ethereum', 'bsc').
 * @param limit O número de transações a buscar.
 * @returns Uma promessa que resolve para uma lista de transações.
 */
export const getERC20TokenTransactions = async (
  contractAddress: string,
  chain: string = 'ethereum',
  limit: number = 100
): Promise<OnChainTransaction[]> => {
  const chainId = chainIdMap[chain.toLowerCase()];
  if (!chainId) {
    console.error(`Unsupported chain: ${chain}`);
    return [];
  }

  try {
    const result = await fetchEtherscanData({
      module: 'account',
      action: 'tokentx',
      contractaddress: contractAddress,
      page: 1,
      offset: limit,
      sort: 'desc',
    }, parseInt(chainId));

    return result as OnChainTransaction[];
  } catch (error) {
    console.error(`Failed to fetch transactions for ${contractAddress} on ${chain}:`, error);
    return [];
  }
};

/**
 * Identifica transações de "baleias" com base em um valor mínimo.
 * @param transactions A lista de transações a serem analisadas.
 * @param minValueThreshold O valor mínimo para ser considerado uma baleia (em ETH).
 * @returns Uma lista de transações de baleias.
 */
export const identifyWhaleTransactions = (
  transactions: OnChainTransaction[],
  minValueThreshold: number = 1000, // Ex: 1000 ETH or BNB
  chain: string = 'ethereum'
): WhaleTransaction[] => {
  const whaleTxs: WhaleTransaction[] = [];
  const decimals = chain.toLowerCase() === 'bsc' ? 1e18 : 1e18; // BNB and ETH have 18 decimals

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
  const exchangeAddresses = Object.values(KNOWN_EXCHANGES);
  const decimals = chain.toLowerCase() === 'bsc' ? 1e18 : 1e18; // BNB and ETH have 18 decimals

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
 * (A ser implementado) Busca a distribuição de detentores de um token.
 * Esta é uma funcionalidade mais complexa que pode exigir um serviço de terceiros ou uma análise mais profunda.
 * @param contractAddress O endereço do contrato do token.
 * @returns A distribuição de detentores.
 */
export const getHolderDistribution = async (
  contractAddress: string
): Promise<HolderDistribution> => {
  // Lógica para buscar distribuição de detentores
  console.log(`Fetching holder distribution for ${contractAddress}`);
  return {
    symbol: 'ETH', // Placeholder
    top10Percentage: 0,
    top50Percentage: 0,
    top100Percentage: 0,
  }; // Placeholder
};
