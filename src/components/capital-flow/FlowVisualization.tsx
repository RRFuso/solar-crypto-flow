
import React, { useEffect, useState, useRef } from 'react';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePriceActionSignals } from '@/hooks/usePriceActionSignals';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';
import { OrbitLayersComponent } from './OrbitLayers';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalNode } from './NodePlacement';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
  predictions?: Prediction[];
  chartTimeframe?: string;
  activeCategory?: string;
}

// Helper function to safely convert volume to number
const getVolumeAsNumber = (volume: string | number | undefined): number => {
  if (typeof volume === 'number') return volume;
  if (typeof volume === 'string') {
    const parsed = parseFloat(volume);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ 
  flowData, 
  zoomLevel = 80,
  predictions = [],
  chartTimeframe = '4h',
  activeCategory = 'all'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [nodes, setNodes] = useState<OrbitalNode[]>([]);
  const [centralNode, setCentralNode] = useState<OrbitalNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { data: cryptoData, isLoading: loadingCryptoData } = useCryptoData();
  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(['BTC', 'ETH']);
  const { insights: aiInsights, isLoading: loadingAI } = useAdvancedAI();

  // Handle container resize with proper full viewport usage
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Use full viewport for better solar system display
        const width = window.innerWidth;
        const height = window.innerHeight - 120; // Account for header/controls
        
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create orbital nodes from flow data
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !cryptoData) return;

    const filteredFlowData = activeCategory === 'all' ? flowData : 
      flowData.filter(flow => {
        const cryptoInfo = cryptoData.find(c => c.symbol === flow.to || c.symbol === flow.from);
        return cryptoInfo?.category === activeCategory;
      });

    // Create central node (BTC)
    const btcData = cryptoData.find(c => c.symbol === 'BTC');
    const central: OrbitalNode = {
      id: 'BTC',
      name: 'Bitcoin',
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      radius: 30,
      marketCap: btcData?.marketCap || 1000000000000,
      type: 'central',
      volume: getVolumeAsNumber(btcData?.volume),
      inflow: filteredFlowData.filter(f => f.to === 'BTC').reduce((sum, f) => sum + Math.abs(f.value), 0),
      outflow: filteredFlowData.filter(f => f.from === 'BTC').reduce((sum, f) => sum + Math.abs(f.value), 0)
    };

    setCentralNode(central);

    // Create orbital nodes with proper positioning
    const orbitNodes: OrbitalNode[] = [];
    const uniqueSymbols = new Set<string>();
    
    filteredFlowData.forEach(flow => {
      [flow.from, flow.to].forEach(symbol => {
        if (symbol !== 'BTC' && !uniqueSymbols.has(symbol)) {
          uniqueSymbols.add(symbol);
          const cryptoInfo = cryptoData.find(c => c.symbol === symbol);
          
          orbitNodes.push({
            id: symbol,
            name: cryptoInfo?.name || symbol,
            x: 0, // Will be positioned by orbital calculation
            y: 0,
            radius: 15,
            marketCap: cryptoInfo?.marketCap || 1000000000,
            type: 'orbital',
            volume: getVolumeAsNumber(cryptoInfo?.volume),
            inflow: filteredFlowData.filter(f => f.to === symbol).reduce((sum, f) => sum + Math.abs(f.value), 0),
            outflow: filteredFlowData.filter(f => f.from === symbol).reduce((sum, f) => sum + Math.abs(f.value), 0)
          });
        }
      });
    });

    // Position nodes in orbital layers
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const maxRadius = Math.min(dimensions.width, dimensions.height) * 0.35;
    const orbitLayers = Math.min(4, Math.ceil(orbitNodes.length / 8));
    
    orbitNodes.forEach((node, index) => {
      const layer = Math.floor(index / 8) + 1;
      const angleStep = (Math.PI * 2) / Math.min(8, orbitNodes.length - (layer - 1) * 8);
      const angle = (index % 8) * angleStep + (layer * 0.3); // Offset each layer
      const radius = (maxRadius / orbitLayers) * layer;
      
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    setNodes([central, ...orbitNodes]);
  }, [flowData, cryptoData, activeCategory, dimensions]);

  // Handle node selection
  useEffect(() => {
    const handleNodeClick = (event: CustomEvent) => {
      setSelectedNodeId(event.detail.nodeId);
    };

    document.addEventListener('node-click', handleNodeClick as EventListener);
    return () => document.removeEventListener('node-click', handleNodeClick as EventListener);
  }, []);

  if (loadingCryptoData || loadingSignals || loadingAI) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading solar system...</p>
        </div>
      </div>
    );
  }

  if (!flowData || flowData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <p className="text-slate-400 text-lg">🌌 No flow data available</p>
          <p className="text-slate-500 text-sm">Waiting for market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      {/* Main Solar System SVG - Centered and Scaled */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `scale(${Math.max(0.5, Math.min(1.2, zoomLevel / 100))})`,
          transformOrigin: 'center center'
        }}
      >
        <svg 
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute"
          style={{ 
            background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 35%, #0f0f23 100%)',
            overflow: 'visible'
          }}
        >
          {/* Starfield Background */}
          <defs>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>
          
          {/* Stars */}
          {Array.from({ length: 200 }, (_, i) => (
            <circle
              key={`star-${i}`}
              cx={Math.random() * dimensions.width}
              cy={Math.random() * dimensions.height}
              r={Math.random() * 1.5 + 0.5}
              fill="url(#starGlow)"
              opacity={Math.random() * 0.8 + 0.2}
            />
          ))}
          
          {/* Orbital Layers */}
          {svgRef.current && (
            <OrbitLayersComponent
              svg={svgRef.current}
              width={dimensions.width}
              height={dimensions.height}
              orbitLayers={4}
              baseRadius={Math.min(dimensions.width, dimensions.height) * 0.1}
            />
          )}
          
          {/* Node Renderer */}
          {svgRef.current && nodes.length > 0 && (
            <NodeRendererComponent
              svg={svgRef.current}
              nodes={nodes}
              centralNode={centralNode}
              selectedNodeId={selectedNodeId}
              zoomLevel={zoomLevel}
            />
          )}
        </svg>
      </div>
      
      {/* Control Overlay - Fixed position */}
      <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-3 z-10">
        <div className="text-xs text-white/70 space-y-1">
          <div>Zoom: {zoomLevel}%</div>
          <div>Nodes: {nodes.length}</div>
          <div>Timeframe: {chartTimeframe}</div>
          {activeCategory !== 'all' && (
            <div>Category: {activeCategory}</div>
          )}
        </div>
      </div>
    </div>
  );
};
