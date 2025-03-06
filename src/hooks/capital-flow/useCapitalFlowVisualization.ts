import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { CapitalFlowNode, CapitalFlowLink } from '@/types/capitalFlow';
import { useCallback } from 'react';

export const useCapitalFlowVisualization = () => {
  const createVisualization = useCallback((
    flowData: FlowData[], 
    svgElement: SVGSVGElement, 
    containerElement: HTMLDivElement
  ) => {
    const width = containerElement.clientWidth;
    const height = 350;
    const maxFlow = Math.max(...(flowData.map(d => d.value) || [1]));
    
    const svg = d3.select(svgElement)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;");
    
    // Create unique nodes for all cryptos in the flows
    const nodes: CapitalFlowNode[] = [];
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
    
    // Set up force simulation with stronger repulsion and boundaries
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-500)) // Increased repulsion force
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.radius + 25)) // Increased collision radius
      .force("x", d3.forceX(width / 2).strength(0.08))
      .force("y", d3.forceY(height / 2).strength(0.08));
    
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
    const links: CapitalFlowLink[] = flowData.map(flow => ({
      source: nodes.find(n => n.id === flow.from) as CapitalFlowNode,
      target: nodes.find(n => n.id === flow.to) as CapitalFlowNode,
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
    
    function getNodeColor(node: CapitalFlowNode) {
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
        d.x = Math.max(radius, Math.min(width - radius, d.x || 0));
        d.y = Math.max(padding, Math.min(height - radius, d.y || 0));
      });
      
      link.attr("d", d => {
        const dx = (d.target.x || 0) - (d.source.x || 0);
        const dy = (d.target.y || 0) - (d.source.y || 0);
        const dr = Math.sqrt(dx * dx + dy * dy) * 2;
        return `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`;
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
      
      node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });
    
    function dragstarted(event: any, d: CapitalFlowNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x || 0;
      d.fy = d.y || 0;
    }
    
    function dragged(event: any, d: CapitalFlowNode) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: CapitalFlowNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return simulation;
  }, []);

  return { createVisualization };
};
