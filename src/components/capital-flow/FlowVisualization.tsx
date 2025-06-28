import React, { useEffect, useState, useRef } from 'react';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePriceActionSignals } from '@/hooks/usePriceActionSignals';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
  predictions?: Prediction[];
  chartTimeframe?: string;
  activeCategory?: string;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ 
  flowData, 
  zoomLevel = 60,
  predictions = [],
  chartTimeframe = '4h',
  activeCategory = 'all'
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
    if (!svgRef.current || !flowData || flowData.length === 0) return;

    const svg = svgRef.current;
    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    svg.setAttribute("width", dimensions.width.toString());
    svg.setAttribute("height", dimensions.height.toString());

    // Create background with Solar theme
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    // Solar gradient background
    const solarGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    solarGradient.setAttribute("id", "solarBackground");
    solarGradient.setAttribute("cx", "50%");
    solarGradient.setAttribute("cy", "50%");
    solarGradient.setAttribute("r", "70%");

    const solarStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    solarStop1.setAttribute("offset", "0%");
    solarStop1.setAttribute("stop-color", "#1a1a2e");

    const solarStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    solarStop2.setAttribute("offset", "50%");
    solarStop2.setAttribute("stop-color", "#16213e");

    const solarStop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    solarStop3.setAttribute("offset", "100%");
    solarStop3.setAttribute("stop-color", "#0f0f23");

    solarGradient.appendChild(solarStop1);
    solarGradient.appendChild(solarStop2);
    solarGradient.appendChild(solarStop3);
    defs.appendChild(solarGradient);

    // Solar glow effect
    const solarGlow = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    solarGlow.setAttribute("id", "solarGlow");
    
    const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGaussianBlur.setAttribute("stdDeviation", "3");
    feGaussianBlur.setAttribute("result", "coloredBlur");
    
    const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode1.setAttribute("in", "coloredBlur");
    const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode2.setAttribute("in", "SourceGraphic");
    
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    solarGlow.appendChild(feGaussianBlur);
    solarGlow.appendChild(feMerge);
    defs.appendChild(solarGlow);

    svg.appendChild(defs);

    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", "url(#solarBackground)");
    svg.appendChild(background);

    // Draw central Solar node (BTC with solar theme)
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // Solar corona effect
    const corona = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    corona.setAttribute("cx", centerX.toString());
    corona.setAttribute("cy", centerY.toString());
    corona.setAttribute("r", "60");
    corona.setAttribute("fill", "none");
    corona.setAttribute("stroke", "#fbbf24");
    corona.setAttribute("stroke-width", "2");
    corona.setAttribute("opacity", "0.3");
    corona.setAttribute("filter", "url(#solarGlow)");
    svg.appendChild(corona);

    // Central solar node
    const centralNode = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centralNode.setAttribute("cx", centerX.toString());
    centralNode.setAttribute("cy", centerY.toString());
    centralNode.setAttribute("r", "45");
    centralNode.setAttribute("fill", "url(#solarGradient)");
    centralNode.setAttribute("stroke", "#f59e0b");
    centralNode.setAttribute("stroke-width", "3");
    centralNode.setAttribute("filter", "url(#solarGlow)");
    svg.appendChild(centralNode);

    // Solar gradient for central node
    const centralGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    centralGradient.setAttribute("id", "solarGradient");
    centralGradient.setAttribute("cx", "30%");
    centralGradient.setAttribute("cy", "30%");
    centralGradient.setAttribute("r", "70%");

    const centralStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    centralStop1.setAttribute("offset", "0%");
    centralStop1.setAttribute("stop-color", "#fbbf24");

    const centralStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    centralStop2.setAttribute("offset", "70%");
    centralStop2.setAttribute("stop-color", "#f59e0b");

    const centralStop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    centralStop3.setAttribute("offset", "100%");
    centralStop3.setAttribute("stop-color", "#d97706");

    centralGradient.appendChild(centralStop1);
    centralGradient.appendChild(centralStop2);
    centralGradient.appendChild(centralStop3);
    defs.appendChild(centralGradient);

    // Add Solar Crypto label
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", centerX.toString());
    label.setAttribute("y", (centerY - 5).toString());
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dy", "0.3em");
    label.setAttribute("fill", "#1f2937");
    label.setAttribute("font-weight", "bold");
    label.setAttribute("font-size", "14");
    label.textContent = "☀";
    svg.appendChild(label);

    const subLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    subLabel.setAttribute("x", centerX.toString());
    subLabel.setAttribute("y", (centerY + 10).toString());
    subLabel.setAttribute("text-anchor", "middle");
    subLabel.setAttribute("dy", "0.3em");
    subLabel.setAttribute("fill", "#1f2937");
    subLabel.setAttribute("font-weight", "bold");
    subLabel.setAttribute("font-size", "10");
    subLabel.textContent = "SOLAR";
    svg.appendChild(subLabel);

    // Filter flow data by category
    const filteredFlowData = activeCategory === 'all' ? flowData : 
      flowData.filter(flow => {
        const cryptoInfo = cryptoData?.find(c => c.symbol === flow.to || c.symbol === flow.from);
        return cryptoInfo?.category === activeCategory;
      });

    // Draw orbital nodes with solar system theme
    filteredFlowData.slice(0, 12).forEach((flow, index) => {
      const angle = (index * Math.PI * 2 / 12) + (Date.now() * 0.0001); // Slow rotation
      const orbitRadius = 120 + (index % 3) * 50;
      
      const x = centerX + Math.cos(angle) * orbitRadius * (zoomLevel / 60);
      const y = centerY + Math.sin(angle) * orbitRadius * (zoomLevel / 60);

      // Determine node color based on predictions and AI insights
      const prediction = predictions?.find(p => p.symbol === flow.to || p.symbol === flow.from);
      const symbol = flow.to !== 'BTC' ? flow.to : flow.from;
      const aiInsight = aiInsights?.get(symbol);
      
      let color = flow.value > 0 ? '#10b981' : '#ef4444';
      
      if (prediction) {
        if (prediction.explosivePotential === 'High') {
          color = '#ff6b6b';
        } else if (prediction.bullish) {
          color = '#4ecdc4';
        } else {
          color = '#ffa726';
        }
      }

      // Draw orbit path with solar theme
      const orbitPath = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      orbitPath.setAttribute("cx", centerX.toString());
      orbitPath.setAttribute("cy", centerY.toString());
      orbitPath.setAttribute("r", (orbitRadius * (zoomLevel / 60)).toString());
      orbitPath.setAttribute("fill", "none");
      orbitPath.setAttribute("stroke", "rgba(251, 191, 36, 0.2)");
      orbitPath.setAttribute("stroke-width", "1");
      orbitPath.setAttribute("stroke-dasharray", "3,3");
      svg.appendChild(orbitPath);

      // Draw energy flow line
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", centerX.toString());
      line.setAttribute("y1", centerY.toString());
      line.setAttribute("x2", x.toString());
      line.setAttribute("y2", y.toString());
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "2");
      line.setAttribute("opacity", "0.7");
      line.setAttribute("filter", "url(#solarGlow)");
      svg.appendChild(line);

      // Draw planetary node
      const nodeRadius = prediction?.explosivePotential === 'High' ? 25 : 18;
      const node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      node.setAttribute("cx", x.toString());
      node.setAttribute("cy", y.toString());
      node.setAttribute("r", nodeRadius.toString());
      node.setAttribute("fill", color);
      node.setAttribute("stroke", "#ffffff");
      node.setAttribute("stroke-width", "2");
      node.setAttribute("filter", "url(#solarGlow)");
      svg.appendChild(node);

      // Add AI insight indicator
      if (aiInsight && aiInsight.confidence > 70) {
        const aiIndicator = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        aiIndicator.setAttribute("cx", (x + 15).toString());
        aiIndicator.setAttribute("cy", (y - 15).toString());
        aiIndicator.setAttribute("r", "8");
        aiIndicator.setAttribute("fill", "#8b5cf6");
        aiIndicator.setAttribute("stroke", "#ffffff");
        aiIndicator.setAttribute("stroke-width", "1");
        svg.appendChild(aiIndicator);

        const aiText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        aiText.setAttribute("x", (x + 15).toString());
        aiText.setAttribute("y", (y - 15).toString());
        aiText.setAttribute("text-anchor", "middle");
        aiText.setAttribute("dy", "0.3em");
        aiText.setAttribute("fill", "white");
        aiText.setAttribute("font-size", "8");
        aiText.setAttribute("font-weight", "bold");
        aiText.textContent = "AI";
        svg.appendChild(aiText);
      }

      // Add node label
      const nodeLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      nodeLabel.setAttribute("x", x.toString());
      nodeLabel.setAttribute("y", (y + nodeRadius + 15).toString());
      nodeLabel.setAttribute("text-anchor", "middle");
      nodeLabel.setAttribute("fill", "white");
      nodeLabel.setAttribute("font-size", "11");
      nodeLabel.setAttribute("font-weight", "bold");
      const displaySymbol = symbol || 'N/A';
      nodeLabel.textContent = displaySymbol;
      svg.appendChild(nodeLabel);

      // Add value indicator with solar theme
      const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valueLabel.setAttribute("x", x.toString());
      valueLabel.setAttribute("y", (y + nodeRadius + 28).toString());
      valueLabel.setAttribute("text-anchor", "middle");
      valueLabel.setAttribute("fill", flow.value > 0 ? '#4ade80' : '#f87171');
      valueLabel.setAttribute("font-size", "9");
      const valueText = `${flow.value > 0 ? '+' : ''}${flow.value.toFixed(1)}%`;
      valueLabel.textContent = valueText;
      svg.appendChild(valueLabel);

      // Add explosive potential indicator
      if (prediction?.explosivePotential === 'High') {
        const explosiveIndicator = document.createElementNS("http://www.w3.org/2000/svg", "text");
        explosiveIndicator.setAttribute("x", x.toString());
        explosiveIndicator.setAttribute("y", (y - nodeRadius - 5).toString());
        explosiveIndicator.setAttribute("text-anchor", "middle");
        explosiveIndicator.setAttribute("fill", "#ff6b6b");
        explosiveIndicator.setAttribute("font-size", "16");
        explosiveIndicator.textContent = "🚀";
        svg.appendChild(explosiveIndicator);
      }
    });

    // Add solar flares animation
    const createSolarFlare = (startAngle: number) => {
      const flareLength = 80;
      const startX = centerX + Math.cos(startAngle) * 45;
      const startY = centerY + Math.sin(startAngle) * 45;
      const endX = centerX + Math.cos(startAngle) * (45 + flareLength);
      const endY = centerY + Math.sin(startAngle) * (45 + flareLength);

      const flare = document.createElementNS("http://www.w3.org/2000/svg", "line");
      flare.setAttribute("x1", startX.toString());
      flare.setAttribute("y1", startY.toString());
      flare.setAttribute("x2", endX.toString());
      flare.setAttribute("y2", endY.toString());
      flare.setAttribute("stroke", "#fbbf24");
      flare.setAttribute("stroke-width", "3");
      flare.setAttribute("opacity", "0.6");
      flare.setAttribute("filter", "url(#solarGlow)");
      
      // Add animation
      const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      animate.setAttribute("attributeName", "opacity");
      animate.setAttribute("values", "0.6;0.2;0.6");
      animate.setAttribute("dur", "3s");
      animate.setAttribute("repeatCount", "indefinite");
      flare.appendChild(animate);
      
      svg.appendChild(flare);
    };

    // Create solar flares
    for (let i = 0; i < 8; i++) {
      createSolarFlare((i * Math.PI * 2) / 8);
    }

  }, [flowData, dimensions, zoomLevel, predictions, activeCategory, cryptoData, aiInsights]);

  if (loadingCryptoData || loadingSignals || loadingAI) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-black font-bold text-4xl">☀</span>
            </div>
            <div className="absolute inset-0 -m-4">
              <div className="w-32 h-32 border border-yellow-400/30 rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-slate-400">Loading Solar Crypto AI visualization...</p>
        </div>
      </div>
    );
  }

  if (!flowData || flowData.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-black font-bold text-4xl">☀</span>
          </div>
          <p className="text-slate-400 text-lg">🌌 Solar system initializing...</p>
          <p className="text-slate-500 text-sm">Waiting for cosmic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg 
        ref={svgRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Solar overlay controls */}
      <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-yellow-400/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-400 text-lg">☀</span>
          <span className="text-white font-bold text-sm">Solar Crypto</span>
        </div>
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
        <div className="text-xs text-yellow-400/80 mt-1">
          AI-Powered Analysis
        </div>
      </div>

      {/* Solar system legend */}
      <div className="absolute bottom-4 left-4 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-yellow-400/30">
        <div className="text-xs text-white space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
            <span>Solar Core (BTC)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span>High Explosive Potential</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>AI High Confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🚀</span>
            <span>Explosive Signal</span>
          </div>
        </div>
      </div>
    </div>
  );
};