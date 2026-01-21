import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, TrendingUp, TrendingDown, Info, BarChart3, Target, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCMEGaps } from '@/hooks/useCMEGaps';
import { GapTable } from './GapTable';
import { GapVisualization } from './GapVisualization';
import { CMEChart } from './CMEChart';

interface GapMonitorPanelProps {
  currentBTCPrice?: number;
}

export const GapMonitorPanel: React.FC<GapMonitorPanelProps> = ({ currentBTCPrice }) => {
  const [btcPrice, setBtcPrice] = useState<number | null>(currentBTCPrice || null);
  const [activeTab, setActiveTab] = useState('gaps');
  const { data, isLoading, dataSource, refetch } = useCMEGaps(btcPrice);

  // Fetch BTC price if not provided
  useEffect(() => {
    if (currentBTCPrice) {
      setBtcPrice(currentBTCPrice);
      return;
    }

    const fetchPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        );
        const data = await response.json();
        setBtcPrice(data.bitcoin.usd);
      } catch (error) {
        console.error('Error fetching BTC price:', error);
        setBtcPrice(104000); // Fallback price
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, [currentBTCPrice]);

  const openGaps = data?.gaps.filter(g => !g.gap.filled) || [];
  const highestProbabilityGap = openGaps[0];

  return (
    <Card className="bg-crypto-dark/80 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20">
              <BarChart3 className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                CME GAP Monitor
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bitcoin Futures (CME)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs bg-crypto-dark border-white/10">
                  <p className="text-sm">
                    <strong>O que são GAPs da CME?</strong><br />
                    Os mercados futuros da CME fecham nos fins de semana. Quando há movimento 
                    significativo no preço do BTC durante esse período, forma-se um "gap" 
                    (lacuna) no gráfico. Historicamente, ~77% dos gaps são preenchidos, 
                    tornando-os níveis importantes de suporte/resistência.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-white/5 border-white/10 hover:bg-white/10"
              onClick={() => refetch()}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="BTC Atual"
            value={btcPrice ? `$${btcPrice.toLocaleString()}` : '...'}
            icon={<Target className="h-4 w-4" />}
            variant="default"
          />
          <StatCard
            label="Gaps Abertos"
            value={data?.totalOpenGaps.toString() || '0'}
            icon={<BarChart3 className="h-4 w-4" />}
            variant="warning"
          />
          <StatCard
            label="Gaps Preenchidos"
            value={data?.totalFilledGaps.toString() || '0'}
            icon={<TrendingUp className="h-4 w-4" />}
            variant="success"
          />
          <StatCard
            label="Tempo Médio"
            value={data?.averageFillTime ? `${Math.round(data.averageFillTime)}d` : '-'}
            icon={<RefreshCcw className="h-4 w-4" />}
            variant="default"
          />
        </div>

        {/* Highlight highest probability gap */}
        {highestProbabilityGap && btcPrice && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Determine direction based on current price */}
                {btcPrice < highestProbabilityGap.gap.gapLow ? (
                  <TrendingUp className="h-5 w-5 text-green-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Gap com Maior Probabilidade</p>
                  <p className="font-semibold text-foreground">
                    ${highestProbabilityGap.gap.gapLow.toLocaleString()} - $
                    {highestProbabilityGap.gap.gapHigh.toLocaleString()}
                  </p>
                  <p className="text-xs mt-1">
                    <span className="text-yellow-400">Gap</span>
                    {' • '}
                    {btcPrice < highestProbabilityGap.gap.gapLow ? (
                      <span className="text-green-400">Preço precisa subir</span>
                    ) : (
                      <span className="text-red-400">Preço precisa cair</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant="outline" 
                  className={`text-lg font-bold px-3 py-1 ${
                    highestProbabilityGap.fillProbability >= 70 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : highestProbabilityGap.fillProbability >= 50
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {highestProbabilityGap.fillProbability}%
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Probabilidade de Preenchimento
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for Chart and Data */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white/5 border border-white/10">
            <TabsTrigger value="gaps" className="flex-1 data-[state=active]:bg-orange-500/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Gaps
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex-1 data-[state=active]:bg-orange-500/20">
              <TrendingUp className="h-4 w-4 mr-2" />
              CME Chart
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gaps" className="mt-4 space-y-4">
            {/* Visualization */}
            {data && btcPrice && (
              <GapVisualization gaps={data.gaps} currentPrice={btcPrice} />
            )}

            {/* Table */}
            {data && (
              <GapTable gaps={data.gaps} isLoading={isLoading} />
            )}
          </TabsContent>
          
          <TabsContent value="chart" className="mt-4">
            <CMEChart 
              height={450} 
              gaps={data?.gaps.map(g => ({
                gapLow: g.gap.gapLow,
                gapHigh: g.gap.gapHigh,
                type: g.gap.type,
                filled: g.gap.filled,
                createdAt: g.gap.createdAt,
              }))}
              currentPrice={btcPrice || undefined}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-white/5">
          <span>
            Última atualização: {data?.lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
          <span className="flex items-center gap-1">
            {dataSource === 'live' ? (
              <>
                <Wifi className="h-3 w-3 text-green-400" />
                <span className="text-green-400">Dados em tempo real (Binance)</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-yellow-400" />
                <span className="text-yellow-400">Dados históricos</span>
              </>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant: 'default' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, variant }) => {
  const variantStyles = {
    default: 'bg-white/5 border-white/10',
    success: 'bg-green-500/10 border-green-500/20',
    warning: 'bg-orange-500/10 border-orange-500/20',
    danger: 'bg-red-500/10 border-red-500/20',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-400',
    warning: 'text-orange-400',
    danger: 'text-red-400',
  };

  return (
    <div className={`p-3 rounded-lg border ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={iconStyles[variant]}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
};

export default GapMonitorPanel;
