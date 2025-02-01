import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DominanceData {
  btc: number;
  eth: number;
  timestamp: string;
}

const fetchDominanceData = async (): Promise<DominanceData> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/global');
    const data = await response.json();
    
    return {
      btc: data.data.market_cap_percentage.btc,
      eth: data.data.market_cap_percentage.eth,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching dominance data:', error);
    throw new Error('Failed to fetch market dominance data');
  }
};

const MarketDominance = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dominance'],
    queryFn: fetchDominanceData,
    refetchInterval: 300000, // 5 minutes
    retry: 3
  });

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gray-900/50 rounded-lg border border-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-gray-900/50 border-red-900">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados de dominância. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  const chartData = [
    {
      name: 'Dominância',
      BTC: data?.btc || 0,
      ETH: data?.eth || 0,
    }
  ];

  return (
    <div className="w-full space-y-2 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Dominância de Mercado</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm">BTC: {data?.btc.toFixed(2)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm">ETH: {data?.eth.toFixed(2)}%</span>
          </div>
        </div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937',
                border: '1px solid #374151'
              }}
            />
            <Bar 
              dataKey="BTC" 
              fill="#3b82f6"
              name="Bitcoin"
            />
            <Bar 
              dataKey="ETH" 
              fill="#22c55e"
              name="Ethereum"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MarketDominance;