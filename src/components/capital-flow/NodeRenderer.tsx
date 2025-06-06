// ⚙️ IMPORTS
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';

// Extend OrbitalNode interface locally for clarity
interface ExtendedOrbitalNode extends OrbitalNode {
  priceActionSignal?: PriceActionSignal;
  price?: string;
  priceChange24h?: number;
}

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: ExtendedOrbitalNode[];
  centralNode: ExtendedOrbitalNode | null;
  selectedNodeId: string | null;
  zoomLevel: number;
}

// 🎯 UTILS - Updated color logic based on AI insights
const getGlowColor = (node: ExtendedOrbitalNode, aiInsights: Map<string, any>): string => {
  const aiInsight = aiInsights.get(node.id);
  if (aiInsight) {
    if (aiInsight.opportunityScore > 80) return 'rgba(0, 255, 136, 0.5)'; // Strong opportunity - Green
    if (aiInsight.riskScore > 70) return 'rgba(255, 50, 50, 0.5)'; // High risk - Red
    if (aiInsight.recommendation === 'strong_buy') return 'rgba(0, 255, 204, 0.4)'; // Strong buy - Cyan
    if (aiInsight.recommendation === 'strong_sell') return 'rgba(255, 0, 102, 0.4)'; // Strong sell - Pink
  }

  // Fallback to price action signals
  const signal = node.priceActionSignal;
  if (signal?.explosivePotential === 'High') return 'rgba(255, 50, 50, 0.5)';
  if (signal?.explosivePotential === 'Medium') return 'rgba(255, 150, 0, 0.4)';
  if (signal?.explosivePotential === 'Low') return 'rgba(255, 220, 0, 0.3)';
  
  // Original logic fallback
  if (node.divergenceBullish) return 'rgba(0,255,255,0.4)';
  if (node.divergenceBearish) return 'rgba(255,0,180,0.4)';
  if (node.inflow > node.outflow) return 'rgba(0, 255, 204, 0.3)';
  if (node.outflow > node.inflow) return 'rgba(255, 0, 102, 0.3)';
  return 'rgba(0, 181, 216, 0.2)';
};

const getStrokeColor = (node: ExtendedOrbitalNode, selectedNodeId: string | null, aiInsights: Map<string, any>): string => {
  if (selectedNodeId === node.id) return '#ffffff';
  
  const aiInsight = aiInsights.get(node.id);
  if (aiInsight) {
    switch (aiInsight.recommendation) {
      case 'strong_buy': return '#00FF88';
      case 'buy': return '#66FF99';
      case 'hold': return '#FFCC00';
      case 'sell': return '#FF6666';
      case 'strong_sell': return '#FF3366';
    }
  }

  // Fallback to price action signals
  const signal = node.priceActionSignal;
  if (signal?.explosivePotential === 'High') return '#FFD700';
  if (signal?.isBreakout) return '#FF4500';
  if (signal?.isExpansion) return '#FFA500';
  if (signal?.isAccelerating) return '#1E90FF';
  
  // Original logic fallback
  if (node.divergenceBullish) return '#00ffff';
  if (node.divergenceBearish) return '#ff0077';
  if (node.inflow > node.outflow) return '#00ffcc';
  if (node.outflow > node.inflow) return '#ff0066';
  return '#00b5d8';
};

// Enhanced tooltip with AI insights
const getEnhancedTooltipText = (node: ExtendedOrbitalNode, aiInsights: Map<string, any>): string[] => {
  const lines: string[] = [];
  
  // Basic info
  lines.push(node.name || node.id);
  lines.push(`Preço: ${formatPrice(node.price)}`);
  const change24h = node.priceChange24h ?? 0;
  lines.push(`24h: ${formatPercentage(change24h)}`);
  lines.push(`Volume: ${node.volume?.toLocaleString() || 'N/A'}`);
  
  // AI insights
  const aiInsight = aiInsights.get(node.id);
  if (aiInsight) {
    lines.push('--- AI Insights ---');
    lines.push(`Recomendação: ${getRecommendationText(aiInsight.recommendation)}`);
    lines.push(`Confiança: ${aiInsight.confidence.toFixed(1)}%`);
    lines.push(`Oportunidade: ${aiInsight.opportunityScore.toFixed(1)}/100`);
    lines.push(`Risco: ${aiInsight.riskScore.toFixed(1)}/100`);
    
    if (aiInsight.patterns && aiInsight.patterns.length > 0) {
      const pattern = aiInsight.patterns[0];
      lines.push(`Padrão: ${pattern.type} (${pattern.confidence.toFixed(1)}%)`);
    }
  }
  
  return lines;
};

