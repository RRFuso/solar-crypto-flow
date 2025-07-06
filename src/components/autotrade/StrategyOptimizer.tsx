import { TradingStrategy, BacktestResult } from '@/types/autotrade';
import { StrategyOptimizer as optimizeStrategy } from '@/lib/autotrade/optimizer';
import { fetchKlines } from '@/lib/binance';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';
import { toast } from 'sonner';
import { Zap, BarChart, Sliders } from 'lucide-react';

interface StrategyOptimizerProps {
  strategies: TradingStrategy[];
}

export const StrategyOptimizer: React.FC<StrategyOptimizerProps> = ({ strategies }) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationParams, setOptimizationParams] = useState({
    stopLoss: { min: 1, max: 5, step: 0.5 },
    takeProfit: { min: 2, max: 15, step: 1 },
    metric: 'sharpeRatio' as 'sharpeRatio' | 'totalReturn' | 'winRate',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    initialCapital: 10000,
  });
  const [results, setResults] = useState<any>(null);
  const { insights: aiInsights } = useAdvancedAI();

  const handleRunOptimization = async () => {
    if (!selectedStrategyId) {
      toast.error('Please select a strategy to optimize.');
      return;
    }
    const strategy = strategies.find(s => s.id === selectedStrategyId);
    if (!strategy) {
      toast.error('Strategy not found.');
      return;
    }

    setIsOptimizing(true);
    setResults(null);
    
    try {
      const historicalData = new Map();
      for (const symbol of strategy.symbols) {
        const klines = await fetchKlines(`${symbol}USDT`, '1d', {
          startTime: new Date(optimizationParams.startDate).getTime(),
          endTime: new Date(optimizationParams.endDate).getTime(),
        });
        historicalData.set(symbol, klines);
      }

      const optimizationResult = await optimizeStrategy.run(
        strategy,
        { stopLoss: optimizationParams.stopLoss, takeProfit: optimizationParams.takeProfit },
        historicalData,
        aiInsights,
        new Date(optimizationParams.startDate),
        new Date(optimizationParams.endDate),
        optimizationParams.initialCapital,
        optimizationParams.metric
      );

      setResults(optimizationResult);
      toast.success('Optimization completed!');

    } catch (error) {
      console.error("Optimization failed:", error);
      toast.error('Optimization failed.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Strategy Optimizer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Strategy to Optimize</Label>
            <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategies.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Stop Loss Range (%)</Label>
              <div className="flex items-center gap-2">
                <Input type="number" value={optimizationParams.stopLoss.min} onChange={e => setOptimizationParams(p => ({ ...p, stopLoss: { ...p.stopLoss, min: parseFloat(e.target.value) } }))} />
                <Input type="number" value={optimizationParams.stopLoss.max} onChange={e => setOptimizationParams(p => ({ ...p, stopLoss: { ...p.stopLoss, max: parseFloat(e.target.value) } }))} />
              </div>
            </div>
            <div>
              <Label>Take Profit Range (%)</Label>
              <div className="flex items-center gap-2">
                <Input type="number" value={optimizationParams.takeProfit.min} onChange={e => setOptimizationParams(p => ({ ...p, takeProfit: { ...p.takeProfit, min: parseFloat(e.target.value) } }))} />
                <Input type="number" value={optimizationParams.takeProfit.max} onChange={e => setOptimizationParams(p => ({ ...p, takeProfit: { ...p.takeProfit, max: parseFloat(e.target.value) } }))} />
              </div>
            </div>
            <div>
              <Label>Optimization Metric</Label>
              <Select value={optimizationParams.metric} onValueChange={value => setOptimizationParams(p => ({ ...p, metric: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sharpeRatio">Sharpe Ratio</SelectItem>
                  <SelectItem value="totalReturn">Total Return</SelectItem>
                  <SelectItem value="winRate">Win Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleRunOptimization} disabled={isOptimizing || !selectedStrategyId} className="w-full">
            {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <BarChart className="w-5 h-5" />
              <span>Optimization Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold text-green-400">Optimal Configuration Found!</h3>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <Label>Optimal Stop Loss</Label>
                <p className="text-2xl font-bold">{results.bestCombination.stopLoss}%</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <Label>Optimal Take Profit</Label>
                <p className="text-2xl font-bold">{results.bestCombination.takeProfit}%</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <Label>Resulting {optimizationParams.metric}</Label>
                <p className="text-2xl font-bold">{results.bestCombination.metricValue.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-6">
              {/* Heatmap visualization would go here */}
              <p className="text-center text-slate-400">Heatmap visualization coming soon.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
