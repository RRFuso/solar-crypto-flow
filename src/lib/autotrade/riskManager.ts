
import { AutoTradeConfig } from '@/types/autotrade';

export interface OrderParams {
  exchangeId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  strategy: string;
}

export class RiskManager {
  async validateOrder(params: OrderParams, config: AutoTradeConfig): Promise<void> {
    // Verificar se o trading está habilitado
    if (!config.enabled) {
      throw new Error('AutoTrade está desabilitado');
    }
    
    // Verificar limites de posição máxima
    const openPositions = await this.getOpenPositionsCount(params.strategy);
    if (openPositions >= config.riskManagement.maxOpenPositions) {
      throw new Error(`Limite de posições abertas atingido: ${config.riskManagement.maxOpenPositions}`);
    }
    
    // Verificar limite de perda diária
    const dailyLoss = await this.getDailyLoss();
    if (Math.abs(dailyLoss) >= config.riskManagement.maxDailyLoss) {
      throw new Error(`Limite de perda diária atingido: ${config.riskManagement.maxDailyLoss}%`);
    }
    
    // Verificar limite de perda semanal
    const weeklyLoss = await this.getWeeklyLoss();
    if (Math.abs(weeklyLoss) >= config.riskManagement.maxWeeklyLoss) {
      throw new Error(`Limite de perda semanal atingido: ${config.riskManagement.maxWeeklyLoss}%`);
    }
    
    // Verificar horário de trading permitido
    if (!this.isWithinTradingHours(config.riskManagement.allowedTradingHours)) {
      throw new Error('Fora do horário de trading permitido');
    }
    
    console.log('Validação de risco aprovada para ordem:', params.symbol, params.side);
  }
  
  private async getOpenPositionsCount(strategyId: string): Promise<number> {
    // Implementar contagem de posições abertas
    return 0;
  }
  
  private async getDailyLoss(): Promise<number> {
    // Implementar cálculo de perda diária
    return 0;
  }
  
  private async getWeeklyLoss(): Promise<number> {
    // Implementar cálculo de perda semanal
    return 0;
  }
  
  private isWithinTradingHours(allowedHours: { start: string; end: string; timezone: string }): boolean {
    const now = new Date();
    const startTime = new Date(`${now.toDateString()} ${allowedHours.start}`);
    const endTime = new Date(`${now.toDateString()} ${allowedHours.end}`);
    
    return now >= startTime && now <= endTime;
  }
}

export const riskManager = new RiskManager();
