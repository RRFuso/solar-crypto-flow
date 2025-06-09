
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradingStrategy, BacktestResult } from '@/types/autotrade';
import { Backtester } from '@/lib/autotrade/backtester';
import { Play, BarChart3, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BacktestRunnerProps {
  strategies: TradingStrategy[];
}

export const BacktestRunner: React.FC<BacktestRunnerProps> = ({ strategies }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(null);

  const handleRunBacktest = async () => {
    if (!selectedStrategy) {
      toast.error('Please select a strategy');
      return;
    }

    const strategy = strategies.find(s => s.id === selectedStrategy);
    if (!strategy) {
      toast.error('Strategy not found');
      return;
    }

    setIsRunning(true);
    try {
      // Mock historical data for demonstration
      const mockHistoricalData = new Map();
      strategy.symbols.forEach(symbol => {
        mockHistoricalData.set(symbol, generateMockHistoricalData(startDate, endDate));
      });

      const result = await Backtester.runBacktest(
        strategy,
        mockHistoricalData,
        new Date(startDate),
        new Date(endDate),
        initialCapital
      );

      setResults(result);
      toast.success('Backtest completed successfully');
    } catch (error) {
      console.error('Backtest error:', error);
      toast.error('Backtest failed');
    } finally {
      setIsRunning(false);
    }
  };

  const generateMockHistoricalData = (start: string, end: string) => {
    const data = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      data.push({
        symbol: 'BTC',
        date: currentDate.toISOString(),
        price: 50000 + (Math.random() - 0.5) * 10000,
        volume: 1000000 + Math.random() * 500000,
        high: 52000,
        low: 48000,
        priceChange24h: (Math.random() - 0.5) * 10
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Strategy Backtesting</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="strategy">Strategy</Label>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map(strategy => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="capital">Initial Capital</Label>
              <Input
                id="capital"
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(parseFloat(e.target.value))}
                placeholder="10000"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleRunBacktest}
              disabled={isRunning || !selectedStrategy}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Running Backtest...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Backtest Results</CardTitle>
              <div className="text-sm text-slate-400">
                Strategy: {results.strategy.name} | 
                Period: {new Date(results.period.start).toLocaleDateString()} - {new Date(results.period.end).toLocaleDateString()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-slate-400">Total Return</span>
                  </div>
                  <p className={`text-xl font-bold ${
                    results.metrics.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {results.metrics.totalReturn.toFixed(2)}%
                  </p>
                  <p className="text-sm text-slate-400">
                    {formatCurrency(initialCapital * (1 + results.metrics.totalReturn / 100))}
                  </p>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-slate-400">Win Rate</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {results.metrics.winRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-slate-400">
                    {results.metrics.totalTrades} trades
                  </p>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-slate-400">Max Drawdown</span>
                  </div>
                  <p className="text-xl font-bold text-red-400">
                    {results.metrics.maxDrawdown.toFixed(2)}%
                  </p>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-slate-400">Sharpe Ratio</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {results.metrics.sharpeRatio.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Profit Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Average Win:</span>
                      <span className="text-green-400">{formatCurrency(results.metrics.avgWin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Average Loss:</span>
                      <span className="text-red-400">{formatCurrency(results.metrics.avgLoss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profit Factor:</span>
                      <span className="text-white">{results.metrics.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Trade Distribution</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Winning Trades:</span>
                      <span className="text-green-400">
                        {Math.round(results.metrics.totalTrades * results.metrics.winRate / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Losing Trades:</span>
                      <span className="text-red-400">
                        {results.metrics.totalTrades - Math.round(results.metrics.totalTrades * results.metrics.winRate / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Trades:</span>
                      <span className="text-white">{results.metrics.totalTrades}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {results.trades.length > 0 && (
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Trade History (Last 20)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.trades.slice(-20).reverse().map(trade => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700/30"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-medium">{trade.symbol}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          trade.side === 'long' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                        }`}>
                          {trade.side.toUpperCase()}
                        </span>
                        <span className="text-slate-400 text-sm">
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
          )}
        </div>
      )}
    </div>
  );
};
