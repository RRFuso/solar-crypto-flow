
import ccxt from 'ccxt';

export interface ExchangeConfig {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  additionalParams?: Record<string, any>;
  testMode: boolean;
}

export class ExchangeManager {
  private exchanges: Map<string, any> = new Map();
  
  async initializeExchange(config: ExchangeConfig): Promise<any> {
    try {
      if (!(config.id in ccxt)) {
        throw new Error(`Exchange ${config.id} não suportado`);
      }
      
      const ExchangeClass = (ccxt as any)[config.id];
      const exchange = new ExchangeClass({
        apiKey: config.apiKey,
        secret: config.apiSecret,
        ...config.additionalParams,
        ...(config.testMode ? { testnet: true, sandbox: true } : {})
      });
      
      await exchange.loadMarkets();
      this.exchanges.set(config.id, exchange);
      
      console.log(`Exchange ${config.name} inicializado com sucesso`);
      return exchange;
    } catch (error) {
      console.error(`Erro ao inicializar exchange ${config.id}:`, error);
      throw error;
    }
  }
  
  async fetchBalance(exchangeId: string): Promise<any> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchBalance();
  }
  
  async fetchTicker(exchangeId: string, symbol: string): Promise<any> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchTicker(symbol);
  }
  
  async createOrder(
    exchangeId: string, 
    symbol: string, 
    type: string, 
    side: 'buy' | 'sell', 
    amount: number, 
    price?: number
  ): Promise<any> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.createOrder(symbol, type, side, amount, price);
  }
  
  async fetchOpenOrders(exchangeId: string, symbol?: string): Promise<any> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.fetchOpenOrders(symbol);
  }
  
  async cancelOrder(exchangeId: string, orderId: string, symbol?: string): Promise<any> {
    const exchange = this.getExchange(exchangeId);
    return await exchange.cancelOrder(orderId, symbol);
  }
  
  private getExchange(exchangeId: string): any {
    const exchange = this.exchanges.get(exchangeId);
    if (!exchange) {
      throw new Error(`Exchange ${exchangeId} não inicializado`);
    }
    return exchange;
  }
  
  getSupportedExchanges(): string[] {
    return ['binance', 'coinbase', 'kucoin', 'bybit', 'kraken'];
  }
}

export const exchangeManager = new ExchangeManager();
