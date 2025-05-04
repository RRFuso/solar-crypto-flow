
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';

interface AnomalyProps {
  data: any;
  isLoading: boolean;
}

const AnomalyDetection: React.FC<AnomalyProps> = ({ data, isLoading }) => {
  // Format anomaly data for visualization
  const chartData = useMemo(() => {
    if (!data || !data.labels || !Array.isArray(data.labels)) return [];
    
    // Count occurrences of each label
    const labelCounts: Record<string, number> = {};
    data.labels.forEach((label: number) => {
      const key = label === -1 ? 'Anomalia' : `Cluster ${label}`;
      labelCounts[key] = (labelCounts[key] || 0) + 1;
    });
    
    // Convert to array format for chart
    return Object.entries(labelCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    );
  }
  
  if (!data || data.status === 'Aguardando mais dados') {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
        <p>Aguardando dados suficientes para análise</p>
        <p className="text-sm mt-2">Mínimo de 10 pontos de dados necessários</p>
      </div>
    );
  }

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 50,
          }}
        >
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              borderColor: '#374151',
              color: 'white'
            }} 
          />
          <Bar dataKey="value" name="Quantidade">
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.name === 'Anomalia' ? '#f59e0b' : '#3b82f6'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnomalyDetection;
