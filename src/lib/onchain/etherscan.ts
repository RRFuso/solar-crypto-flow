import { OnChainTransaction, WhaleTransaction, ExchangeFlow, HolderDistribution } from '@/types/onchain';

const UNIFIED_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || 'YOUR_UNIFIED_API_KEY';
const UNIFIED_API_URL = 'https://api.etherscan.io/v2/api';

// Mapeamento de nomes de cadeia para IDs de cadeia (extraído do DefiLlama/chainlist)
const CHAIN_IDS: { [key: string]: number } = {
  "ethereum": 1,
  "ubiq": 8,
  "optimism": 10,
  "flare": 14,
  "songbird": 19,
  "elastos": 20,
  "kardia": 24,
  "cronos": 25,
  "rsk": 30,
  "telos": 40,
  "lukso": 42,
  "crab": 44,
  "darwinia": 46,
  "xdc": 50,
  "csc": 52,
  "zyx": 55,
  "binance": 56,
  "syscoin": 57,
  "gochain": 60,
  "ethereumclassic": 61,
  "okexchain": 66,
  "hoo": 70,
  "meter": 82,
  "nova network": 87,
  "tomochain": 88,
  "bitkub": 96,
  "xdai": 100,
  "velas": 106,
  "thundercore": 108,
  "enuls": 119,
  "fuse": 122,
  "heco": 128,
  "unichain": 130,
  "polygon": 137,
  "sonic": 146,
  "shimmer_evm": 148,
  "rbn": 151,
  "omni": 166,
  "manta": 169,
  "hsk": 177,
  "water": 181,
  "xlayer": 196,
  "xdaiarb": 200,
  "op_bnb": 204,
  "vinuchain": 207,
  "lc": 232,
  "energyweb": 246,
  "oasys": 248,
  "fantom": 250,
  "fraxtal": 252,
  "hpb": 269,
  "boba": 288,
  "hbar": 295,
  "omax": 311,
  "filecoin": 314,
  "kucoin": 321,
  "zksync era": 324,
  "shiden": 336,
  "theta": 361,
  "pulse": 369,
  "cronos zkevm": 388,
  "sx": 416,
  "areon": 463,
  "form network": 478,
  "wc": 480,
  "candle": 534,
  "rollux": 570,
  "astar": 592,
  "redstone": 690,
  "matchain": 698,
  "callisto": 820,
  "tara": 841,
  "wanchain": 888,
  "lyra chain": 957,
  "bifrost": 996,
  "hyperliquid": 999,
  "conflux": 1030,
  "metis": 1088,
  "dymension": 1100,
  "polygon zkevm": 1101,
  "core": 1116,
  "lisk": 1135,
  "ultron": 1231,
  "step": 1234,
  "moonbeam": 1284,
  "moonriver": 1285,
  "sei": 1329,
  "living assets mainnet": 1440,
  "sty": 1514,
  "tenet": 1559,
  "gravity": 1625,
  "reya network": 1729,
  "soneium": 1868,
  "swellchain": 1923,
  "onus": 1975,
  "hubblenet": 1992,
  "sanko": 1996,
  "dogechain": 2000,
  "milkomeda": 2001,
  "milkomeda_a1": 2002,
  "kava": 2222,
  "soma": 2332,
  "karak": 2410,
  "abstract": 2741,
  "morph": 2818,
  "move": 3073,
  "crossfi": 4158,
  "beam": 4337,
  "iotex": 4689,
  "mantle": 5000,
  "skate": 5050,
  "superseed": 5330,
  "nahmii": 5551,
  "bouncebit": 6001,
  "mtt network": 6880,
  "nibiru": 6900,
  "tombchain": 6969,
  "zetachain": 7000,
  "planq": 7070,
  "bitrock": 7171,
  "xsat": 7200,
  "cyeth": 7560,
  "canto": 7700,
  "klaytn": 8217,
  "that": 8428,
  "base": 8453,
  "hela": 8668,
  "iotaevm": 8822,
  "jbc": 8899,
  "evmos": 9001,
  "carbon": 9790,
  "smartbch": 10000,
  "artela": 11820,
  "immutable zkevm": 13371,
  "loop": 15551,
  "genesys": 16507,
  "eos evm": 17777,
  "map protocol": 22776,
  "sapphire": 23294,
  "bitgert": 32520,
  "fusion": 32659,
  "zilliqa": 32769,
  "apechain": 33139,
  "edu chain": 41923,
  "arbitrum": 42161,
  "arbitrum nova": 42170,
  "celo": 42220,
  "oasis": 42262,
  "assetchain": 42420,
  "etherlink": 42793,
  "hemi": 43111,
  "avalanche": 43114,
  "rei": 47805,
  "zircuit": 48900,
  "sophon": 50104,
  "etn": 52014,
  "superposition": 55244,
  "reichain": 55555,
  "boba_bnb": 56288,
  "ink": 57073,
  "linea": 59144,
  "bob": 60808,
  "godwoken": 71402,
  "berachain": 80094,
  "blast": 81457,
  "chiliz": 88888,
  "plume": 98866,
  "stratis": 105105,
  "real": 111188,
  "odyssey": 153153,
  "taiko": 167000,
  "bitlayer": 200901,
  "hydradx": 222222,
  "parex": 322202,
  "polis": 333999,
  "kekchain": 420420,
  "scroll": 534352,
  "zero_network": 543210,
  "winr": 777777,
  "zklink nova": 810180,
  "vision": 888888,
  "saakuru": 7225878,
  "zora": 7777777,
  "xphere": 20250217,
  "corn": 21000000,
  "neon": 245022934,
  "lumia": 994873017,
  "aurora": 1313161554,
  "harmony": 1666600000,
  "palm": 11297108109,
  "zeniq": 383414847825,
  "curio": 836542336838601,
};

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
  chain: string = 'ethereum',
  limit: number = 100
): Promise<OnChainTransaction[]> => {
  const chainId = CHAIN_IDS[chain.toLowerCase()];

  if (!chainId) {
    console.error(`Unsupported chain: ${chain}. Please add it to CHAIN_IDS mapping.`);
    return [];
  }

  const url = `${UNIFIED_API_URL}?chainid=${chainId}&module=account&action=tokentx&contractaddress=${contractAddress}&page=1&offset=${limit}&sort=desc&apikey=${UNIFIED_API_KEY}`;
  console.log(`Fetching unified API URL:`, url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Unified API Response:`, data);

    if (data.status === '0') {
      throw new Error(`Unified API error: ${data.message}`);
    }

    return data.result as OnChainTransaction[];
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