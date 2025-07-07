
export interface CoinGeckoCoin {
  id: string;
  name: string;
  symbol: string;
}

export interface CoinGeckoSearchResponse {
  coins: CoinGeckoCoin[];
}

export interface CoinGeckoCoinDetailsResponse {
  id: string;
  symbol: string;
  name: string;
  platforms: {
    ethereum?: string; // Contract address for Ethereum
    [key: string]: string | undefined; // Other platforms
  };
}

export class CoinGeckoClient {
  private baseUrl = 'https://api.coingecko.com/api/v3';

  async searchCoin(query: string): Promise<CoinGeckoSearchResponse> {
    const response = await fetch(`${this.baseUrl}/search?query=${query}`);
    if (!response.ok) {
      throw new Error(`CoinGecko search failed: ${response.statusText}`);
    }
    return response.json();
  }

  async getCoinDetails(id: string): Promise<CoinGeckoCoinDetailsResponse> {
    const response = await fetch(`${this.baseUrl}/coins/${id}`);
    if (!response.ok) {
      throw new Error(`CoinGecko get coin details failed: ${response.statusText}`);
    }
    return response.json();
  }
}
