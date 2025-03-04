import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCcw, TrendingUp, BrainCircuit } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { getNarratives, calculateHistoricalFlows, predictNarrativeFlows } from '@/lib/narrativeData';
import { NarrativeData, NarrativeFlow } from '@/types/narratives';
import { toast } from 'sonner';
import * as d3 from 'd3';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const NarrativeFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [usePredictions, setUsePredictions] = useState(false);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const narratives = getNarratives();

  // Fetch historical flows
  const { data: historicalFlows, isLoading: historicalLoading, refetch: refetchHistorical } = useQuery({
    queryKey: ['narrative-historical-flows', timeframe],
    queryFn: calculateHistoricalFlows,
    refetchInterval: 60000, // 1 minute
    staleTime: 30000,
  });

  // Fetch predicted flows
  const { data: predictionData, isLoading: predictionLoading, refetch: refetchPredictions } = useQuery({
    queryKey: ['narrative-predictions', timeframe],
    queryFn: predictNarrativeFlows,
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000,
    meta: {
      onError: () => {
        toast({
          title: "Prediction Error",
          description: "Failed to generate narrative predictions. Please try again later.",
          variant: "destructive"
        });
      }
    }
  });

  const isLoading = historicalLoading || (usePredictions && predictionLoading);
  
  const flowData = usePredictions 
    ? predictionData?.narrativeFlows || []
    : historicalFlows || [];

  const getNarrativeById = (id: string): NarrativeData | undefined => {
    return narratives.find(n => n.id === id);
  };

  // Refresh data
  const handleRefresh = () => {
    refetchHistorical();
    refetchPredictions();
    toast({
      title: "Refreshing data",
      description: "Fetching the latest narrative flows",
    });
  };

  // Toggle predictions
  const handleTogglePredictions = (checked: boolean) => {
    setUsePredictions(checked);
    toast({
      title: checked ? "AI Predictions Enabled" : "Historical Data Only",
      description: checked 
        ? "Showing LSTM model predictions for future capital flows" 
        : "Showing actual historical capital movements between narratives",
    });
  };

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
    
    // Create unique nodes for all narratives in the flows
    const nodes: any[] = [];
    const uniqueNarratives = new Set();
    
    flowData.forEach(flow => {
      const sourceNarrative = getNarrativeById(flow.from);
      const targetNarrative = getNarrativeById(flow.to);
      
      if (!sourceNarrative || !targetNarrative) return;
      
      if (!uniqueNarratives.has(flow.from)) {
        uniqueNarratives.add(flow.from);
        nodes.push({ 
          id: flow.from,
          name: sourceNarrative.name,
          value: sourceNarrative.marketCap,
          color: sourceNarrative.color,
          tokens: sourceNarrative.tokens
        });
      }
      
      if (!uniqueNarratives.has(flow.to)) {
        uniqueNarratives.add(flow.to);
        nodes.push({ 
          id: flow.to,
          name: targetNarrative.name,
          value: targetNarrative.marketCap,
          color: targetNarrative.color,
          tokens: targetNarrative.tokens
        });
      }
    });
    
    // Scale node sizes based on market cap
    const minRadius = 40;
    const maxRadius = 80;
    const marketCapExtent = d3.extent(nodes, d => d.value);
    
    nodes.forEach(node => {
      if (marketCapExtent[0] === marketCapExtent[1]) {
        node.radius = minRadius;
      } else {
        const scaleFactor = d3.scaleLinear()
          .domain([marketCapExtent[0], marketCapExtent[1]])
          .range([minRadius, maxRadius]);
        
        node.radius = scaleFactor(node.value);
      }
    });
    
    // Set up force simulation with stronger repulsion for better distribution
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-1200)) // Stronger repulsion force
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.radius + 40)) // More collision radius for spacing
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));
    
    // Add boundary forces to keep nodes in view
    simulation.on("tick", () => {
      nodes.forEach(node => {
        // Add padding equal to node radius
        const padding = node.radius + 10;
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      });
    });
    
    // Draw links
    const links = flowData.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage,
      predicted: flow.predicted
    }));
    
    const linkGroup = svg.append("g").attr("class", "links");
    
    const link = linkGroup.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", d => d.predicted ? "#00ffaa" : "#ff00aa")
      .attr("stroke-width", d => {
        // Normalize flow values for better visualization
        const maxFlow = d3.max(links, l => l.value) || 1;
        return 2 + (d.value / maxFlow) * 8; // 2-10px based on relative size
      })
      .attr("fill", "none")
      .attr("stroke-dasharray", d => d.predicted ? "5,5" : "none")
      .attr("opacity", 0.7);
    
    // Create markers (arrows)
    svg.append("defs").selectAll("marker")
      .data(links)
      .enter().append("marker")
      .attr("id", (d, i) => `arrow-${i}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", d => {
        const targetNode = d.target;
        return targetNode.radius + 12; // Adjust arrow position based on target node size
      })
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d.predicted ? "#00ffaa" : "#ff00aa")
      .attr("d", "M0,-5L10,0L0,5");
    
    link.attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
    // Animate the flow
    link.each(function(d, i) {
      const path = d3.select(this);
      
      // Create animated flow effect
      svg.append("circle")
        .attr("r", 3)
        .attr("fill", d.predicted ? "#00ffaa" : "#ff00aa")
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
    
    // Add glowing circles
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7)
      .attr("filter", "url(#glow)");
    
    // Create glow filter
    const defs = svg.append("defs");
    
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
    
    // Add narrative name
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", d => Math.min(d.radius * 0.4, 14))
      .text(d => d.name);
    
    // Add token names below
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius + 15)
      .attr("fill", "white")
      .attr("font-size", "10px")
      .text(d => d.tokens.slice(0, 3).join(", "));
    
    // Add pulsating effect
    node.selectAll("circle")
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", d => `${d.radius};${d.radius * 1.05};${d.radius}`)
      .attr("dur", "3s")
      .attr("repeatCount", "indefinite");
    
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
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
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
  }, [flowData, usePredictions]);

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 bg-clip-text text-transparent">
            Narrative Flows
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <BrainCircuit className="h-5 w-5 text-purple-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {usePredictions 
                    ? "AI predictions show expected capital movements between crypto narratives based on LSTM model analysis" 
                    : "Historical capital flows between different crypto market narratives"
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              id="predictions-switch" 
              checked={usePredictions} 
              onCheckedChange={handleTogglePredictions} 
            />
            <Label htmlFor="predictions-switch" className="text-sm text-white/80">
              AI Predictions
            </Label>
          </div>
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
            onClick={handleRefresh}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {usePredictions && predictionData && (
            <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 px-3 py-1 rounded-lg text-xs text-white/90 border border-white/10">
              Confidence: {Math.round(predictionData.confidence * 100)}%
            </div>
          )}
          
          {/* D3 Visualization */}
          <div ref={containerRef} className="w-full flex-1">
            <svg ref={svgRef} className="w-full h-full" />
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-white/80">
            {usePredictions ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00ffaa]"></div>
                  <span>Predicted Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <span>LSTM Model Prediction</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff00aa]"></div>
                  <span>Historical Flow</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white"></div>
              <span>Node Size = Market Cap</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NarrativeFlowPanel;
