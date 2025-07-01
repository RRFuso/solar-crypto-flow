import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';

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

const getAIRecommendationColor = (recommendation: string): string => {
  switch (recommendation) {
    case 'strong_buy': return '#00FF88';
    case 'buy': return '#66FF99';
    case 'hold': return '#FFCC00';
    case 'sell': return '#FF6666';
    case 'strong_sell': return '#FF3366';
    default: return '#8A9196';
  }
};

const getAIGlowColor = (node: ExtendedOrbitalNode, aiInsights: Map<string, any>): string => {
  const aiInsight = aiInsights.get(node.id);
  if (aiInsight) {
    if (aiInsight.opportunityScore > 80) return 'rgba(0, 255, 136, 0.6)';
    if (aiInsight.riskScore > 70) return 'rgba(255, 50, 50, 0.6)';
    if (aiInsight.recommendation === 'strong_buy') return 'rgba(0, 255, 204, 0.5)';
    if (aiInsight.recommendation === 'strong_sell') return 'rgba(255, 0, 102, 0.5)';
  }

  const signal = node.priceActionSignal;
  if (signal?.explosivePotential === 'High') return 'rgba(255, 215, 0, 0.6)';
  if (signal?.explosivePotential === 'Medium') return 'rgba(255, 150, 0, 0.4)';
  
  if (node.inflow && node.outflow && node.inflow > node.outflow) return 'rgba(0, 255, 204, 0.4)';
  if (node.inflow && node.outflow && node.outflow > node.inflow) return 'rgba(255, 0, 102, 0.4)';
  return 'rgba(0, 181, 216, 0.3)';
};

const formatPrice = (priceString: string | undefined): string => {
  const price = parseFloat(priceString || '0');
  if (isNaN(price)) return 'N/A';
  return `$${price.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: price < 1 ? 6 : 2 
  })}`;
};

const formatPercentage = (change: number | undefined): string => {
  if (change === undefined || isNaN(change)) return 'N/A';
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
};

const getRecommendationText = (recommendation: string): string => {
  const translations = {
    'strong_buy': 'COMPRA FORTE 🚀',
    'buy': 'Compra 📈',
    'hold': 'Manter ⏸️',
    'sell': 'Venda 📉',
    'strong_sell': 'VENDA FORTE ⚠️'
  };
  return translations[recommendation as keyof typeof translations] || 'Neutro';
};

// CRITICAL FIX: Proper radius calculation with limits
const calculateNodeRadius = (node: ExtendedOrbitalNode, zoomLevel: number, isCentral: boolean = false): number => {
  // Base radius - much more conservative
  const baseRadius = isCentral ? 25 : 15;
  
  // Volume factor - heavily limited to prevent extreme sizes
  let volFactor = 1;
  if (node.volume && node.volume > 0) {
    // Use logarithmic scale to prevent extreme volume differences
    const logVolume = Math.log10(node.volume);
    volFactor = Math.min(2.5, Math.max(0.5, logVolume / 10)); // Cap between 0.5x and 2.5x
  }
  
  // Zoom factor - much more conservative
  const zoomFactor = Math.min(2, Math.max(0.5, zoomLevel / 100)); // Cap zoom effect
  
  // AI insight factor - minimal impact on size
  const aiInsight = node.priceActionSignal;
  const aiMultiplier = aiInsight?.explosivePotential === 'High' ? 1.2 : 1.0;
  
  // Calculate final radius with strict limits
  const calculatedRadius = baseRadius * volFactor * zoomFactor * aiMultiplier;
  
  // STRICT MIN/MAX LIMITS
  const minRadius = isCentral ? 20 : 12;
  const maxRadius = isCentral ? 40 : 25;
  
  return Math.max(minRadius, Math.min(maxRadius, calculatedRadius));
};

