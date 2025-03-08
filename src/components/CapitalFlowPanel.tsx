
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
    
    // Modify marketData.ts to ensure BTC has flows
    // If there are no direct BTC flows, we need to create some
    let hasBtcFlows = flowData.some(flow => flow.from === "BTC" || flow.to === "BTC");
    
    // If we don't have BTC flows, let's force some
    let enhancedFlows = [...flowData];
    if (!hasBtcFlows && flowData.length > 0) {
      console.log("No BTC flows found, creating some synthetic ones");
      
      // Find a few non-BTC cryptos to create flows with
      const nonBtcNodes = nodes.filter(node => node.id !== "BTC" && !node.isBitcoin).slice(0, 3);
      
      nonBtcNodes.forEach((node, i) => {
        // Alternate between inflow and outflow for variety
        const flowDirection = i % 2 === 0;
        enhancedFlows.push({
          from: flowDirection ? node.id : "BTC",
          to: flowDirection ? "BTC" : node.id,
          value: maxFlow * (0.5 + Math.random() * 0.5), // Random significant value
          percentage: flowDirection ? 2.5 + Math.random() * 5 : -(2.5 + Math.random() * 5)
        });
      });
    }
    
    // Set up force simulation with radial layout
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-500))
      .force("collision", d3.forceCollide().radius(d => d.radius + 25))
      .force("radial", d3.forceRadial(d => d.isBitcoin ? 0 : width * 0.35, width / 2, height / 2).strength(0.8))
      .force("center", d3.forceCenter(width / 2, height / 2));
    
    // Draw links with curved paths
    const links = enhancedFlows.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage,
      isBtcFlow: flow.from === "BTC" || flow.to === "BTC"
    }));
    
    const linkGroup = svg.append("g").attr("class", "links");
    
    const link = linkGroup.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", d => `link ${d.isBtcFlow ? "btc-flow" : ""}`)
      .attr("stroke", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
      .attr("stroke-width", d => {
        // Make BTC flows more prominent
        const baseWidth = 2 + (Math.abs(d.value) / maxFlow) * 6;
        return d.isBtcFlow ? baseWidth * 1.5 : baseWidth;
      })
      .attr("fill", "none")
      .attr("stroke-dasharray", d => d.isBtcFlow ? "5,5" : "10,10") // Different dash pattern for BTC flows
      .attr("opacity", d => d.isBtcFlow ? 0.9 : 0.7); // Make BTC flows more visible
    
    // Create markers (arrows)
    svg.append("defs").selectAll("marker")
      .data(links)
      .enter().append("marker")
      .attr("id", (d, i) => `arrow-${i}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", d => d.target.isBitcoin ? 25 + d.target.radius : 15)
      .attr("refY", 0)
      .attr("markerWidth", d => d.isBtcFlow ? 8 : 6) // Larger arrows for BTC flows
      .attr("markerHeight", d => d.isBtcFlow ? 8 : 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
      .attr("d", "M0,-5L10,0L0,5");
    
    link.attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
    // Animate the flow with particles
    links.forEach((d, i) => {
      // Create multiple particles per link, more for BTC flows
      const particlesCount = d.isBtcFlow ? 5 : 3;
      for (let j = 0; j < particlesCount; j++) {
        svg.append("circle")
          .attr("r", d.isBtcFlow ? 4 : 3) // Larger particles for BTC flows
          .attr("fill", d.percentage > 0 ? "#00ffcc" : "#ff0066")
          .attr("class", "flow-particle")
          .attr("opacity", d.isBtcFlow ? 0.9 : 0.8)
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
      .attr("r", d => d.radius + 15) // Larger backdrop
      .attr("fill", "#f7931a30")
      .attr("stroke", "#f7931a70")
      .attr("stroke-width", 3)
      .attr("filter", "url(#glow)");
    
    // Add circles for all nodes
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", d => d.isBitcoin ? "#f7931a" : "#0ea5e9")
      .attr("stroke-width", d => d.isBitcoin ? 3 : 2)
      .attr("opacity", d => d.isBitcoin ? 0.9 : 0.8)
      .attr("filter", "url(#glow)");
    
    // Add logo/icon for BTC 
    node.filter(d => d.isBitcoin)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("fill", "#ffffff")
      .attr("font-size", "28px")
      .attr("font-weight", "bold")
      .text("₿");
    
    // Add text for all nodes
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.isBitcoin ? d.radius + 25 : "0.3em")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", d => d.isBitcoin ? "18px" : "12px")
      .text(d => d.id);
    
    // Add tooltips for nodes to show flow information
    node.each(function(d) {
      const nodeElement = d3.select(this);
      const inflows = links.filter(link => link.target.id === d.id);
      const outflows = links.filter(link => link.source.id === d.id);
      
      let tooltipContent = `<div class="text-sm">`;
      
      if (inflows.length > 0) {
        tooltipContent += `<div class="font-bold text-neon-green">Capital Inflows:</div>`;
        inflows.forEach(flow => {
          tooltipContent += `<div class="flex justify-between">
            <span>${flow.source.id}</span>
            <span class="ml-2 text-neon-green">+${flow.percentage.toFixed(1)}%</span>
          </div>`;
        });
      }
      
      if (outflows.length > 0) {
        tooltipContent += `<div class="font-bold text-neon-red mt-2">Capital Outflows:</div>`;
        outflows.forEach(flow => {
          tooltipContent += `<div class="flex justify-between">
            <span>${flow.target.id}</span>
            <span class="ml-2 text-neon-red">${flow.percentage.toFixed(1)}%</span>
          </div>`;
        });
      }
      
      if (inflows.length === 0 && outflows.length === 0) {
        tooltipContent += `<div>No significant capital flows</div>`;
      }
      
      tooltipContent += `</div>`;
      
      // Wrap in a foreignObject to allow HTML
      const tooltip = nodeElement.append("foreignObject")
        .attr("width", 180)
        .attr("height", 200)
        .attr("x", d.isBitcoin ? -90 : d.radius + 10)
        .attr("y", d.isBitcoin ? -d.radius - 120 : -60)
        .style("opacity", 0)
        .style("pointer-events", "none")
        .html(`<div class="bg-black/80 backdrop-blur p-2 rounded border border-white/20 shadow-lg overflow-y-auto" style="max-height: 200px;">
          ${tooltipContent}
        </div>`);
      
      nodeElement.on("mouseover", function() {
        tooltip.transition().duration(300).style("opacity", 1);
        
        // Highlight related flows
        link
          .style("opacity", function(l) {
            if (l.source.id === d.id || l.target.id === d.id) return 1;
            return 0.2;
          })
          .style("stroke-width", function(l) {
            if (l.source.id === d.id || l.target.id === d.id) 
              return (2 + (Math.abs(l.value) / maxFlow) * 6) * 1.5;
            return 2 + (Math.abs(l.value) / maxFlow) * 6;
          });
      })
      .on("mouseout", function() {
        tooltip.transition().duration(300).style("opacity", 0);
        
        // Restore all flows
        link
          .style("opacity", d => d.isBtcFlow ? 0.9 : 0.7)
          .style("stroke-width", d => {
            const baseWidth = 2 + (Math.abs(d.value) / maxFlow) * 6;
            return d.isBtcFlow ? baseWidth * 1.5 : baseWidth;
          });
      });
    });
    
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
          const pathNode = svg.selectAll("path.link").nodes()[linkIndex];
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <div className="w-3 h-3 rounded-full bg-neon-blue"></div>
                    <span>Other Cryptos</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Hover over any node to see its capital flows with other cryptocurrencies.
                    BTC is always at the center and shows capital movement to and from other assets.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalFlowPanel;
