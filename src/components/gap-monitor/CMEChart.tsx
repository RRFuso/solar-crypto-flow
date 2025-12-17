import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, ReferenceArea, Tooltip } from 'recharts';
import { Info } from 'lucide-react';

interface CMEChartProps {
  height?: number;
  gaps?: Array<{
    gapLow: number;
    gapHigh: number;
    type: 'bullish' | 'bearish';
    filled: boolean;
    createdAt: Date;
  }>;
  currentPrice?: number;
}

// Generate mock price data for visualization
const generatePriceData = (currentPrice: number) => {
  const data = [];
  const now = new Date();
  
  // Generate 90 days of simulated data
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate price movement with some volatility
    const basePrice = currentPrice * (0.7 + (90 - i) * 0.003);
    const volatility = basePrice * 0.02;
    const price = basePrice + (Math.random() - 0.5) * volatility;
    
    data.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      fullDate: date,
      price: Math.round(price),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }
  
  return data;
};

export const CMEChart: React.FC<CMEChartProps> = ({ 
  height = 400, 
  gaps = [],
  currentPrice = 104000 
}) => {
  const priceData = useMemo(() => generatePriceData(currentPrice), [currentPrice]);
  
  // Get price range for Y axis
  const prices = priceData.map(d => d.price);
  const allPrices = [...prices, ...gaps.flatMap(g => [g.gapLow, g.gapHigh])];
  const minPrice = Math.min(...allPrices) * 0.98;
  const maxPrice = Math.max(...allPrices) * 1.02;

  // Default gaps if none provided
  const displayGaps = gaps.length > 0 ? gaps : [
    { gapLow: 95200, gapHigh: 96800, type: 'bearish' as const, filled: false, createdAt: new Date('2024-12-01') },
    { gapLow: 97500, gapHigh: 99100, type: 'bullish' as const, filled: false, createdAt: new Date('2024-11-24') },
    { gapLow: 76800, gapHigh: 81200, type: 'bullish' as const, filled: false, createdAt: new Date('2024-11-10') },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground">{data.date}</p>
          <p className="text-sm font-bold text-foreground">
            ${data.price.toLocaleString()}
          </p>
          {data.isWeekend && (
            <p className="text-xs text-orange-400 mt-1">Fim de semana (CME fechado)</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg overflow-hidden border border-border/20 bg-card/50">
      <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">BTC/USD com Gaps CME</span>
          <span className="text-xs text-muted-foreground">(Visualização)</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/50" />
            <span className="text-muted-foreground">Gap Bullish</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/50" />
            <span className="text-muted-foreground">Gap Bearish</span>
          </div>
        </div>
      </div>
      
      <div style={{ height: `${height}px` }} className="bg-background/20 relative p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={{ stroke: '#64748b' }}
              axisLine={{ stroke: '#334155' }}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              domain={[minPrice, maxPrice]}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={{ stroke: '#64748b' }}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              width={55}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Gap zones */}
            {displayGaps.map((gap, index) => (
              <ReferenceArea
                key={`gap-${index}`}
                y1={gap.gapLow}
                y2={gap.gapHigh}
                fill={gap.type === 'bullish' ? '#22c55e' : '#ef4444'}
                fillOpacity={0.15}
                stroke={gap.type === 'bullish' ? '#22c55e' : '#ef4444'}
                strokeOpacity={0.5}
                strokeDasharray="3 3"
              />
            ))}
            
            {/* Current price line */}
            <ReferenceLine 
              y={currentPrice} 
              stroke="#f59e0b" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: `$${currentPrice.toLocaleString()}`, 
                fill: '#f59e0b',
                fontSize: 11,
                position: 'right'
              }}
            />
            
            {/* Price area */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="px-4 py-3 border-t border-border/20 bg-muted/5">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            As áreas coloridas representam os gaps CME. <span className="text-green-400">Verde</span> = gap bullish (preço subiu no fim de semana), <span className="text-red-400">Vermelho</span> = gap bearish (preço caiu). Linha tracejada laranja indica o preço atual do BTC.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CMEChart;