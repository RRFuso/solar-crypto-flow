
import React, { useMemo } from 'react';
import { FlowData } from '@/types/crypto';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';

interface CapitalMigrationChartProps {
  flowData: FlowData[];
  timeframe: string;
}

const CapitalMigrationChart: React.FC<CapitalMigrationChartProps> = ({ flowData, timeframe }) => {
  // Calculate the Capital Migration Index - net flow weighted by time
  const cmData = useMemo(() => {
    if (!flowData.length) return [];
    
    // Get unique crypto assets
    const uniqueCryptos = Array.from(new Set([
      ...flowData.map(d => d.from),
      ...flowData.map(d => d.to)
    ]));
    
    // Calculate total inflow and outflow for each crypto
    return uniqueCryptos.map(crypto => {
      const inflows = flowData
        .filter(flow => flow.to === crypto)
        .reduce((sum, flow) => sum + Math.abs(flow.value), 0);
        
      const outflows = flowData
        .filter(flow => flow.from === crypto)
        .reduce((sum, flow) => sum + Math.abs(flow.value), 0);
      
      const netFlow = inflows - outflows;
      
      // TimeWeight: shorter timeframes give higher weights to emphasize rapid changes
      // Formula is arbitrary for demo purposes, can be adjusted based on real requirements
      const timeWeight = timeframe === '15m' ? 5.0 : 
                       timeframe === '1h' ? 3.0 :
                       timeframe === '24h' ? 1.0 : 0.5; 
      
      // Calculate CMI based on net flow and time weight
      const cmi = (netFlow / 1000000) * timeWeight; // Normalize to millions
      
      return {
        id: crypto,
        cmi: cmi,
        netFlow: netFlow,
        // Determine color based on CMI value
        color: cmi > 0 ? "#4ade80" : "#f43f5e"
      };
    })
    .sort((a, b) => Math.abs(b.cmi) - Math.abs(a.cmi)) // Sort by absolute CMI value
    .slice(0, 8); // Only show top 8 assets
  }, [flowData, timeframe]);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-gray-900/90 border border-gray-700 p-2 rounded-md shadow-md">
        <p className="font-bold">{data.id}</p>
        <p className="text-sm">CMI: {data.cmi.toFixed(2)}</p>
        <p className="text-sm">${(data.netFlow / 1000000).toFixed(2)}M</p>
      </div>
    );
  };

  return (
    <div className="h-[200px] w-full">
      {cmData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={cmData}
            margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
            <XAxis 
              type="number"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <YAxis 
              type="category"
              dataKey="id" 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="cmi" 
              name="Capital Migration Index"
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              {cmData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400">
          No data available for CMI calculation
        </div>
      )}
    </div>
  );
};

export default CapitalMigrationChart;