const createEnhancedTooltip = (node: ExtendedOrbitalNode, aiInsights: Map<string, any>): string[] => {
  const lines: string[] = [];
  
  // Header with symbol and name
  lines.push(`${node.id} ${node.name ? `(${node.name})` : ''}`);
  lines.push('─'.repeat(25));
  
  // Price information
  lines.push(`💰 Preço: ${formatPrice(node.price)}`);
  const change24h = node.priceChange24h ?? 0;
  lines.push(`📊 24h: ${formatPercentage(change24h)}`);
  lines.push(`📈 Volume: ${node.volume?.toLocaleString() || 'N/A'}`);
  
  // AI insights section
  const aiInsight = aiInsights.get(node.id);
  if (aiInsight) {
    lines.push('');
    lines.push('🧠 AI Analysis');
    lines.push('─'.repeat(15));
    lines.push(`📋 ${getRecommendationText(aiInsight.recommendation)}`);
    lines.push(`🎯 Confiança: ${aiInsight.confidence.toFixed(1)}%`);
    lines.push(`💎 Oportunidade: ${aiInsight.opportunityScore.toFixed(0)}/100`);
    lines.push(`⚠️ Risco: ${aiInsight.riskScore.toFixed(0)}/100`);
    
    // Patterns detected
    if (aiInsight.patterns && aiInsight.patterns.length > 0) {
      const pattern = aiInsight.patterns[0];
      lines.push(`🔍 Padrão: ${pattern.type}`);
      lines.push(`   Confiança: ${pattern.confidence.toFixed(1)}%`);
    }
    
    // Latest predictions
    if (aiInsight.predictions && aiInsight.predictions.length > 0) {
      const shortTerm = aiInsight.predictions.find(p => p.horizon === '4h') || aiInsight.predictions[0];
      if (shortTerm) {
        lines.push(`🎲 Próximas 4h: ${shortTerm.direction === 'bullish' ? '📈 Alta' : '📉 Baixa'}`);
        lines.push(`   Conf: ${shortTerm.confidence.toFixed(1)}%`);
      }
    }
  }
  
  // Price action signals
  const signal = node.priceActionSignal;
  if (signal && (signal.isBreakout || signal.isExpansion || signal.isAccelerating)) {
    lines.push('');
    lines.push('⚡ Sinais Técnicos');
    lines.push('─'.repeat(15));
    if (signal.isBreakout) lines.push('💥 Volume Breakout');
    if (signal.isExpansion) lines.push('📊 Expansão de Volatilidade');
    if (signal.isAccelerating) lines.push('🚀 Aceleração de Momentum');
    if (signal.explosivePotential && signal.explosivePotential !== 'None') {
      lines.push(`🎆 Potencial: ${signal.explosivePotential}`);
    }
  }
  
  return lines;
};

class NodeRendererClass {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private nodes: ExtendedOrbitalNode[];
  private centralNode: ExtendedOrbitalNode | null;
  private selectedNodeId: string | null;
  private zoomLevel: number;
  private aiInsights: Map<string, any>;

  constructor(props: NodeRendererProps & { aiInsights: Map<string, any> }) {
    this.svg = props.svg;
    this.nodes = props.nodes;
    this.centralNode = props.centralNode;
    this.selectedNodeId = props.selectedNodeId;
    this.zoomLevel = props.zoomLevel;
    this.aiInsights = props.aiInsights;
    this.renderNodes();
  }

  private renderNodes() {
    this.svg.selectAll('.nodes-group').remove();
    const nodesGroup = this.svg.append("g").attr("class", "nodes-group");

    this.createNodePatterns(this.svg, this.nodes);

    // AI-powered glow effects with corrected radius calculation
    nodesGroup.selectAll('circle.node-glow')
      .data(this.nodes)
      .enter()
      .append('circle')
      .attr('class', 'node-glow')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => {
        const isCentral = d.id === this.centralNode?.id;
        const nodeRadius = calculateNodeRadius(d, this.zoomLevel, isCentral);
        return nodeRadius * 1.5; // Glow slightly larger than node
      })
      .attr('fill', d => getAIGlowColor(d, this.aiInsights))
      .attr('filter', 'blur(8px)')
      .attr('opacity', d => {
        const aiInsight = this.aiInsights.get(d.id);
        return aiInsight?.opportunityScore > 75 ? 0.8 : 0.5;
      });

