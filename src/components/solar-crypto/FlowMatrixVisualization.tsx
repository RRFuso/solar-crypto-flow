
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { CATEGORIES } from '../capital-flow/constants/flowCategories';

interface FlowMatrixVisualizationProps {
  flowData: FlowData[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const FlowMatrixVisualization: React.FC<FlowMatrixVisualizationProps> = ({ 
  flowData, 
  activeCategory,
  onCategoryChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Filter data by category if needed
  const filteredData = activeCategory === 'all' 
    ? flowData 
    : flowData.filter(flow => 
        (flow.fromCategory === activeCategory || (flow.categories && flow.categories.includes(activeCategory))) ||
        (flow.toCategory === activeCategory || (flow.categories && flow.categories.includes(activeCategory)))
      );

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !filteredData.length) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
      
    // Create background
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "rgb(10, 10, 20)")
      .attr("rx", 8);
      
    // Add starfield background
    const starCount = 150;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5
    }));
    
    svg.selectAll(".star")
      .data(stars)
      .enter()
      .append("circle")
      .attr("class", "star")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .attr("fill", "white")
      .attr("opacity", () => Math.random() * 0.8 + 0.2);
      
    // Extract unique cryptocurrencies
    const uniqueCryptos = Array.from(new Set([
      ...filteredData.map(d => d.from),
      ...filteredData.map(d => d.to)
    ]));
    
    // Create node data
    const nodes = uniqueCryptos.map(id => {
      // Calculate total inflow and outflow for each crypto
      const inflows = filteredData.filter(d => d.to === id).reduce((sum, curr) => sum + Math.abs(curr.value), 0);
      const outflows = filteredData.filter(d => d.from === id).reduce((sum, curr) => sum + Math.abs(curr.value), 0);
      
      // Determine node size based on total flow volume
      const totalFlow = inflows + outflows;
      const nodeSize = Math.max(20, Math.min(50, Math.sqrt(totalFlow) / 100000));
      
      // Find category
      const flowWithCategory = filteredData.find(f => f.from === id || f.to === id);
      const category = id === 'BTC' ? 'bitcoin' : 
                       id === 'ETH' ? 'ethereum' :
                       flowWithCategory?.fromCategory || flowWithCategory?.toCategory || '';
      
      return {
        id,
        inflows,
        outflows,
        size: nodeSize,
        netFlow: inflows - outflows,
        category
      };
    });
    
    // Create links from flow data
    const links = filteredData.map((flow, i) => ({
      source: nodes.findIndex(n => n.id === flow.from),
      target: nodes.findIndex(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage,
      id: `link-${i}`
    })).filter(link => link.source !== -1 && link.target !== -1);
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.size * 1.5));
    
    // Create links
    const link = svg.append("g")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("id", d => d.id)
      .attr("stroke", d => d.percentage > 0 ? "#4ade80" : "#f43f5e")
      .attr("stroke-width", d => Math.max(1, Math.min(8, Math.abs(d.value) / 10000000)))
      .attr("fill", "none")
      .attr("opacity", 0.6)
      .attr("stroke-dasharray", "5,5");

    // Create gradient links
    const linkGradients = svg.append("defs")
      .selectAll("linearGradient")
      .data(links)
      .enter()
      .append("linearGradient")
      .attr("id", d => `gradient-${d.id}`)
      .attr("gradientUnits", "userSpaceOnUse");
      
    linkGradients.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", d => d.percentage > 0 ? "#4ade80" : "#f43f5e");
      
    linkGradients.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#2563eb");
    
    // Create nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Add background glow to nodes
    node.append("circle")
      .attr("r", d => d.size * 1.5)
      .attr("fill", d => {
        if (d.id === 'BTC') return "rgba(247, 147, 26, 0.2)";
        if (d.id === 'ETH') return "rgba(114, 137, 218, 0.2)";
        return d.netFlow > 0 ? "rgba(74, 222, 128, 0.2)" : "rgba(244, 63, 94, 0.2)";
      })
      .attr("filter", "url(#glow)");
      
    // Add node circles  
    node.append("circle")
      .attr("r", d => d.size)
      .attr("fill", d => {
        if (d.id === 'BTC') return "#f7931a";
        if (d.id === 'ETH') return "#7289da";
        return d.netFlow > 0 ? "#4ade80" : "#f43f5e";
      })
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.5)
      .append("title")
      .text(d => `${d.id}: Flow ${d.netFlow > 0 ? '+' : ''}${(d.netFlow / 1000000).toFixed(2)}M`);
    
    // Add text labels to nodes
    node.append("text")
      .text(d => d.id)
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.size + 12)
      .attr("fill", "white");
      
    // Add net flow indicators
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("dy", -8)
      .attr("fill", d => d.netFlow > 0 ? "#4ade80" : "#f43f5e")
      .text(d => d.netFlow !== 0 ? `${d.netFlow > 0 ? '+' : ''}${(d.netFlow / 1000000).toFixed(1)}M` : '');
    
    // Create glow filter for nodes
    const defs = svg.append("defs");
    
    defs.append("filter")
      .attr("id", "glow")
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    
    // Add animated particles for flows
    const particles = svg.append("g")
      .attr("class", "particles");
      
    // Only show particles for strongest flows
    const strongFlows = links
      .filter(link => Math.abs(link.value) > 5000000)
      .slice(0, 10);
      
    strongFlows.forEach(link => {
      const numParticles = Math.ceil(Math.abs(link.value) / 10000000);
      
      for (let i = 0; i < numParticles; i++) {
        particles.append("circle")
          .attr("class", "particle")
          .attr("r", 2)
          .attr("fill", link.percentage > 0 ? "#4ade80" : "#f43f5e")
          .attr("opacity", 0.7)
          .datum({ link, progress: Math.random() });
      }
    });
    
    // Animation function for particles
    function tickParticles() {
      svg.selectAll(".particle").each(function(d: any) {
        const path = svg.select(`#${d.link.id}`).node() as SVGPathElement;
        if (!path) return;
        
        d.progress = (d.progress + 0.005) % 1;
        const point = path.getPointAtLength(d.progress * path.getTotalLength());
        
        d3.select(this)
          .attr("cx", point.x)
          .attr("cy", point.y);
      });
      
      requestAnimationFrame(tickParticles);
    }
    
    requestAnimationFrame(tickParticles);
    
    // Handle simulation ticks
    simulation.on("tick", () => {
      link.attr("d", d => {
        const sourceNode = nodes[d.source.index];
        const targetNode = nodes[d.target.index];
        
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        
        return `M${sourceNode.x},${sourceNode.y} A${dr},${dr} 0 0,1 ${targetNode.x},${targetNode.y}`;
      });
      
      node.attr("transform", d => `translate(${d.x},${d.y})`);
      
      // Update gradient positions
      linkGradients
        .attr("x1", d => nodes[d.source.index].x)
        .attr("y1", d => nodes[d.source.index].y)
        .attr("x2", d => nodes[d.target.index].x)
        .attr("y2", d => nodes[d.target.index].y);
    });
    
    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [filteredData, activeCategory]);

  return (
    <div className="flex flex-col h-full">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-3 py-1 rounded-full text-xs ${
            activeCategory === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.filter(c => c.value !== 'all').map(category => (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={`px-3 py-1 rounded-full text-xs ${
              activeCategory === category.value 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
      
      {/* Flow visualization */}
      <div ref={containerRef} className="relative flex-1 min-h-[400px]">
        <svg ref={svgRef} className="w-full h-full" />
        
        {!filteredData.length && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400">No flow data available for this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowMatrixVisualization;
