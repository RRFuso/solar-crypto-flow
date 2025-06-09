
import { exchangeManager } from './exchanges';
import { riskManager, OrderParams } from './riskManager';
import { AutoTradeConfig } from '@/types/autotrade';
import { toast } from 'sonner';

export class OrderExecutor {
  async executeOrder(params: OrderParams, config: AutoTradeConfig): Promise<any> {
    try {
      // 1. Validar parâmetros da ordem
      this.validateOrderParams(params);
      
      // 2. Verificar limites de risco
      await riskManager.validateOrder(params, config);
      
      // 3. Executar a ordem principal
      const order = await exchangeManager.createOrder(
        params.exchangeId,
        params.symbol,
        params.type,
        params.side,
        params.amount,
        params.price
      );
      
      // 4. Registrar a ordem
      await this.logOrder(order, params);
      
      // 5. Configurar stop loss e take profit se necessário
      if ((order.status === 'closed' || order.status === 'open') && 
          (params.stopLoss || params.takeProfit)) {
        await this.setupStopLossAndTakeProfit(order, params);
      }
      
      console.log(`Ordem executada: ${params.side} ${params.amount} ${params.symbol} a ${params.price || 'preço de mercado'}`);
      
      toast.success(`Ordem executada: ${params.side.toUpperCase()} ${params.symbol}`, {
        description: `${params.amount} a ${params.price || 'preço de mercado'}`
      });
      
      return order;
    } catch (error) {
      console.error(`Erro ao executar ordem: ${error.message}`);
      toast.error('Erro ao executar ordem', {
        description: error.message
      });
      throw error;
    }
  }
  
  private validateOrderParams(params: OrderParams): void {
    if (!params.exchangeId) throw new Error('Exchange ID é obrigatório');
    if (!params.symbol) throw new Error('Symbol é obrigatório');
    if (!params.side) throw new Error('Side é obrigatório');
    if (!params.type) throw new Error('Type é obrigatório');
    if (!params.amount || params.amount <= 0) throw new Error('Amount deve ser maior que zero');
    if (params.type === 'limit' && (!params.price || params.price <= 0)) {
      throw new Error('Price é obrigatório para ordens limit');
    }
  }
  
  private async logOrder(order: any, params: OrderParams): Promise<void> {
    console.log('Registrando ordem:', {
      orderId: order.id,
      symbol: params.symbol,
      side: params.side,
      amount: params.amount,
      price: order.price,
      strategy: params.strategy,
      timestamp: Date.now()
    });
  }
  
  private async setupStopLossAndTakeProfit(order: any, params: OrderParams): Promise<void> {
    try {
      if (params.stopLoss) {
        await exchangeManager.createOrder(
          params.exchangeId,
          params.symbol,
          'stop',
          params.side === 'buy' ? 'sell' : 'buy',
          params.amount,
          params.stopLoss
        );
        console.log(`Stop loss configurado em ${params.stopLoss}`);
      }
      
      if (params.takeProfit) {
        await exchangeManager.createOrder(
          params.exchangeId,
          params.symbol,
          'limit',
          params.side === 'buy' ? 'sell' : 'buy',
          params.amount,
          params.takeProfit
        );
        console.log(`Take profit configurado em ${params.takeProfit}`);
      }
    } catch (error) {
      console.error('Erro ao configurar stop loss/take profit:', error);
    }
  }
}

export const orderExecutor = new OrderExecutor();
