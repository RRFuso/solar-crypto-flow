import React, { useEffect, useState, useRef } from 'react';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePriceActionSignals } from '@/hooks/usePriceActionSignals';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';

interface FlowVisualizationContentProps {
  isLoading: boolean;
  error: Error | null;
  processedFlowData: FlowData[];
  zoomLevel: number;
  filteredPredictions: Prediction[];
  chartTimeframe: string;
  activeCategory: string;
  showFlowLines: boolean;
}

export const FlowVisualizationContent: React.FC<FlowVisualizationContentProps> = ({
  isLoading,
  error,
  processedFlowData,
  zoomLevel = 60,
  filteredPredictions = [],
  chartTimeframe = '4h',
  activeCategory = 'all',
  showFlowLines,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const { data: cryptoData, isLoading: loadingCryptoData } = useCryptoData();
  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(['BTC', 'ETH']);
  const { insights: aiInsights, isLoading: loadingAI } = useAdvancedAI();

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 600
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // SVG-based visualization using native DOM methods
  useEffect(() => {
    if (!svgRef.current || !processedFlowData || processedFlowData.length === 0) return;

    const svg = svgRef.current;
    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    svg.setAttribute("width", dimensions.width.toString());
    svg.setAttribute("height", dimensions.height.toString());

    // Create background
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    gradient.setAttribute("id", "backgroundGradient");
    gradient.setAttribute("cx", "50%");
    gradient.setAttribute("cy", "50%");
    gradient.setAttribute("r", "50%");

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#1e293b");

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#0f172a");

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);

    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", "url(#backgroundGradient)");
    svg.appendChild(background);

    // Draw central node (BTC)
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    const centralNode = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centralNode.setAttribute("cx", centerX.toString());
    centralNode.setAttribute("cy", centerY.toString());
    centralNode.setAttribute("r", "40");
    centralNode.setAttribute("fill", "#f59e0b");
    centralNode.setAttribute("stroke", "#ffffff");
    centralNode.setAttribute("stroke-width", "3");
    svg.appendChild(centralNode);

    // Add BTC label
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", centerX.toString());
    label.setAttribute("y", centerY.toString());
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dy", "0.3em");
    label.setAttribute("fill", "white");
    label.setAttribute("font-weight", "bold");
    label.setAttribute("font-size", "16");
    label.textContent = "BTC";
    svg.appendChild(label);

    // Filter flow data by category
    const filteredFlowData = activeCategory === 'all' ? processedFlowData : 
      processedFlowData.filter(flow => {
        const cryptoInfo = cryptoData?.find(c => c.symbol === flow.to || c.symbol === flow.from);
        return cryptoInfo?.category === activeCategory;
      });

    // Draw orbital nodes
    filteredFlowData.slice(0, 12).forEach((flow, index) => {
      const angle = (index * Math.PI * 2 / 12);
      const orbitRadius = 150 + (index % 3) * 60;
      
      const x = centerX + Math.cos(angle) * orbitRadius;
      const y = centerY + Math.sin(angle) * orbitRadius;

      // Determine node color based on predictions
      const prediction = filteredPredictions?.find(p => p.symbol === flow.to || p.symbol === flow.from);
      let color = flow.value > 0 ? '#10b981' : '#ef4444';
      
      if (prediction) {
        color = prediction.bullish ? '#00ff88' : '#ff3366';
      }

      // Draw orbit path
      const orbitPath = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      orbitPath.setAttribute("cx", centerX.toString());
      orbitPath.setAttribute("cy", centerY.toString());
      orbitPath.setAttribute("r", orbitRadius.toString());
      orbitPath.setAttribute("fill", "none");
      orbitPath.setAttribute("stroke", "rgba(255, 255, 255, 0.1)");
      orbitPath.setAttribute("stroke-width", "1");
      orbitPath.setAttribute("stroke-dasharray", "5,5");
      svg.appendChild(orbitPath);

      // Draw connection line
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", centerX.toString());
      line.setAttribute("y1", centerY.toString());
      line.setAttribute("x2", x.toString());
      line.setAttribute("y2", y.toString());
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "2");
      line.setAttribute("opacity", "0.6");
      svg.appendChild(line);

      // Draw orbital node
      const node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      node.setAttribute("cx", x.toString());
      node.setAttribute("cy", y.toString());
      node.setAttribute("r", "20");
      node.setAttribute("fill", color);
      node.setAttribute("stroke", "#ffffff");
      node.setAttribute("stroke-width", "2");
      svg.appendChild(node);

      // Add node label
      const nodeLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      nodeLabel.setAttribute("x", x.toString());
      nodeLabel.setAttribute("y", (y + 35).toString());
      nodeLabel.setAttribute("text-anchor", "middle");
      nodeLabel.setAttribute("fill", "white");
      nodeLabel.setAttribute("font-size", "12");
      const symbol = flow.to !== 'BTC' ? flow.to : flow.from;
      nodeLabel.textContent = symbol || 'N/A';
      svg.appendChild(nodeLabel);

      // Add value indicator
      const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valueLabel.setAttribute("x", x.toString());
      valueLabel.setAttribute("y", (y + 50).toString());
      valueLabel.setAttribute("text-anchor", "middle");
      valueLabel.setAttribute("fill", flow.value > 0 ? '#10b981' : '#ef4444');
      valueLabel.setAttribute("font-size", "10");
      const valueText = `${flow.value > 0 ? '+' : ''}${flow.value.toFixed(1)}%`;
      valueLabel.textContent = valueText;
      svg.appendChild(valueLabel);
    });

  }, [processedFlowData, dimensions, zoomLevel, filteredPredictions, activeCategory, cryptoData]);

  if (isLoading || loadingCryptoData || loadingSignals || loadingAI) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading visualization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center text-red-400">
          <p className="text-lg mb-2">⚠️ Error loading data</p>
          <p className="text-sm text-slate-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!processedFlowData || processedFlowData.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <p className="text-slate-400 text-lg">🌌 No flow data available</p>
          <p className="text-slate-500 text-sm">Waiting for market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg 
        ref={svgRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Overlay controls */}
      <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-2">
        <div className="text-xs text-white/60">
          Zoom: {zoomLevel}%
        </div>
        <div className="text-xs text-white/60">
          Timeframe: {chartTimeframe}
        </div>
        {activeCategory !== 'all' && (
          <div className="text-xs text-white/60">
            Category: {activeCategory}
          </div>
        )}
      </div>
    </div>
  );
};