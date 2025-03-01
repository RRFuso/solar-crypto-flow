import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCcw, Bitcoin, Diamond, Coins } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { fetchMarketData } from '@/lib/marketData';
import { useToast } from '@/hooks/use-toast';
import * as d3 from 'd3';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const CapitalFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const { toast } = useToast();
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const { data: flowData, isLoading, error, refetch } = useQuery({
    queryKey: ['capital-flow', timeframe],
    queryFn: () => fetchMarketData(timeframe),
    refetchInterval: 30000,
    meta: {
      onError: () => {
        toast({
          title: "Error fetching data",
          description: "Failed to fetch market data. Please try again later.",
          variant: "destructive"
        });
      }
    }
  });

  const maxFlow = Math.max(...(flowData?.map(d => d.value) || [1]));

  // Set up D3 visualization
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 350;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;");
    
    // Create unique nodes for all cryptos in the flows
    const nodes = [];
    const uniqueCryptos = new Set();
    
    flowData.forEach(flow => {
      if (!uniqueCryptos.has(flow.from)) {
        uniqueCryptos.add(flow.from);
        nodes.push({ id: flow.from, value: 0 });
      }
      if (!uniqueCryptos.has(flow.to)) {
        uniqueCryptos.add(flow.to);
        nodes.push({ id: flow.to, value: 0 });
      }
      
      // Update values based on flows
      const fromNode = nodes.find(n => n.id === flow.from);
      const toNode = nodes.find(n => n.id === flow.to);
      
      if (fromNode) fromNode.value -= flow.value;
      if (toNode) toNode.value += flow.value;
    });
    
    // Calculate node size based on value
    const minRadius = 30;
    const maxRadius = 60;
    nodes.forEach(node => {
      const absValue = Math.abs(node.value);
      node.radius = minRadius + (absValue / maxFlow) * (maxRadius - minRadius);
    });
    
    // Set up force simulation with boundaries to keep nodes in view
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.radius + 10))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));
    
    // Add boundary forces to keep nodes in view
    simulation.on("tick", () => {
      nodes.forEach(node => {
        // Add padding equal to node radius
        const padding = node.radius || minRadius;
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      });
    });
    
    // Draw links
    const links = flowData.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage
    }));
    
    const linkGroup = svg.append("g").attr("class", "links");
    
    const link = linkGroup.selectAll("line")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
      .attr("stroke-width", d => 2 + (Math.abs(d.value) / maxFlow) * 6)
      .attr("fill", "none")
      .attr("stroke-dasharray", "10,10")
      .attr("opacity", 0.7);
    
    // Create markers (arrows)
    svg.append("defs").selectAll("marker")
      .data(links)
      .enter().append("marker")
      .attr("id", (d, i) => `arrow-${i}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
      .attr("d", "M0,-5L10,0L0,5");
    
    link.attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
    // Animate the flow
    link.each(function(d, i) {
      const path = d3.select(this);
      
      // Create animated flow effect
      svg.append("circle")
        .attr("r", 3)
        .attr("fill", d.percentage > 0 ? "#00ffcc" : "#ff0066")
        .attr("class", "flow-particle")
        .attr("opacity", 0.8)
        .append("animate")
        .attr("attributeName", "opacity")
        .attr("values", "0;1;0")
        .attr("dur", "4s")
        .attr("repeatCount", "indefinite");
    });
    
    // Draw circles for nodes
    const nodeGroup = svg.append("g").attr("class", "nodes");
    
    const node = nodeGroup.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Add circles
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", "#0ea5e9")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7);
    
    // Add text
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text(d => d.id);
    
    // Add pulsating effect
    node.selectAll("circle")
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", d => `${d.radius};${d.radius * 1.05};${d.radius}`)
      .attr("dur", "3s")
      .attr("repeatCount", "indefinite");
    
    function getNodeColor(node) {
      if (node.id === "BTC") return "#F7931A"; // Bitcoin color
      if (node.id === "LARGE") return "#0ea5e9"; // Large caps
      if (node.id === "ETH") return "#627EEA"; // Ethereum color
      return "#1c2030"; // Default
    }
    
    // Update positions on each tick
    simulation.on("tick", () => {
      // Keep nodes within bounds
      nodes.forEach(d => {
        const radius = d.radius || minRadius;
        d.x = Math.max(radius, Math.min(width - radius, d.x));
        d.y = Math.max(radius, Math.min(height - radius, d.y));
      });
      
      link.attr("d", d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 2;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });
      
      svg.selectAll(".flow-particle")
        .attr("transform", function(d, i) {
          const link = links[i % links.length];
          if (!link) return "";
          
          const t = (Date.now() / 100) % 100 / 100;
          
          // Interpolate position along the path
          const path = svg.select(`.link:nth-child(${(i % links.length) + 1})`).node();
          if (!path) return "";
          
          try {
            const point = path.getPointAtLength(path.getTotalLength() * t);
            return `translate(${point.x}, ${point.y})`;
          } catch (e) {
            return "";
          }
        });
      
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return () => {
      simulation.stop();
    };
  }, [flowData, maxFlow]);

  const getCryptoIcon = (symbol: string) => {
    switch (symbol.toUpperCase()) {
      case 'BTC':
        return <Bitcoin className="w-6 h-6 text-neon-blue" />;
      case 'LARGE':
        return <Diamond className="w-6 h-6 text-neon-blue" />;
      default:
        return <Coins className="w-6 h-6 text-neon-blue" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-blue via-neon-blue/90 to-neon-blue/70 bg-clip-text text-transparent">
          Capital Flow 🚀
        </h2>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            className="bg-white/5 border-white/10 hover:bg-white/10"
            onClick={() => refetch()}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-neon-red">
          Failed to load market data
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* D3 Visualization */}
          <div ref={containerRef} className="w-full flex-1">
            <svg ref={svgRef} className="w-full h-full" />
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neon-green"></div>
              <span>Capital Inflow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neon-red"></div>
              <span>Capital Outflow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F7931A]"></div>
              <span>Bitcoin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neon-blue"></div>
              <span>Large Caps</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalFlowPanel;
