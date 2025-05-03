
import React from 'react';
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface CryptoMetric {
  id: string;
  name?: string;
  gravityIndex: number;
  netFlow: number;
  color: string;
}

interface CryptoGravityIndexProps {
  cryptoMetrics: CryptoMetric[];
}

const CryptoGravityIndex: React.FC<CryptoGravityIndexProps> = ({ cryptoMetrics }) => {
  // Sort metrics by gravity index descending
  const sortedMetrics = [...cryptoMetrics]
    .sort((a, b) => b.gravityIndex - a.gravityIndex)
    .slice(0, 10); // Only show top 10 assets
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-gray-900/90 border border-gray-700 p-2 rounded-md shadow-md">
        <p className="font-bold">{data.id}</p>
        <p className="text-sm">CGI: {data.gravityIndex.toFixed(2)}</p>
        <p className="text-sm text-green-400">Net Flow: ${(data.netFlow / 1000000).toFixed(2)}M</p>
      </div>
    );
  };
  
  return (
    <div className="h-[200px] w-full">
      {cryptoMetrics.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedMetrics}
            margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis 
              dataKey="id" 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="gravityIndex" 
              name="Gravity Index"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400">
          No metrics data available
        </div>
      )}
    </div>
  );
};

export default CryptoGravityIndex;