const getRecommendationText = (recommendation: string): string => {
  switch (recommendation) {
    case 'strong_buy': return 'COMPRA FORTE';
    case 'buy': return 'Compra';
    case 'hold': return 'Manter';
    case 'sell': return 'Venda';
    case 'strong_sell': return 'VENDA FORTE';
    default: return 'Neutro';
  }
};

// Format functions remain the same
const formatPrice = (priceString: string | undefined): string => {
  const price = parseFloat(priceString || '0');
  if (isNaN(price)) return 'N/A';
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}`;
};

const formatPercentage = (change: number | undefined): string => {
  if (change === undefined || isNaN(change)) return 'N/A';
  return `${change.toFixed(2)}%`;
};

// 📦 CLASS
class NodeRendererClass {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private nodes: ExtendedOrbitalNode[];
  private selectedNodeId: string | null;
  private zoomLevel: number;
  private aiInsights: Map<string, any>;

  constructor(props: NodeRendererProps & { aiInsights: Map<string, any> }) {
    this.svg = props.svg;
    this.nodes = props.nodes;
    this.selectedNodeId = props.selectedNodeId;
    this.zoomLevel = props.zoomLevel;
    this.aiInsights = props.aiInsights;
    this.renderNodes();
  }

  private renderNodes() {
    this.svg.selectAll('.nodes-group').remove();
    const nodesGroup = this.svg.append("g").attr("class", "nodes-group");

    this.createNodePatterns(this.svg, this.nodes);

    // 🟢 GLOW (Updated with AI insights)
    nodesGroup.selectAll('circle.node-glow')
      .data(this.nodes)
      .enter()
      .append('circle')
      .attr('class', 'node-glow')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => {
        const volFactor = d.volume ? Math.sqrt(d.volume) / 100 : 1;
        return d.radius * 1.3 * volFactor * (this.zoomLevel / 100);
      })
      .attr('fill', d => getGlowColor(d, this.aiInsights))
      .attr('filter', 'blur(6px)');

    // 🧠 MAIN NODE GROUP
    const node = nodesGroup.selectAll('g.node')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('data-id', d => d.id)
      .style('cursor', 'pointer')
      .on('mouseenter', (event: MouseEvent, d: ExtendedOrbitalNode) => {
        this.svg.selectAll('.node-tooltip').remove();
        const tooltip = this.svg.append('g')
          .attr('class', 'node-tooltip')
          .attr('transform', `translate(${d.x},${d.y - d.radius * (this.zoomLevel / 100) - 15})`);

        const textLines = getEnhancedTooltipText(d, this.aiInsights);
        const padding = 10;
        const lineHeight = 16;
        const tooltipHeight = textLines.length * lineHeight + padding * 1.5;
        let maxWidth = 0;

        // Pre-calculate max width
        const tempText = tooltip.append('text').style('opacity', 0);
        textLines.forEach(line => {
            const textNode = tempText.text(line).node();
            const w = textNode?.getComputedTextLength() || 0;
            if (w > maxWidth) maxWidth = w;
        });
        tempText.remove();
        const tooltipWidth = Math.max(200, maxWidth + padding * 2);

        tooltip.append('rect')
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('x', -tooltipWidth / 2)
          .attr('y', -tooltipHeight + padding / 2)
          .attr('width', tooltipWidth)
          .attr('height', tooltipHeight)
          .attr('fill', 'rgba(10, 20, 30, 0.95)')
          .attr('stroke', getStrokeColor(d, this.selectedNodeId, this.aiInsights))
          .attr('stroke-width', 1.5);

        textLines.forEach((line, i) => {
          let fillColor = '#FFFFFF';
          let fontWeight = 'normal';
          let fontSize = '11px';

          if (i === 0) { // Symbol/Name
            fontWeight = 'bold';
            fontSize = '13px';
          } else if (line.includes('24h:')) {
            const change24h = parseFloat(line.split(':')[1]) || 0;
            fillColor = change24h >= 0 ? '#22c55e' : '#ef4444';
            fontWeight = 'medium';
          } else if (line.includes('AI Insights')) {
            fillColor = '#00B5D8';
            fontWeight = 'bold';
            fontSize = '12px';
          } else if (line.includes('COMPRA FORTE') || line.includes('VENDA FORTE')) {
            fillColor = line.includes('COMPRA') ? '#00FF88' : '#FF3366';
            fontWeight = 'bold';
          } else if (line.includes('Recomendação:') || line.includes('Confiança:') || line.includes('Oportunidade:') || line.includes('Risco:') || line.includes('Padrão:')) {
            fillColor = '#E0E0E0';
            fontSize = '10px';
          }

          tooltip.append('text')
            .attr('x', 0)
            .attr('y', -tooltipHeight + padding * 1.8 + i * lineHeight)
            .attr('text-anchor', 'middle')
            .attr('fill', fillColor)
            .attr('font-size', fontSize)
            .attr('font-weight', fontWeight)
            .text(line);
        });
      })
      .on('mouseleave', () => this.svg.selectAll('.node-tooltip').remove())
      .on('click', (event: MouseEvent, d: ExtendedOrbitalNode) => {
        const clickEvent = new CustomEvent('node-click', { detail: { nodeId: d.id } });
        document.dispatchEvent(clickEvent);
      });

    // 🔵 CIRCLE (Updated stroke logic with AI insights)
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => {
        const volFactor = d.volume ? Math.sqrt(d.volume) / 100 : 1;
        return d.radius * volFactor * (this.zoomLevel / 100);
      })
      .attr('fill', d => `url(#logo-${d.id})`)
      .attr('stroke', d => getStrokeColor(d, this.selectedNodeId, this.aiInsights))
      .attr('stroke-width', d => this.selectedNodeId === d.id ? 3 : 2)
      .attr('stroke-opacity', 0.9);

    // 🔤 LABEL
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius * (this.zoomLevel / 100) * 1.1 + 12)
      .attr('fill', 'white')
      .attr('font-size', d => Math.max(9, Math.min(12, d.radius * 0.35) * (this.zoomLevel / 100)))
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.id);
  }

  private createNodePatterns(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, nodes: ExtendedOrbitalNode[]) {
    svg.select('defs').remove();
    const defs = svg.append('defs');
    nodes.forEach(node => {
      const pattern = defs.append('pattern')
        .attr('id', `logo-${node.id}`)
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternContentUnits', 'objectBoundingBox');

      const logoUrl = getCryptoLogoUrl(node.id);
      pattern.append('image')
        .attr('href', logoUrl)
        .attr('width', 1)
        .attr('height', 1)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('error', function () {
          d3.select(this).attr('href', getFallbackLogoUrl());
        });
    });
  }
}

// 🔁 REACT WRAPPER
export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  const { insights: aiInsights } = useAdvancedAI();

  useEffect(() => {
    const nodesWithData = props.nodes.map(node => ({
      ...node,
    }));
    
    const rendererInstance = new NodeRendererClass({ 
      ...props, 
      nodes: nodesWithData,
      aiInsights 
    });
    
    return () => {
      props.svg.selectAll('.nodes-group').remove();
      props.svg.selectAll('.node-tooltip').remove();
    };
  }, [props.nodes, props.selectedNodeId, props.zoomLevel, props.svg, aiInsights]);

  return null;
});
