import React, { useMemo } from 'react';
import { ThreeJSVisualization } from './ThreeJSVisualization';
import { NarrativeData, NarrativeFlow } from '@/types/narratives';

interface MarketFlowThreeJSProps {
  narratives: NarrativeData[];
  flowData: NarrativeFlow[];
  width: number;
  height: number;
  isPredicted?: boolean;
}

const generateRandomPosition = (index: number, total: number): [number, number, number] => {
  // Create a more organized layout in 3D space
  const radius = 8;
  const angle = (index / total) * Math.PI * 2;
  const layer = Math.floor(index / 10);
  
  return [
    Math.cos(angle) * radius + (Math.random() - 0.5) * 2,
    (layer - 1) * 3 + (Math.random() - 0.5) * 2,
    Math.sin(angle) * radius + (Math.random() - 0.5) * 2
  ];
};

const getNodeColor = (narrative: NarrativeData): string => {
  // Color based on sentiment or category
  if (narrative.sentiment === 'bullish') return '#00ff88';
  if (narrative.sentiment === 'bearish') return '#ff4444';
  return '#4488ff';
};

const getNodeSize = (narrative: NarrativeData): number => {
  // Size based on market cap or importance
  const baseSize = 0.3;
  const scaleFactor = Math.log(narrative.marketCap || 1000000) / Math.log(1000000000);
  return baseSize + scaleFactor * 0.5;
};

export const MarketFlowThreeJS: React.FC<MarketFlowThreeJSProps> = ({
  narratives,
  flowData,
  width,
  height,
  isPredicted = false
}) => {
  const { nodes, links } = useMemo(() => {
    // Convert narratives to 3D nodes
    const nodes = narratives.map((narrative, index) => ({
      id: narrative.id,
      symbol: narrative.symbol,
      name: narrative.name,
      position: generateRandomPosition(index, narratives.length),
      size: getNodeSize(narrative),
      color: getNodeColor(narrative),
      logoUrl: narrative.logoUrl
    }));

    // Convert flow data to 3D links
    const links = flowData.map(flow => ({
      source: flow.from,
      target: flow.to,
      value: flow.value,
      color: flow.predicted ? '#ffaa00' : '#ffffff'
    }));

    return { nodes, links };
  }, [narratives, flowData]);

  return (
    <div className="relative w-full h-full">
      <ThreeJSVisualization
        nodes={nodes}
        links={links}
        width={width}
        height={height}
      />
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
        <h3 className="text-lg font-semibold mb-2">Sistema Solar Cripto</h3>
        <div className="text-sm space-y-1">
          <div>Nós: {nodes.length}</div>
          <div>Conexões: {links.length}</div>
          <div>Renderização: GPU (Three.js)</div>
        </div>
      </div>

      {/* Performance indicator */}
      <div className="absolute top-4 right-4 bg-green-500/20 backdrop-blur-sm rounded-lg p-2 text-green-400 text-sm">
        ⚡ GPU Acelerado
      </div>
    </div>
  );
};

export default MarketFlowThreeJS;

