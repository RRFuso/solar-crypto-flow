
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IndexRotationResult } from '@/types/indices';

interface IndexFlowChartProps {
  data: IndexRotationResult;
}

export const IndexFlowChart: React.FC<IndexFlowChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;
    
    // Limpar o SVG anterior
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    // Criar nós para os índices
    const nodes = data.indices.map(index => ({
      id: index.id,
      name: index.name,
      value: index.value || 0,
      change: index.change || 0,
      color: index.color,
      radius: 40,
      x: 0,
      y: 0
    }));
    
    // Criar links a partir dos fluxos
    const links = data.flows.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage
    })).filter(link => link.source && link.target);
    
    // Configurar simulação de força
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => (d as any).radius * 1.2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));
    
    // Desenhar links (conexões)
    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", d => d.percentage > 0 ? "#4ade80" : "#f43f5e")
      .attr("stroke-width", d => 2 + Math.min(5, Math.abs(d.value) / 10))
      .attr("fill", "none")
      .attr("stroke-dasharray", "10,10")
      .attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
    // Adicionar setas
    svg.append("defs").selectAll("marker")
      .data(links)
      .enter()
      .append("marker")
      .attr("id", (d, i) => `arrow-${i}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d.percentage > 0 ? "#4ade80" : "#f43f5e")
      .attr("d", "M0,-5L10,0L0,5");
    
    // Desenhar nós (círculos)
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Adicionar círculos
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.color)
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2)
      .attr("opacity", 0.8);
    
    // Adicionar texto (nome do índice)
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", "12px")
      .text(d => d.name);
    
    // Adicionar variação percentual
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.6em")
      .attr("fill", d => d.change >= 0 ? "#4ade80" : "#f43f5e")
      .attr("font-weight", "bold")
      .attr("font-size", "11px")
      .text(d => (d.change >= 0 ? "+" : "") + d.change.toFixed(2) + "%");
    
    // Atualizar posições a cada tick
    simulation.on("tick", () => {
      // Manter nós dentro dos limites
      nodes.forEach((d: any) => {
        d.x = Math.max(d.radius, Math.min(width - d.radius, d.x || 0));
        d.y = Math.max(d.radius, Math.min(height - d.radius, d.y || 0));
      });
      
      // Atualizar posições dos links
      link.attr("d", (d: any) => {
        const dx = (d.target.x || 0) - (d.source.x || 0);
        const dy = (d.target.y || 0) - (d.source.y || 0);
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        return `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`;
      });
      
      // Atualizar posições dos nós
      node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });
    
    // Funções para o drag & drop
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
