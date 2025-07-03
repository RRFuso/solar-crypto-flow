
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { performanceAnalytics, PerformanceMetrics, TradeRecord } from '@/lib/autotrade/analytics';
import { BarChart3, TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AdvancedAnalyticsProps {
  trades: TradeRecord[];
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ trades = [] }) => {
  const [timeframe, setTimeframe] = useState('30d');
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    if (trades.length > 0) {
      const calculatedMetrics = performanceAnalytics.calculatePerformanceMetrics(trades, timeframe);
      setMetrics(calculatedMetrics);
    }
  }, [trades, timeframe]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (!metrics) {
    return (
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sem Dados Suficientes</h3>
          <p className="text-slate-400">
            Execute algumas operações para ver a análise de performance
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Timeframe */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Analytics Avançado</span>
            </CardTitle>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="1y">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-sm text-slate-400">Win Rate</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatPercentage(metrics.winRate)}</p>
            <p className="text-xs text-slate-400">{metrics.winningTrades}/{metrics.totalTrades} trades</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-400">Profit Factor</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400">Lucro/Perda</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm text-slate-400">Max Drawdown</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatPercentage(metrics.maxDrawdown)}</p>
            <p className="text-xs text-slate-400">Maior queda</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-slate-400">Sharpe Ratio</span>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.sharpeRatio.toFixed(2)}</p>
            <p className="text-xs text-slate-400">
              <Badge variant={metrics.sharpeRatio > 1 ? 'default' : 'secondary'}>
                {metrics.sharpeRatio > 1 ? 'Bom' : 'Regular'}
              </Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Retornos Cumulativos */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Retornos Cumulativos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.cumulativeReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#F3F4F6'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Retorno']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="return" 
                stroke="#F97316" 
                strokeWidth={2}
                name="Retorno Cumulativo"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Mensal */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Performance Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#F3F4F6'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Retorno']}
              />
              <Bar 
                dataKey="return" 
                fill="#F97316"
                name="Retorno Mensal"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Estatísticas de Ganhos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Média de Ganhos:</span>
              <span className="text-green-400">{formatCurrency(metrics.averageProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Maior Ganho:</span>
              <span className="text-green-400">{formatCurrency(metrics.largestWin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total de Ganhos:</span>
              <span className="text-green-400">{metrics.winningTrades} trades</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Estatísticas de Perdas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Média de Perdas:</span>
              <span className="text-red-400">{formatCurrency(metrics.averageLoss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Maior Perda:</span>
              <span className="text-red-400">{formatCurrency(metrics.largestLoss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total de Perdas:</span>
              <span className="text-red-400">{metrics.losingTrades} trades</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
