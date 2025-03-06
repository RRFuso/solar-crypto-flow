import { useEffect, RefObject } from 'react';
import * as d3 from 'd3';
import { NarrativeFlow, NarrativeData } from '@/types/narratives';

interface VisualizationConfig {
  width: number;
  height: number;
  narratives: NarrativeData[];
  flowData: NarrativeFlow[];
  isPredicted: boolean;
}

export const useNarrativeFlowVisualization = (
  svgRef: RefObject<SVGSVGElement>,
  containerRef: RefObject<HTMLDivElement>,
  config: VisualizationConfig
) => {
  useEffect(() => {
    if (!config.flowData || config.flowData.length === 0 || !svgRef.current || !containerRef.current) return;

    const { width, height, narratives, flowData, isPredicted } = config;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;");
    
    // Create nodes for narratives
    const nodes: any[] = [];
    const uniqueNarratives = new Set();
    
    flowData.forEach(flow => {
      const sourceNarrative = narratives.find(n => n.id === flow.from);
      const targetNarrative = narratives.find(n => n.id === flow.to);
      
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

    // Sort nodes by market cap (descending)
    nodes.sort((a, b) => b.value - a.value);

    // Scale node sizes
    const minRadius = 40;
    const maxRadius = 80;
    const marketCapExtent = d3.extent(nodes, d => d.value);
    
    nodes.forEach(node => {
      node.radius = marketCapExtent[0] === marketCapExtent[1] 
        ? minRadius 
        : d3.scaleLinear()
            .domain([marketCapExtent[0], marketCapExtent[1]])
            .range([minRadius, maxRadius])(node.value);
    });

    // Position nodes with largest on the left, others distributed on the right
    const largestNode = nodes[0];
    const otherNodes = nodes.slice(1);
    
    // Set largest node position on the left
    largestNode.x = width * 0.25;
    largestNode.y = height / 2;
    largestNode.fx = largestNode.x; // Fix position
    largestNode.fy = largestNode.y;
    
    // Distribute other nodes on the right side
    const rightSideWidth = width * 0.5;
    const rightSideStartX = width * 0.5;
    const rows = Math.ceil(Math.sqrt(otherNodes.length));
    const cols = Math.ceil(otherNodes.length / rows);
    
    otherNodes.forEach((node, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      node.x = rightSideStartX + (col * rightSideWidth / cols);
      node.y = (row + 0.5) * (height / rows);
    });

    // Create links
    const links = flowData.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage,
      predicted: flow.predicted
    }));

    // Set up force simulation with reduced forces for more static layout
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-200))
      .force("collision", d3.forceCollide().radius(d => d.radius + 20))
      .alphaDecay(0.05) // Slower decay for more stable positioning
      .velocityDecay(0.6); // More damping to prevent excessive movement

    // Avoid center force to maintain our manual positioning

    // Draw visualization elements
    const drawVisualization = () => {
      // Create defs for logos and glows
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
      
      // Draw links with curved paths (similar to CapitalFlowPanel)
      const linkGroup = svg.append("g").attr("class", "links");
      
      const link = linkGroup.selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("stroke", d => isPredicted ? "#00ffaa" : "#ff00aa")
        .attr("stroke-width", d => {
          const maxFlow = d3.max(links, l => l.value) || 1;
          return 2 + (d.value / maxFlow) * 8;
        })
        .attr("fill", "none")
        .attr("stroke-dasharray", "10,10") // Dashed lines like in CapitalFlowPanel)
        .attr("opacity", 0.7);

      // Add animated particles for flow visualization
      links.forEach((link, i) => {
        const particles = 3;
        for (let j = 0; j < particles; j++) {
          const particle = svg.append("circle")
            .attr("r", 3)
            .attr("fill", isPredicted ? "#00ffaa" : "#ff00aa")
            .attr("class", "flow-particle")
            .attr("opacity", 0.8);
            
          // Create animated flow effect
          particle.append("animate")
            .attr("attributeName", "opacity")
            .attr("values", "0;1;0")
            .attr("dur", "4s")
            .attr("repeatCount", "indefinite")
            .attr("begin", `${j * 1.3}s`); // Stagger animations
        }
      });

      // Add nodes
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

      // Add node circles
      node.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => d.color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .attr("opacity", 0.7)
        .attr("filter", "url(#glow)");

      // Add crypto logos in circles
      node.each(function(d) {
        const mainToken = d.tokens[0] || "";
        
        // Add circular clip path for logo
        const clipId = `clip-${d.id}`;
        defs.append("clipPath")
          .attr("id", clipId)
          .append("circle")
          .attr("r", d.radius * 0.5);
        
        // Add logo as image
        d3.select(this)
          .append("image")
          .attr("href", `https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579`.replace("bitcoin", mainToken.toLowerCase()))
          .attr("width", d.radius)
          .attr("height", d.radius)
          .attr("x", -d.radius * 0.5)
          .attr("y", -d.radius * 0.5)
          .attr("clip-path", `url(#${clipId})`)
          .attr("preserveAspectRatio", "xMidYMid slice");
      });

      // Add node labels
      node.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".3em")
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("font-size", d => Math.min(d.radius * 0.4, 14))
        .text(d => d.name);

      // Add token names
      node.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", d => d.radius + 15)
        .attr("fill", "white")
        .attr("font-size", "10px")
        .text(d => d.tokens.slice(0, 2).join(", "));

      // Update positions on simulation tick
      simulation.on("tick", () => {
        // Keep nodes within bounds
        nodes.forEach(d => {
          const padding = d.radius || 40;
          // Only adjust y bounds to maintain left-right positioning
          d.y = Math.max(padding, Math.min(height - padding, d.y));
        });
        
        // Update link paths using curved lines
        link.attr("d", d => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curved path
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        // Update particle positions
        svg.selectAll(".flow-particle").each(function(d, i) {
          const linkIndex = i % links.length;
          const link = links[linkIndex];
          
          // Calculate position along the path
          const t = (Date.now() / 4000 + i * 0.2) % 1;
          
          // Linear interpolation for position
          const sourceX = link.source.x;
          const sourceY = link.source.y;
          const targetX = link.target.x;
          const targetY = link.target.y;
          
          // Add curve to match the path
          const dx = targetX - sourceX;
          const dy = targetY - sourceY;
          
          // Simple curved path approximation
          const curveX = sourceX + dx * t;
          const curveY = sourceY + dy * t - Math.sin(t * Math.PI) * 20;
          
          d3.select(this)
            .attr("cx", curveX)
            .attr("cy", curveY);
        });

        node.attr("transform", d => `translate(${d.x},${d.y})`);
      });
    };

    // Draw the visualization
    drawVisualization();

    // Drag handlers
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
      
      // Don't release the largest node
      if (event.subject !== nodes[0]) {
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }

    return () => {
      simulation.stop();
    };
  }, [config, svgRef, containerRef]);
};
