
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompletedTrade } from '@/types/autotrade';
import { TrendingUp, TrendingDown, Target, Shield, BarChart3, PieChart } from 'lucide-react';

interface PerformanceMetricsProps {
  performance: {
    totalPnl: number;
    totalPnlPercentage: number;
    dailyPnl: number;
    weeklyPnl: number;
    winRate: number;
    totalTrades: number;
  };
  trades?: CompletedTrade[];
  detailed?: boolean;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  performance,
  trades = [],
  detailed = false
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);
  
  const avgWin = winningTrades.length > 0 ? 
    winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? 
    Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0;
  
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

  const bestTrade = trades.length > 0 ? 
    trades.reduce((best, current) => current.pnl > best.pnl ? current : best) : null;
  const worstTrade = trades.length > 0 ? 
    trades.reduce((worst, current) => current.pnl < worst.pnl ? current : worst) : null;

  interface MetricCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
    change?: number;
  }

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = 'text-white',
    change
  }: MetricCardProps) => (
    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
      <div className="flex items-center space-x-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-slate-400">{title}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      {change && (
        <div className="flex items-center space-x-1 mt-1">
          {change > 0 ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className={`text-xs ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(change).toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Performance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={TrendingUp}
              title="Total P&L"
              value={formatCurrency(performance.totalPnl)}
              subtitle={`${performance.totalPnlPercentage.toFixed(2)}%`}
              color={performance.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}
            />
            
            <MetricCard
              icon={Target}
              title="Win Rate"
              value={`${performance.winRate.toFixed(1)}%`}
              subtitle={`${performance.totalTrades} total trades`}
              color="text-blue-500"
            />
            
            <MetricCard
              icon={Shield}
              title="Daily P&L"
              value={formatCurrency(performance.dailyPnl)}
              color={performance.dailyPnl >= 0 ? 'text-green-500' : 'text-red-500'}
            />
            
            <MetricCard
              icon={PieChart}
              title="Weekly P&L"
              value={formatCurrency(performance.weeklyPnl)}
              color={performance.weeklyPnl >= 0 ? 'text-green-500' : 'text-red-500'}
            />
          </div>
        </CardContent>
      </Card>

      {detailed && trades.length > 0 && (
        <>
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={TrendingUp}
                  title="Average Win"
                  value={formatCurrency(avgWin)}
                  subtitle={`${winningTrades.length} winning trades`}
                  color="text-green-500"
                />
                
                <MetricCard
                  icon={TrendingDown}
                  title="Average Loss"
                  value={formatCurrency(avgLoss)}
                  subtitle={`${losingTrades.length} losing trades`}
                  color="text-red-500"
                />
                
                <MetricCard
                  icon={Target}
                  title="Profit Factor"
                  value={profitFactor.toFixed(2)}
                  subtitle={profitFactor > 1 ? 'Profitable' : 'Unprofitable'}
                  color={profitFactor > 1 ? 'text-green-500' : 'text-red-500'}
                />
                
                <MetricCard
                  icon={BarChart3}
                  title="Trade Volume"
                  value={trades.length.toString()}
                  subtitle="Total executed"
                  color="text-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Best & Worst Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bestTrade && (
                  <div className="p-4 bg-green-900/20 rounded-lg border border-green-700/30">
                    <h4 className="font-medium text-green-400 mb-2">Best Trade</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-white">{bestTrade.symbol} {bestTrade.side}</p>
                      <p className="text-green-400">{formatCurrency(bestTrade.pnl)}</p>
                      <p className="text-slate-400">
                        {new Date(bestTrade.entryTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                {worstTrade && (
                  <div className="p-4 bg-red-900/20 rounded-lg border border-red-700/30">
                    <h4 className="font-medium text-red-400 mb-2">Worst Trade</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-white">{worstTrade.symbol} {worstTrade.side}</p>
                      <p className="text-red-400">{formatCurrency(worstTrade.pnl)}</p>
                      <p className="text-slate-400">
                        {new Date(worstTrade.entryTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trades.slice(-10).reverse().map(trade => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700/30"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant={trade.side === 'long' ? 'default' : 'destructive'}>
                        {trade.symbol}
                      </Badge>
                      <span className="text-sm text-slate-400">
                        {new Date(trade.entryTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {formatCurrency(trade.pnl)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {trade.pnlPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
