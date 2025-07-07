
import { OnChainTransaction, WhaleTransaction, ExchangeFlow, HolderDistribution } from '@/types/onchain';

const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || 'YOUR_ETHERSCAN_API_KEY';
const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';

// Endereços de exchanges conhecidas (exemplo)
const KNOWN_EXCHANGES = {
  'binance': '0x28c6c06298d514db089934071355e5743bf21d60',
  'kraken': '0x267a5240229152364691a751755323ac272a575f',
  // Adicionar mais exchanges
};

/**
 * Busca as últimas transações de um token ERC-20.
 * @param contractAddress O endereço do contrato do token.
 * @param limit O número de transações a buscar.
 * @returns Uma promessa que resolve para uma lista de transações.
 */
export const getERC20TokenTransactions = async (
  contractAddress: string,
  limit: number = 100
): Promise<OnChainTransaction[]> => {
  const url = `${ETHERSCAN_API_URL}?module=account&action=tokentx&contractaddress=${contractAddress}&page=1&offset=${limit}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.status === '0') {
      // Etherscan API returns status '0' for errors, with a message
      throw new Error(`Etherscan API error: ${data.message}`);
    }

    return data.result as OnChainTransaction[];
  } catch (error) {
    console.error(`Failed to fetch transactions for ${contractAddress}:`, error);
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
  minValueThreshold: number = 1000 // Ex: 1000 ETH
): WhaleTransaction[] => {
  const whaleTxs: WhaleTransaction[] = [];

  for (const tx of transactions) {
    const valueInEth = parseFloat(tx.value) / 1e18; // Converter de Wei para ETH

    if (valueInEth >= minValueThreshold) {
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
  symbol: string
): ExchangeFlow => {
  let inflow = 0;
  let outflow = 0;
  const exchangeAddresses = Object.values(KNOWN_EXCHANGES);

  for (const tx of transactions) {
    const valueInEth = parseFloat(tx.value) / 1e18;

    if (exchangeAddresses.includes(tx.to.toLowerCase())) {
      inflow += valueInEth;
    } else if (exchangeAddresses.includes(tx.from.toLowerCase())) {
      outflow += valueInEth;
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
