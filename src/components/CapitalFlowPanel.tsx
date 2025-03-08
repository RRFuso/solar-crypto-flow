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
    const height = 400;
    
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
    
    // Always ensure BTC is the first node (will be placed in center)
    nodes.push({ id: "BTC", value: 0, isBitcoin: true });
    uniqueCryptos.add("BTC");
    
    flowData.forEach(flow => {
      if (!uniqueCryptos.has(flow.from)) {
        uniqueCryptos.add(flow.from);
        nodes.push({ id: flow.from, value: 0, isBitcoin: flow.from === "BTC" });
      }
      if (!uniqueCryptos.has(flow.to)) {
        uniqueCryptos.add(flow.to);
        nodes.push({ id: flow.to, value: 0, isBitcoin: flow.to === "BTC" });
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
      node.radius = node.isBitcoin 
        ? maxRadius + 10 // Make BTC larger
        : minRadius + (absValue / maxFlow) * (maxRadius - minRadius);
    });
    
    // Create defs for glows and gradients
    const defs = svg.append("defs");
    
    // Create glow filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    
    // Set up force simulation with radial layout
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-500))
      .force("collision", d3.forceCollide().radius(d => d.radius + 25))
      .force("radial", d3.forceRadial(d => d.isBitcoin ? 0 : width * 0.35, width / 2, height / 2).strength(0.8))
      .force("center", d3.forceCenter(width / 2, height / 2));
    
    // Draw links with curved paths
    const links = flowData.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage
    }));
    
    const linkGroup = svg.append("g").attr("class", "links");
    
    const link = linkGroup.selectAll("path")
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
      .attr("refX", d => d.target.isBitcoin ? 25 + d.target.radius : 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
      .attr("d", "M0,-5L10,0L0,5");
    
    link.attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
    // Animate the flow with particles
    links.forEach((d, i) => {
      // Create multiple particles per link
      const particlesCount = 3;
      for (let j = 0; j < particlesCount; j++) {
        svg.append("circle")
          .attr("r", 3)
          .attr("fill", d.percentage > 0 ? "#00ffcc" : "#ff0066")
          .attr("class", "flow-particle")
          .attr("opacity", 0.8)
          .attr("data-link-index", i)
          .attr("data-particle-index", j);
      }
    });
    
    // Draw circles for nodes
    const nodeGroup = svg.append("g").attr("class", "nodes");
    
    const node = nodeGroup.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("data-id", d => d.id)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Add a larger backdrop for BTC
    node.filter(d => d.isBitcoin)
      .append("circle")
      .attr("r", d => d.radius + 10)
      .attr("fill", "#f7931a20")
      .attr("stroke", "#f7931a50")
      .attr("stroke-width", 2)
      .attr("filter", "url(#glow)");
    
    // Add circles for all nodes
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", d => d.isBitcoin ? "#f7931a" : "#0ea5e9")
      .attr("stroke-width", 2)
      .attr("opacity", 0.8)
      .attr("filter", "url(#glow)");
    
    // Add logo/icon for BTC 
    node.filter(d => d.isBitcoin)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("fill", "#ffffff")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .text("₿");
    
    // Add text for all nodes
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.isBitcoin ? d.radius + 20 : "0.3em")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", d => d.isBitcoin ? "16px" : "12px")
      .text(d => d.id);
    
    // Add pulsating effect for BTC
    node.filter(d => d.isBitcoin)
      .select("circle")
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", d => `${d.radius};${d.radius * 1.1};${d.radius}`)
      .attr("dur", "3s")
      .attr("repeatCount", "indefinite");
    
    function getNodeColor(node) {
      if (node.id === "BTC") return "#F7931A"; // Bitcoin color
      if (node.id === "LARGE") return "#0ea5e9"; // Large caps
      if (node.id === "ETH") return "#627EEA"; // Ethereum color
      if (node.id === "SOL") return "#00FFA3"; // Solana color
      if (node.id === "XRP") return "#23292F"; // XRP color
      if (node.id === "ADA") return "#0033AD"; // Cardano color
      if (node.id === "AVAX") return "#E84142"; // Avalanche color
      if (node.id === "DOT") return "#E6007A"; // Polkadot color
      if (node.id === "DOGE") return "#C3A634"; // Dogecoin color
      if (node.id === "MATIC") return "#8247E5"; // Polygon color
      return "#1c2030"; // Default
    }
    
    // Update positions on each tick
    simulation.on("tick", () => {
      // Fix BTC position in center
      const btcNode = nodes.find(n => n.isBitcoin);
      if (btcNode) {
        btcNode.x = width / 2;
        btcNode.y = height / 2;
        btcNode.fx = width / 2;
        btcNode.fy = height / 2;
      }
      
      // Keep other nodes within bounds
      nodes.filter(n => !n.isBitcoin).forEach(d => {
        const radius = d.radius || minRadius;
        d.x = Math.max(radius, Math.min(width - radius, d.x));
        d.y = Math.max(radius, Math.min(height - radius, d.y));
      });
      
      // Update path for links as curved lines
      link.attr("d", d => {
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;
        
        // Calculate path
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        
        // When line is to/from BTC, make it curve more elegantly
        if (d.source.isBitcoin || d.target.isBitcoin) {
          return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
        } 
        
        return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
      });
      
      // Update particle positions along the paths
      svg.selectAll(".flow-particle").each(function() {
        const particle = d3.select(this);
        const linkIndex = parseInt(particle.attr("data-link-index"));
        const particleIndex = parseInt(particle.attr("data-particle-index"));
        
        if (Number.isNaN(linkIndex) || linkIndex >= links.length) return;
        
        const link = links[linkIndex];
        
        // Calculate position along the path using time-based offset
        const t = ((Date.now() / 3000) + (particleIndex * 0.3)) % 1;
        
        try {
          // Get path element for this link
          const pathNode = svg.selectAll(".link").nodes()[linkIndex];
          if (!pathNode) return;
          
          // Get point at length
          const pathLength = pathNode.getTotalLength();
          const point = pathNode.getPointAtLength(pathLength * t);
          
          particle
            .attr("cx", point.x)
            .attr("cy", point.y);
        } catch (e) {
          console.error(e);
        }
      });
      
      // Update node positions
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      // Don't allow dragging BTC
      if (d.isBitcoin) return;
      
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep BTC fixed, but allow others to move
      if (d.isBitcoin) {
        d.fx = width / 2;
        d.fy = height / 2;
      } else {
        d.fx = null;
        d.fy = null;
      }
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
              <span>Other Cryptos</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalFlowPanel;
