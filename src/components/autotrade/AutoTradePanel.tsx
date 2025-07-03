
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutoTrade } from '@/hooks/useAutoTrade';
import { StrategyManager } from './StrategyManager';
import { PositionsList } from './PositionsList';
import { PerformanceMetrics } from './PerformanceMetrics';
import { BacktestRunner } from './BacktestRunner';
import ExchangeSetupPanel from './ExchangeSetupPanel';
import AdvancedAnalytics from './AdvancedAnalytics';
import StrategyTemplates from './StrategyTemplates';
import TwoFactorSetup from './TwoFactorSetup';
import { Activity, TrendingUp, Shield, Settings, Zap } from 'lucide-react';

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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Mock completed trades for analytics
  const mockTrades = [
    {
      id: '1',
      symbol: 'BTCUSDT',
      side: 'buy' as const,
      entryPrice: 45000,
      exitPrice: 46500,
      amount: 0.01,
      entryTime: Date.now() - 86400000,
      exitTime: Date.now() - 43200000,
      profit: 15,
      status: 'closed' as const,
      strategy: 'macd_momentum'
    },
    {
      id: '2',
      symbol: 'ETHUSDT',
      side: 'buy' as const,
      entryPrice: 3000,
      exitPrice: 2950,
      amount: 0.1,
      entryTime: Date.now() - 172800000,
      exitTime: Date.now() - 86400000,
      profit: -5,
      status: 'closed' as const,
      strategy: 'ai_prediction'
    }
  ];

  const handleTwoFactorSetup = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
  };

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
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={config.paperTrading ? 'secondary' : 'destructive'}>
                    {config.paperTrading ? 'Paper Trading' : 'Live Trading'}
                  </Badge>
                  {twoFactorEnabled && (
                    <Badge className="bg-green-500 text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      2FA Ativo
                    </Badge>
                  )}
                </div>
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
        <TabsList className="grid w-full grid-cols-7 bg-slate-800/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="exchange">Exchange</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
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

        <TabsContent value="templates">
          <StrategyTemplates onSelectTemplate={addStrategy} />
        </TabsContent>

        <TabsContent value="positions">
          <PositionsList 
            positions={openPositions} 
            onClosePosition={closePosition}
            compact={false}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <AdvancedAnalytics trades={mockTrades} />
        </TabsContent>

        <TabsContent value="exchange">
          <ExchangeSetupPanel />
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            <TwoFactorSetup 
              userId="current-user" 
              onSetupComplete={handleTwoFactorSetup}
            />
            
            <Card className="bg-slate-900/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Configurações de Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Modo de Trading</h3>
                    <p className="text-sm text-slate-400">
                      {config.paperTrading 
                        ? 'Paper trading usa fundos simulados para teste'
                        : 'Live trading usa fundos reais'
                      }
                    </p>
                  </div>
                  <Badge 
                    variant={config.paperTrading ? 'secondary' : 'destructive'}
                    className="cursor-pointer"
                    onClick={() => setConfig(prev => ({ 
                      ...prev, 
                      paperTrading: !prev.paperTrading 
                    }))}
                  >
                    {config.paperTrading ? 'Paper' : 'Live'}
                  </Badge>
                </div>

                <div className="p-4 bg-red-900/20 border border-red-700/30 rounded">
                  <div className="flex items-start space-x-2">
                    <Shield className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-300">Importante</h4>
                      <p className="text-red-200 text-sm mt-1">
                        Trading ao vivo requer 2FA ativo e configuração completa de exchanges.
                        Sempre teste suas estratégias em paper trading primeiro.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoTradePanel;
