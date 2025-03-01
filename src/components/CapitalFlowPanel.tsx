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
    const minRadius = 35;
    const maxRadius = 65;
    nodes.forEach(node => {
      const absValue = Math.abs(node.value);
      node.radius = minRadius + (absValue / maxFlow) * (maxRadius - minRadius);
    });
    
    // Set up force simulation with even stronger repulsion and boundaries for better distribution
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-800)) // Increased repulsion force
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.radius + 40)) // Increased collision radius more
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));
    
    // Add boundary forces to keep nodes in view
    simulation.on("tick", () => {
      nodes.forEach(node => {
        // Add padding equal to node radius
        const padding = node.radius || minRadius;
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      });
    });
    
    // Define glow filter for fluorescent effect
    const defs = svg.append("defs");
    
    // Green glow filter
    const glowFilterGreen = defs.append("filter")
      .attr("id", "glow-green")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
      
    glowFilterGreen.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
      
    glowFilterGreen.append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");
    
    // Red glow filter
    const glowFilterRed = defs.append("filter")
      .attr("id", "glow-red")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
      
    glowFilterRed.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
      
    glowFilterRed.append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");
    
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
      .attr("opacity", 0.9)
      .attr("filter", d => d.percentage > 0 ? "url(#glow-green)" : "url(#glow-red)");
    
    // Create markers (arrows)
    svg.append("defs").selectAll("marker")
      .data(links)
      .enter().append("marker")
      .attr("id", (d, i) => `arrow-${i}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 30) // Increased to account for larger circles
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
        .attr("filter", d.percentage > 0 ? "url(#glow-green)" : "url(#glow-red)")
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
    
    // Add outer glowing circles
    node.append("circle")
      .attr("r", d => d.radius + 2)  // Slightly larger for border effect
      .attr("fill", "none")
      .attr("stroke", d => getNodeBorderColor(d))
      .attr("stroke-width", 2)
      .attr("opacity", 0.9)
      .attr("filter", d => d.value >= 0 ? "url(#glow-green)" : "url(#glow-red)");
    
    // Add main circles
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", "#0ea5e9")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7);
    
    // Add cryptocurrency icons
    node.each(function(d) {
      const group = d3.select(this);
      const iconSize = d.radius * 0.6; // Size relative to circle
      
      if (d.id === "BTC") {
        // Bitcoin icon
        group.append("svg:foreignObject")
          .attr("width", iconSize * 2)
          .attr("height", iconSize * 2)
          .attr("x", -iconSize)
          .attr("y", -iconSize)
          .append("xhtml:div")
          .html(`<svg width="${iconSize * 2}" height="${iconSize * 2}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m3.94.694-.346 1.97" />
            <path d="M14.62 11.222l-.347 1.97M7.48 10.527l2.758.486" />
          </svg>`);
      } else if (d.id === "ETH") {
        // Ethereum icon
        group.append("svg:foreignObject")
          .attr("width", iconSize * 2)
          .attr("height", iconSize * 2)
          .attr("x", -iconSize)
          .attr("y", -iconSize)
          .append("xhtml:div")
          .html(`<svg width="${iconSize * 2}" height="${iconSize * 2}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 12 6-9 6 9M6 12l6 9 6-9M6 12l6-2 6 2M6 12l6 2 6-2" />
          </svg>`);
      } else if (d.id === "LARGE") {
        // Diamond icon for large caps
        group.append("svg:foreignObject")
          .attr("width", iconSize * 2)
          .attr("height", iconSize * 2)
          .attr("x", -iconSize)
          .attr("y", -iconSize)
          .append("xhtml:div")
          .html(`<svg width="${iconSize * 2}" height="${iconSize * 2}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 2H8L2 8l10 14L22 8l-6-6Z" />
            <path d="M12 22V8" />
            <path d="m2 8 10 10 10-10" />
          </svg>`);
      } else {
        // Generic coins icon for other cryptos
        group.append("svg:foreignObject")
          .attr("width", iconSize * 2)
          .attr("height", iconSize * 2)
          .attr("x", -iconSize)
          .attr("y", -iconSize)
          .append("xhtml:div")
          .html(`<svg width="${iconSize * 2}" height="${iconSize * 2}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="m16.71 13.88.7.71-2.82 2.82" />
          </svg>`);
      }
    });
    
    // Add text labels
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius + 15) // Position below the circle
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", "12px")
      .attr("class", "text-shadow")
      .text(d => d.id);
    
    // Add pulsating effect
    node.selectAll("circle")
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", d => `${d.radius};${d.radius * 1.05};${d.radius}`)
      .attr("dur", "3s")
      .attr("repeatCount", "indefinite");
    
    // Add a subtle text shadow style
    svg.append("style").text(`
      .text-shadow {
        text-shadow: 0 0 3px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.6);
      }
    `);
    
    function getNodeColor(node) {
      if (node.id === "BTC") return "#F7931A"; // Bitcoin color
      if (node.id === "LARGE") return "#0ea5e9"; // Large caps
      if (node.id === "ETH") return "#627EEA"; // Ethereum color
      return "#1c2030"; // Default
    }
    
    function getNodeBorderColor(node) {
      if (node.value >= 0) return "#00ffcc"; // Inflow
      return "#ff0066"; // Outflow
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
              <div className="w-3 h-3 rounded-full bg-neon-green filter drop-shadow-[0_0_2px_rgba(0,255,204,0.8)]"></div>
              <span>Capital Inflow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neon-red filter drop-shadow-[0_0_2px_rgba(255,0,102,0.8)]"></div>
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
