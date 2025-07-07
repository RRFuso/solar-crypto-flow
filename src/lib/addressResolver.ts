
import { CoinGeckoClient, CoinGeckoSearchResponse, CoinGeckoCoinDetailsResponse } from './api/coingecko';

interface ContractAddressCache {
  [symbol: string]: {
    address: string;
    timestamp: number;
  };
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const contractAddressCache: ContractAddressCache = {};

export async function getContractAddress(symbol: string): Promise<string | null> {
  const normalizedSymbol = symbol.toLowerCase();

  // Check cache first
  const cached = contractAddressCache[normalizedSymbol];
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION_MS)) {
    console.log(`[AddressResolver] Cache hit for ${symbol}: ${cached.address}`);
    return cached.address;
  }

  try {
    // Fetch from CoinGecko API
    console.log(`[AddressResolver] Fetching contract address for ${symbol} from CoinGecko...`);
    const client = new CoinGeckoClient();
    const data: CoinGeckoSearchResponse = await client.searchCoin(normalizedSymbol);

    if (data && data.coins && data.coins.length > 0) {
      // Find the exact match by symbol or id
      const coin = data.coins.find(c => c.symbol.toLowerCase() === normalizedSymbol || c.id.toLowerCase() === normalizedSymbol);

      if (coin) {
        // Now fetch the coin details to get contract address
        const coinDetails: CoinGeckoCoinDetailsResponse = await client.getCoinDetails(coin.id);
        if (coinDetails && coinDetails.platforms && coinDetails.platforms.ethereum) {
          const address = coinDetails.platforms.ethereum;
          contractAddressCache[normalizedSymbol] = { address, timestamp: Date.now() };
          console.log(`[AddressResolver] Found address for ${symbol}: ${address}`);
          return address;
        }
      }
    }
    console.warn(`[AddressResolver] No contract address found for ${symbol} on Ethereum.`);
    return null;
  } catch (error) {
    console.error(`[AddressResolver] Error fetching contract address for ${symbol}:`, error);
    return null;
  }
}
