
import React, { useState, useEffect } from 'react';
import { fetchMarketData } from '@/lib/marketData';
import { FlowData } from '@/types/crypto';
import { FlowVisualization } from '@/components/capital-flow/FlowVisualization';
import { CryptoLogosProvider } from '@/contexts/CryptoLogosContext';

const CapitalFlowPanel = () => {
  const [flows, setFlows] = useState<FlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMarketData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMarketData('24h');
        setFlows(data);
      } catch (err) {
        setError('Failed to load market data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMarketData();
  }, []);

  if (loading) {
    return <div className="text-center">Loading capital flow data...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <CryptoLogosProvider>
      <div className="w-full h-full flex items-center justify-center">
        <FlowVisualization 
          flowData={flows || []} 
        />
      </div>
    </CryptoLogosProvider>
  );
};

export default CapitalFlowPanel;
