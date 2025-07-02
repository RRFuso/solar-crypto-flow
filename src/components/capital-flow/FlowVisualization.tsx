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

const FlowVisualizationCore: React.FC<FlowVisualizationProps> = ({ 
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

  // **RESTORED: Dimension tracking**
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

  // **RESTORED: Solar system node creation and positioning**
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !dimensions.width) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Filter flow data by category
    const filteredFlowData = activeCategory === 'all' ? flowData : 
      flowData.filter(flow => {
        const cryptoInfo = cryptoData?.find(c => c.symbol === flow.to || c.symbol === flow.from);
        return cryptoInfo?.category === activeCategory;
      });

    // Create central node (BTC)
    const centralNode: OrbitNode = {
      id: 'BTC',
      x: centerX,
      y: centerY,
      radius: 35 + (zoomLevel - 70) * 0.3,
      angle: 0,
      orbitRadius: 0,
      color: '#f59e0b',
      symbol: 'BTC',
      value: 0,
      isCentral: true
    };

    // Create orbital nodes
    const orbitalNodes: OrbitNode[] = filteredFlowData.slice(0, 15).map((flow, index) => {
      const prediction = predictions?.find(p => p.symbol === flow.to || p.symbol === flow.from);
      let color = flow.value > 0 ? '#10b981' : '#ef4444';
      
      if (prediction) {
        color = prediction.bullish ? '#00ff88' : '#ff3366';
      }

      const orbitLayer = Math.floor(index / 6) + 1;
      const nodeInOrbit = index % 6;
      const orbitRadius = 120 + (orbitLayer * 80);
      const angle = (nodeInOrbit / 6) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;

      const symbol = flow.to !== 'BTC' ? flow.to : flow.from;

      return {
        id: symbol || `node-${index}`,
        x: centerX + Math.cos(angle) * orbitRadius,
        y: centerY + Math.sin(angle) * orbitRadius,
        radius: 18 + (zoomLevel - 70) * 0.2,
        angle,
        orbitRadius,
        color,
        symbol: symbol || 'N/A',
        value: flow.value
      };
    });

    setNodes([centralNode, ...orbitalNodes]);
  }, [flowData, dimensions, zoomLevel, predictions, activeCategory, cryptoData]);

  // **RESTORED: Complete SVG orbital animation system**
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = svgRef.current;
    
    // Clear and setup SVG
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    svg.setAttribute("width", dimensions.width.toString());
    svg.setAttribute("height", dimensions.height.toString());
    svg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

    // **RESTORED: Enhanced starfield background**
    const starfieldGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    starfieldGroup.setAttribute("class", "starfield");
    
    for (let i = 0; i < 200; i++) {
      const star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      star.setAttribute("cx", (Math.random() * dimensions.width).toString());
      star.setAttribute("cy", (Math.random() * dimensions.height).toString());
      star.setAttribute("r", (Math.random() * 1.5 + 0.5).toString());
      star.setAttribute("fill", "white");
      star.setAttribute("opacity", (Math.random() * 0.8 + 0.2).toString());
      
      // Twinkling animation
      if (Math.random() > 0.7) {
        const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animate.setAttribute("attributeName", "opacity");
        animate.setAttribute("values", "0.2;0.8;0.2");
        animate.setAttribute("dur", `${2 + Math.random() * 4}s`);
        animate.setAttribute("repeatCount", "indefinite");
        star.appendChild(animate);
      }
      
      starfieldGroup.appendChild(star);
    }
    svg.appendChild(starfieldGroup);

    // **RESTORED: Orbital rings**
    const orbitGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    orbitGroup.setAttribute("class", "orbits");
    
    const orbitRadii = [120, 200, 280, 360];
    orbitRadii.forEach(radius => {
      if (radius < Math.min(dimensions.width, dimensions.height) * 0.4) {
        const orbit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        orbit.setAttribute("cx", (dimensions.width / 2).toString());
        orbit.setAttribute("cy", (dimensions.height / 2).toString());
        orbit.setAttribute("r", radius.toString());
        orbit.setAttribute("fill", "none");
        orbit.setAttribute("stroke", "rgba(255, 255, 255, 0.1)");
        orbit.setAttribute("stroke-width", "1");
        orbit.setAttribute("stroke-dasharray", "5,5");
        orbitGroup.appendChild(orbit);
      }
    });
    svg.appendChild(orbitGroup);

    // **RESTORED: Node creation**
    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodesGroup.setAttribute("class", "nodes");
    
    nodes.forEach((node, index) => {
      // Create node group
      const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      nodeGroup.setAttribute("class", "node");
      nodeGroup.setAttribute("data-id", node.id);
      nodeGroup.setAttribute("transform", `translate(${node.x}, ${node.y})`);

      // Glow effect
      const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      glow.setAttribute("r", (node.radius * 1.5).toString());
      glow.setAttribute("fill", node.color);
      glow.setAttribute("opacity", "0.3");
      glow.setAttribute("filter", "blur(8px)");
      nodeGroup.appendChild(glow);

      // Main node circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", node.radius.toString());
      circle.setAttribute("fill", node.color);
      circle.setAttribute("stroke", "#ffffff");
      circle.setAttribute("stroke-width", node.isCentral ? "3" : "2");
      nodeGroup.appendChild(circle);

      // Node label
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dy", node.isCentral ? "0.3em" : `${node.radius + 18}px`);
      label.setAttribute("fill", "white");
      label.setAttribute("font-weight", "bold");
      label.setAttribute("font-size", node.isCentral ? "16" : "12");
      label.textContent = node.symbol;
      nodeGroup.appendChild(label);

      // Value indicator for orbital nodes
      if (!node.isCentral) {
        const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueLabel.setAttribute("text-anchor", "middle");
        valueLabel.setAttribute("dy", `${node.radius + 32}px`);
        valueLabel.setAttribute("fill", node.value > 0 ? '#10b981' : '#ef4444');
        valueLabel.setAttribute("font-size", "10");
        valueLabel.textContent = `${node.value > 0 ? '+' : ''}${node.value.toFixed(1)}%`;
        nodeGroup.appendChild(valueLabel);
      }

      nodesGroup.appendChild(nodeGroup);
    });
    svg.appendChild(nodesGroup);

    // **RESTORED: Connection lines**
    if (showLines) {
      const linksGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      linksGroup.setAttribute("class", "links");
      
      nodes.forEach(node => {
        if (!node.isCentral) {
          const centralNode = nodes.find(n => n.isCentral);
          if (centralNode) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("class", "connection-line");
            line.setAttribute("data-source", centralNode.id);
            line.setAttribute("data-target", node.id);
            line.setAttribute("x1", centralNode.x.toString());
            line.setAttribute("y1", centralNode.y.toString());
            line.setAttribute("x2", node.x.toString());
            line.setAttribute("y2", node.y.toString());
            line.setAttribute("stroke", node.color);
            line.setAttribute("stroke-width", "2");
            line.setAttribute("opacity", "0.6");
            linksGroup.appendChild(line);
          }
        }
      });
      svg.appendChild(linksGroup);
    }

    // **RESTORED: Orbital animation**
    const animate = () => {
      nodes.forEach((node, index) => {
        if (!node.isCentral) {
          // Update orbital position
          node.angle += 0.0001 * (1 + index * 0.1);
          node.x = dimensions.width / 2 + Math.cos(node.angle) * node.orbitRadius;
          node.y = dimensions.height / 2 + Math.sin(node.angle) * node.orbitRadius;
        }
      });

      // Update DOM elements
      const nodeElements = svg.querySelectorAll('.node');
      nodeElements.forEach((nodeElement, index) => {
        if (nodes[index]) {
          nodeElement.setAttribute('transform', `translate(${nodes[index].x}, ${nodes[index].y})`);
        }
      });

      // Update connection lines
      if (showLines) {
        const lineElements = svg.querySelectorAll('.connection-line');
        lineElements.forEach(lineElement => {
          const sourceId = lineElement.getAttribute('data-source');
          const targetId = lineElement.getAttribute('data-target');
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          if (sourceNode && targetNode) {
            lineElement.setAttribute('x1', sourceNode.x.toString());
            lineElement.setAttribute('y1', sourceNode.y.toString());
            lineElement.setAttribute('x2', targetNode.x.toString());
            lineElement.setAttribute('y2', targetNode.y.toString());
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, dimensions, showLines]);

  if (loadingCryptoData || loadingSignals || loadingAI) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading AI-powered visualization...</p>
        </div>
      </div>
    );
  }

  if (!flowData || flowData.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <p className="text-slate-400 text-lg">🌌 No flow data available</p>
          <p className="text-slate-500 text-sm">Waiting for market data...</p>
        </div>
      </div>
    );
  }

  const simulation = useSimulation();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Update simulation when data changes
  useEffect(() => {
    simulation.actions.setDimensions(dimensions);
  }, [dimensions, simulation.actions]);

  useEffect(() => {
    simulation.actions.setZoom(zoomLevel);
  }, [zoomLevel, simulation.actions]);

  useEffect(() => {
    simulation.actions.toggleLines(showLines);
  }, [showLines, simulation.actions]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
  };

  const handleNodeHover = (nodeId: string | null) => {
    simulation.actions.hoverNode(nodeId);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg 
        ref={svgRef}
        className="w-full h-full"
        style={{ display: 'block', background: 'linear-gradient(to bottom, #0a0f2c, #1a1a40)' }}
      />
      
      {/* Enhanced Node Renderer */}
      <NodeRendererComponent
        nodes={simulation.state.nodes}
        centralNode={simulation.state.centralNode}
        svgRef={svgRef}
        zoomLevel={zoomLevel}
        predictions={predictions}
        aiInsights={aiInsights}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
      />
      
      {/* Enhanced Link Renderer */}
      <LinkRendererComponent
        nodes={simulation.state.nodes}
        centralNode={simulation.state.centralNode}
        flowData={flowData}
        svgRef={svgRef}
        showLines={showLines}
        selectedNodeId={selectedNodeId}
        predictions={predictions}
      />
      
      {/* **RESTORED: Enhanced overlay controls** */}
      <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10">
        <div className="text-xs text-white/70 font-medium mb-1">
          ☀️ Solar System View
        </div>
        <div className="text-xs text-white/60">
          Zoom: {zoomLevel}% | Nodes: {simulation.state.nodes.length}
        </div>
        <div className="text-xs text-white/60">
          Timeframe: {chartTimeframe}
        </div>
        {activeCategory !== 'all' && (
          <div className="text-xs text-white/60">
            Category: {activeCategory}
          </div>
        )}
        {selectedNodeId && (
          <div className="text-xs text-yellow-400">
            Selected: {selectedNodeId}
          </div>
        )}
      </div>
      
      {/* AI insights indicator */}
      {aiInsights && aiInsights.size > 0 && (
        <div className="absolute bottom-4 right-4 bg-purple-900/30 backdrop-blur-sm rounded-lg p-2 border border-purple-400/20">
          <div className="text-xs text-purple-300 font-medium">
            🧠 AI Analysis: {aiInsights.size} assets
          </div>
        </div>
      )}
    </div>
  );
};

export const FlowVisualization: React.FC<FlowVisualizationProps> = (props) => {
  return (
    <SimulationProvider flowData={props.flowData} predictions={props.predictions}>
      <FlowVisualizationCore {...props} />
    </SimulationProvider>
  );
};