import React, { useEffect, useState, useRef } from 'react';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePriceActionSignals } from '@/hooks/usePriceActionSignals';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';
import { SimulationProvider, useSimulation } from './SimulationContext';
import NodeRendererComponent from './NodeRendererComponent';
import LinkRendererComponent from './LinkRendererComponent';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
  predictions?: Prediction[];
  chartTimeframe?: string;
  activeCategory?: string;
  showLines?: boolean;
}

interface OrbitNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  angle: number;
  orbitRadius: number;
  color: string;
  symbol: string;
  value: number;
  isCentral?: boolean;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ 
  flowData, 
  zoomLevel = 70,
  predictions = [],
  chartTimeframe = '4h',
  activeCategory = 'all',
  showLines = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [nodes, setNodes] = useState<OrbitNode[]>([]);

  const { data: cryptoData, isLoading: loadingCryptoData } = useCryptoData();
  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(['BTC', 'ETH']);
  const { insights: aiInsights, isLoading: loadingAI } = useAdvancedAI();

  // Dimension tracking
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

  // Create nodes from flow data
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !dimensions.width) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Central node (BTC)
    const centralNode: OrbitNode = {
      id: 'BTC',
      x: centerX,
      y: centerY,
      radius: 35,
      angle: 0,
      orbitRadius: 0,
      color: '#f59e0b',
      symbol: 'BTC',
      value: 0,
      isCentral: true
    };

    // Orbital nodes
    const orbitalNodes: OrbitNode[] = flowData.slice(0, 12).map((flow, index) => {
      const orbitLayer = Math.floor(index / 6) + 1;
      const nodeInOrbit = index % 6;
      const orbitRadius = 120 + (orbitLayer * 80);
      const angle = (nodeInOrbit / 6) * 2 * Math.PI;

      return {
        id: flow.to !== 'BTC' ? flow.to : flow.from,
        x: centerX + Math.cos(angle) * orbitRadius,
        y: centerY + Math.sin(angle) * orbitRadius,
        radius: 20,
        angle,
        orbitRadius,
        color: flow.value > 0 ? '#10b981' : '#ef4444',
        symbol: flow.to !== 'BTC' ? flow.to : flow.from,
        value: flow.value
      };
    });

    setNodes([centralNode, ...orbitalNodes]);
  }, [flowData, dimensions]);

  // Simple SVG rendering
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = svgRef.current;
    
    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    svg.setAttribute("width", dimensions.width.toString());
    svg.setAttribute("height", dimensions.height.toString());

    // Create simple starfield
    for (let i = 0; i < 100; i++) {
      const star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      star.setAttribute("cx", (Math.random() * dimensions.width).toString());
      star.setAttribute("cy", (Math.random() * dimensions.height).toString());
      star.setAttribute("r", "1");
      star.setAttribute("fill", "white");
      star.setAttribute("opacity", (Math.random() * 0.8 + 0.2).toString());
      svg.appendChild(star);
    }

    // Create nodes
    nodes.forEach(node => {
      const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      
      // Glow
      const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      glow.setAttribute("cx", node.x.toString());
      glow.setAttribute("cy", node.y.toString());
      glow.setAttribute("r", (node.radius * 1.5).toString());
      glow.setAttribute("fill", node.color);
      glow.setAttribute("opacity", "0.3");
      nodeGroup.appendChild(glow);

      // Main circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", node.x.toString());
      circle.setAttribute("cy", node.y.toString());
      circle.setAttribute("r", node.radius.toString());
      circle.setAttribute("fill", node.color);
      circle.setAttribute("stroke", "#ffffff");
      circle.setAttribute("stroke-width", "2");
      nodeGroup.appendChild(circle);

      // Label
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", node.x.toString());
      label.setAttribute("y", (node.y + node.radius + 20).toString());
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "white");
      label.setAttribute("font-size", "12");
      label.textContent = node.symbol;
      nodeGroup.appendChild(label);

      svg.appendChild(nodeGroup);
    });

    // Simple animation
    const animate = () => {
      nodes.forEach((node, index) => {
        if (!node.isCentral) {
          node.angle += 0.001;
          node.x = dimensions.width / 2 + Math.cos(node.angle) * node.orbitRadius;
          node.y = dimensions.height / 2 + Math.sin(node.angle) * node.orbitRadius;
          
          const nodeGroup = svg.children[100 + index + 1];
          if (nodeGroup) {
            const glow = nodeGroup.children[0];
            const circle = nodeGroup.children[1];
            const label = nodeGroup.children[2];
            
            if (glow && circle && label) {
              glow.setAttribute("cx", node.x.toString());
              glow.setAttribute("cy", node.y.toString());
              circle.setAttribute("cx", node.x.toString());
              circle.setAttribute("cy", node.y.toString());
              label.setAttribute("x", node.x.toString());
              label.setAttribute("y", (node.y + node.radius + 20).toString());
            }
          }
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, dimensions]);

  if (loadingCryptoData || loadingSignals || loadingAI) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading solar system...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg 
        ref={svgRef}
        className="w-full h-full"
        style={{ display: 'block', background: 'linear-gradient(to bottom, #0a0f2c, #1a1a40)' }}
      />
    </div>
  );
};