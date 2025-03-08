import React, { useState, useEffect } from 'react';
import { fetchMarketData } from '@/lib/marketData';
import { FlowData } from '@/types/crypto';
import ForceGraph2D from 'react-force-graph';

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
    <div className="w-full h-full flex items-center justify-center">
      <ForceGraph2D
        graphData={{
          nodes: Array.from(new Set(flows.flatMap(flow => [flow.from, flow.to]))).map(name => ({ id: name })),
          links: flows.map(flow => ({ source: flow.from, target: flow.to, value: flow.value, percentage: flow.percentage })),
        }}
        nodeLabel="id"
        linkWidth={link => Math.sqrt(link.value || 1)}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={link => 4}
        linkColor={() => 'rgba(255,255,255,0.2)'}
        nodeAutoColorBy="id"
        nodeVal={10}
        width={800}
        height={600}
      />
    </div>
  );
};

export default CapitalFlowPanel;