    // Main node groups
    const node = nodesGroup.selectAll('g.node')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('data-id', d => d.id)
      .style('cursor', 'pointer')
      .on('mouseenter', (event: MouseEvent, d: ExtendedOrbitalNode) => {
        this.showTooltip(d);
      })
      .on('mouseleave', () => this.hideTooltip())
      .on('click', (event: MouseEvent, d: ExtendedOrbitalNode) => {
        const clickEvent = new CustomEvent('node-click', { detail: { nodeId: d.id } });
        document.dispatchEvent(clickEvent);
      });

    // Main node circles with CORRECTED sizing
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => {
        const isCentral = d.id === this.centralNode?.id;
        return calculateNodeRadius(d, this.zoomLevel, isCentral);
      })
      .attr('fill', d => `url(#logo-${d.id})`)
      .attr('stroke', d => {
        if (this.selectedNodeId === d.id) return '#ffffff';
        
        const aiInsight = this.aiInsights.get(d.id);
        if (aiInsight) {
          return getAIRecommendationColor(aiInsight.recommendation);
        }
        
        const signal = d.priceActionSignal;
        if (signal?.explosivePotential === 'High') return '#FFD700';
        if (signal?.isBreakout) return '#FF4500';
        
        if (d.inflow && d.outflow) {
          if (d.inflow > d.outflow) return '#00ffcc';
          if (d.outflow > d.inflow) return '#ff0066';
        }
        return '#00b5d8';
      })
      .attr('stroke-width', d => {
        const baseWidth = this.selectedNodeId === d.id ? 4 : 2;
        const aiInsight = this.aiInsights.get(d.id);
        
        // Thicker stroke for strong AI recommendations
        if (aiInsight?.recommendation === 'strong_buy' || aiInsight?.recommendation === 'strong_sell') {
          return baseWidth + 1;
        }
        
        return baseWidth;
      })
      .attr('stroke-opacity', 0.9)
      .attr('filter', d => {
        const aiInsight = this.aiInsights.get(d.id);
        if (aiInsight?.opportunityScore > 80) {
          return 'drop-shadow(0 0 12px rgba(0, 255, 136, 0.8))';
        }
        return 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))';
      });

    // Node labels with corrected positioning
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => {
        const isCentral = d.id === this.centralNode?.id;
        const nodeRadius = calculateNodeRadius(d, this.zoomLevel, isCentral);
        return nodeRadius + 16; // Position below the node
      })
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
      .text(d => {
        const aiInsight = this.aiInsights.get(d.id);
        if (aiInsight?.recommendation === 'strong_buy') return `${d.id} 🚀`;
        if (aiInsight?.recommendation === 'strong_sell') return `${d.id} ⚠️`;
        return d.id;
      });

    // AI recommendation badges for strong signals
    node.filter(d => {
      const aiInsight = this.aiInsights.get(d.id);
      return aiInsight?.recommendation === 'strong_buy' || aiInsight?.recommendation === 'strong_sell';
    })
    .append('circle')
    .attr('class', 'ai-badge')
    .attr('cx', d => {
      const isCentral = d.id === this.centralNode?.id;
      const nodeRadius = calculateNodeRadius(d, this.zoomLevel, isCentral);
      return nodeRadius * 0.7;
    })
    .attr('cy', d => {
      const isCentral = d.id === this.centralNode?.id;
      const nodeRadius = calculateNodeRadius(d, this.zoomLevel, isCentral);
      return -nodeRadius * 0.7;
    })
    .attr('r', 8)
    .attr('fill', d => {
      const aiInsight = this.aiInsights.get(d.id);
      return aiInsight?.recommendation === 'strong_buy' ? '#00FF88' : '#FF3366';
    })
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

    node.filter(d => {
      const aiInsight = this.aiInsights.get(d.id);
      return aiInsight?.recommendation === 'strong_buy' || aiInsight?.recommendation === 'strong_sell';
    })
    .append('text')
    .attr('class', 'ai-badge-text')
    .attr('x', d => {
      const isCentral = d.id === this.centralNode?.id;
      const nodeRadius = calculateNodeRadius(d, this.zoomLevel, isCentral);
      return nodeRadius * 0.7;
    })
    .attr('y', d => {
      const isCentral = d.id === this.centralNode?.id;
      const nodeRadius = calculateNodeRadius(d, this.zoomLevel, isCentral);
      return -nodeRadius * 0.7;
    })
    .attr('text-anchor', 'middle')
    .attr('dy', '0.3em')
    .attr('fill', 'white')
    .attr('font-size', '10px')
    .attr('font-weight', 'bold')
    .text('AI');
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

  private showTooltip(node: ExtendedOrbitalNode) {
    this.svg.selectAll('.node-tooltip').remove();
    
    const isCentral = node.id === this.centralNode?.id;
    const nodeRadius = calculateNodeRadius(node, this.zoomLevel, isCentral);
    
    const tooltip = this.svg.append('g')
      .attr('class', 'node-tooltip')
      .attr('transform', `translate(${node.x},${node.y - nodeRadius - 20})`);

    const textLines = createEnhancedTooltip(node, this.aiInsights);
    const padding = 12;
    const lineHeight = 18;
    const tooltipHeight = textLines.length * lineHeight + padding * 2;
    
    let maxWidth = 0;
    const tempText = tooltip.append('text').style('opacity', 0);
    textLines.forEach(line => {
      const textNode = tempText.text(line).node();
      const w = textNode?.getComputedTextLength() || 0;
      if (w > maxWidth) maxWidth = w;
    });
    tempText.remove();
    
    const tooltipWidth = Math.max(280, maxWidth + padding * 2);

    // Tooltip background with AI-themed styling
    tooltip.append('rect')
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('x', -tooltipWidth / 2)
      .attr('y', -tooltipHeight + padding / 2)
      .attr('width', tooltipWidth)
      .attr('height', tooltipHeight)
      .attr('fill', 'rgba(15, 23, 42, 0.95)')
      .attr('stroke', () => {
        const aiInsight = this.aiInsights.get(node.id);
        if (aiInsight) return getAIRecommendationColor(aiInsight.recommendation);
        return '#475569';
      })
      .attr('stroke-width', 2)
      .attr('filter', 'drop-shadow(0 8px 32px rgba(0, 0, 0, 0.8))');

    // Render tooltip text with enhanced styling
    textLines.forEach((line, i) => {
      let fillColor = '#FFFFFF';
      let fontWeight = 'normal';
      let fontSize = '12px';

      if (i === 0) {
        fillColor = '#F1F5F9';
        fontWeight = 'bold';
        fontSize = '14px';
      } else if (line.includes('─')) {
        fillColor = '#64748B';
        fontSize = '10px';
      } else if (line.includes('🧠 AI Analysis')) {
        fillColor = '#A855F7';
        fontWeight = 'bold';
        fontSize = '13px';
      } else if (line.includes('COMPRA FORTE') || line.includes('VENDA FORTE')) {
        fillColor = line.includes('COMPRA') ? '#00FF88' : '#FF3366';
        fontWeight = 'bold';
      } else if (line.includes('24h:')) {
        const change24h = parseFloat(line.split(':')[1]) || 0;
        fillColor = change24h >= 0 ? '#22c55e' : '#ef4444';
        fontWeight = 'medium';
      } else if (line.includes('⚡ Sinais Técnicos')) {
        fillColor = '#3B82F6';
        fontWeight = 'bold';
        fontSize = '13px';
      }

      tooltip.append('text')
        .attr('x', 0)
        .attr('y', -tooltipHeight + padding * 2 + i * lineHeight)
        .attr('text-anchor', 'middle')
        .attr('fill', fillColor)
        .attr('font-size', fontSize)
        .attr('font-weight', fontWeight)
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(line);
    });
  }

  private hideTooltip() {
    this.svg.selectAll('.node-tooltip').remove();
  }
}

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
