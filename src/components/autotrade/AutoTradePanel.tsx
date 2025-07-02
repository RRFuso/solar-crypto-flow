
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutoTrade } from '@/hooks/useAutoTrade';
import { StrategyManager } from './StrategyManager';
import { PositionsList } from './PositionsList';
import { PerformanceMetrics } from './PerformanceMetrics';
import { BacktestRunner } from './BacktestRunner';
import { Activity, TrendingUp, Shield, Settings } from 'lucide-react';

interface AutoTradePanelProps {
  flowData?: any;
}

export const AutoTradePanel: React.FC<AutoTradePanelProps> = ({ flowData }) => {
  const {
    config,
    state,
    isEnabled,
    isRunning,
    activeStrategies,
    openPositions,
    performance,
    toggleAutoTrade,
    addStrategy,
    updateStrategy,
    removeStrategy,
    closePosition,
    setConfig
  } = useAutoTrade(flowData);

  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full h-full p-4 space-y-4">
      {/* Header */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-orange-500" />
              <div>
                <CardTitle className="text-white">AutoTrade System</CardTitle>
                <p className="text-sm text-slate-400">
                  {config.paperTrading ? 'Paper Trading Mode' : 'Live Trading Mode'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Status</p>
                <Badge variant={isRunning ? 'default' : 'secondary'}>
                  {isRunning ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <Switch
                checked={isEnabled}
                onCheckedChange={toggleAutoTrade}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/30 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-slate-400">Total P&L</span>
            </div>
            <p className="text-xl font-bold text-white">
              ${performance.totalPnl.toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">
              {performance.totalPnlPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/30 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-400">Open Positions</span>
            </div>
            <p className="text-xl font-bold text-white">{openPositions.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/30 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-slate-400">Win Rate</span>
            </div>
            <p className="text-xl font-bold text-white">
              {performance.winRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/30 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-slate-400">Active Strategies</span>
            </div>
            <p className="text-xl font-bold text-white">{activeStrategies.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="backtest">Backtest</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PerformanceMetrics performance={performance} />
            <PositionsList 
              positions={openPositions} 
              onClosePosition={closePosition}
              compact={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="strategies">
          <StrategyManager
            strategies={config.strategies}
            onAddStrategy={addStrategy}
            onUpdateStrategy={updateStrategy}
            onRemoveStrategy={removeStrategy}
          />
        </TabsContent>

        <TabsContent value="positions">
          <PositionsList 
            positions={openPositions} 
            onClosePosition={closePosition}
            compact={false}
          />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetrics 
            performance={performance} 
            trades={state.completedTrades}
            detailed={true}
          />
        </TabsContent>

        <TabsContent value="backtest">
          <BacktestRunner strategies={config.strategies} />
        </TabsContent>
      </Tabs>

      {/* Trading Mode Toggle */}
      <Card className="bg-slate-900/30 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Trading Mode</h3>
              <p className="text-sm text-slate-400">
                {config.paperTrading 
                  ? 'Paper trading uses simulated funds for testing strategies'
                  : 'Live trading uses real funds and executes actual trades'
                }
              </p>
            </div>
            <Button
              variant={config.paperTrading ? 'default' : 'destructive'}
              onClick={() => setConfig(prev => ({ 
                ...prev, 
                paperTrading: !prev.paperTrading 
              }))}
              disabled={isRunning}
            >
              {config.paperTrading ? 'Switch to Live' : 'Switch to Paper'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoTradePanel;
