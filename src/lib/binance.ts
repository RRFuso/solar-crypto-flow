const BINANCE_API_URL = 'https://api.binance.com/api/v3';

export const binanceApi = {
  async getTickerPrice() {
    const response = await fetch(`${BINANCE_API_URL}/ticker/price`);
    return response.json();
  },

  async get24hrTickerPrice() {
    const response = await fetch(`${BINANCE_API_URL}/ticker/24hr`);
    return response.json();
  }
};