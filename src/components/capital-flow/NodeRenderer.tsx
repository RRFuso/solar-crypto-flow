
import React, { useEffect } from 'react';
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
  svg: SVGSVGElement;
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
  private svg: SVGSVGElement;
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
    // Remove existing nodes using native DOM methods
    const existingNodesGroup = this.svg.querySelector('.nodes-group');
    if (existingNodesGroup) {
      existingNodesGroup.remove();
    }

    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodesGroup.setAttribute("class", "nodes-group");
    this.svg.appendChild(nodesGroup);

    this.createNodePatterns(this.svg, this.nodes);

    // AI-powered glow effects with corrected radius calculation
    this.nodes.forEach(node => {
      const glowCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      glowCircle.setAttribute("class", "node-glow");
      glowCircle.setAttribute("cx", node.x.toString());
      glowCircle.setAttribute("cy", node.y.toString());
      
      const isCentral = node.id === this.centralNode?.id;
      const nodeRadius = calculateNodeRadius(node, this.zoomLevel, isCentral);
      glowCircle.setAttribute("r", (nodeRadius * 1.5).toString());
      
      glowCircle.setAttribute("fill", getAIGlowColor(node, this.aiInsights));
      glowCircle.setAttribute("filter", "blur(8px)");
      
      const aiInsight = this.aiInsights.get(node.id);
      const opacity = aiInsight?.opportunityScore > 75 ? 0.8 : 0.5;
      glowCircle.setAttribute("opacity", opacity.toString());
      
      nodesGroup.appendChild(glowCircle);
    });

    // Main node groups
    this.nodes.forEach(node => {
      const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      nodeGroup.setAttribute("class", "node");
      nodeGroup.setAttribute("transform", `translate(${node.x},${node.y})`);
      nodeGroup.setAttribute("data-id", node.id);
      nodeGroup.style.cursor = "pointer";
      
      // Add event listeners
      nodeGroup.addEventListener('mouseenter', () => {
        this.showTooltip(node);
      });
      nodeGroup.addEventListener('mouseleave', () => this.hideTooltip());
      nodeGroup.addEventListener('click', () => {
        const clickEvent = new CustomEvent('node-click', { detail: { nodeId: node.id } });
        document.dispatchEvent(clickEvent);
      });

      // Main node circles with CORRECTED sizing
      const nodeCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      nodeCircle.setAttribute("class", "node-circle");
      
      const isCentral = node.id === this.centralNode?.id;
      const radius = calculateNodeRadius(node, this.zoomLevel, isCentral);
      nodeCircle.setAttribute("r", radius.toString());
      nodeCircle.setAttribute("fill", `url(#logo-${node.id})`);
      
      // Set stroke color based on AI insights
      let strokeColor = '#00b5d8';
      if (this.selectedNodeId === node.id) {
        strokeColor = '#ffffff';
      } else {
        const aiInsight = this.aiInsights.get(node.id);
        if (aiInsight) {
          strokeColor = getAIRecommendationColor(aiInsight.recommendation);
        } else {
          const signal = node.priceActionSignal;
          if (signal?.explosivePotential === 'High') strokeColor = '#FFD700';
          if (signal?.isBreakout) strokeColor = '#FF4500';
          
          if (node.inflow && node.outflow) {
            if (node.inflow > node.outflow) strokeColor = '#00ffcc';
            if (node.outflow > node.inflow) strokeColor = '#ff0066';
          }
        }
      }
      
      nodeCircle.setAttribute("stroke", strokeColor);
      
      const baseWidth = this.selectedNodeId === node.id ? 4 : 2;
      const aiInsight = this.aiInsights.get(node.id);
      const strokeWidth = (aiInsight?.recommendation === 'strong_buy' || aiInsight?.recommendation === 'strong_sell') ? 
        baseWidth + 1 : baseWidth;
      
      nodeCircle.setAttribute("stroke-width", strokeWidth.toString());
      nodeCircle.setAttribute("stroke-opacity", "0.9");
      
      const filter = aiInsight?.opportunityScore > 80 ? 
        'drop-shadow(0 0 12px rgba(0, 255, 136, 0.8))' : 
        'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))';
      nodeCircle.setAttribute("filter", filter);
      
      nodeGroup.appendChild(nodeCircle);

      // Node labels with corrected positioning
      const nodeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      nodeText.setAttribute("text-anchor", "middle");
      nodeText.setAttribute("dy", (radius + 16).toString());
      nodeText.setAttribute("fill", "white");
      nodeText.setAttribute("font-size", "12px");
      nodeText.setAttribute("font-weight", "bold");
      nodeText.style.pointerEvents = "none";
      nodeText.style.textShadow = "1px 1px 2px rgba(0,0,0,0.8)";
      
      let labelText = node.id;
      if (aiInsight?.recommendation === 'strong_buy') labelText = `${node.id} 🚀`;
      if (aiInsight?.recommendation === 'strong_sell') labelText = `${node.id} ⚠️`;
      nodeText.textContent = labelText;
      
      nodeGroup.appendChild(nodeText);

      // AI recommendation badges for strong signals
      const aiInsight2 = this.aiInsights.get(node.id);
      if (aiInsight2?.recommendation === 'strong_buy' || aiInsight2?.recommendation === 'strong_sell') {
        const badge = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        badge.setAttribute("class", "ai-badge");
        badge.setAttribute("cx", (radius * 0.7).toString());
        badge.setAttribute("cy", (-radius * 0.7).toString());
        badge.setAttribute("r", "8");
        badge.setAttribute("fill", aiInsight2.recommendation === 'strong_buy' ? '#00FF88' : '#FF3366');
        badge.setAttribute("stroke", "white");
        badge.setAttribute("stroke-width", "2");
        nodeGroup.appendChild(badge);

        const badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        badgeText.setAttribute("class", "ai-badge-text");
        badgeText.setAttribute("x", (radius * 0.7).toString());
        badgeText.setAttribute("y", (-radius * 0.7).toString());
        badgeText.setAttribute("text-anchor", "middle");
        badgeText.setAttribute("dy", "0.3em");
        badgeText.setAttribute("fill", "white");
        badgeText.setAttribute("font-size", "10px");
        badgeText.setAttribute("font-weight", "bold");
        badgeText.textContent = "AI";
        nodeGroup.appendChild(badgeText);
      }

      nodesGroup.appendChild(nodeGroup);
    });
  }

  private createNodePatterns(svg: SVGSVGElement, nodes: ExtendedOrbitalNode[]) {
    const existingDefs = svg.querySelector('defs');
    if (existingDefs) {
      existingDefs.remove();
    }
    
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.appendChild(defs);
    
    nodes.forEach(node => {
      const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
      pattern.setAttribute('id', `logo-${node.id}`);
      pattern.setAttribute('width', '1');
      pattern.setAttribute('height', '1');
      pattern.setAttribute('patternContentUnits', 'objectBoundingBox');

      const logoUrl = getCryptoLogoUrl(node.id);
      const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
      image.setAttribute('href', logoUrl);
      image.setAttribute('width', '1');
      image.setAttribute('height', '1');
      image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      image.addEventListener('error', () => {
        image.setAttribute('href', getFallbackLogoUrl());
      });
      
      pattern.appendChild(image);
      defs.appendChild(pattern);
    });
  }

  private showTooltip(node: ExtendedOrbitalNode) {
    const existingTooltip = this.svg.querySelector('.node-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    const isCentral = node.id === this.centralNode?.id;
    const nodeRadius = calculateNodeRadius(node, this.zoomLevel, isCentral);
    
    const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tooltip.setAttribute('class', 'node-tooltip');
    tooltip.setAttribute('transform', `translate(${node.x},${node.y - nodeRadius - 20})`);

    const textLines = createEnhancedTooltip(node, this.aiInsights);
    const padding = 12;
    const lineHeight = 18;
    const tooltipHeight = textLines.length * lineHeight + padding * 2;
    
    // Calculate tooltip width
    const tooltipWidth = Math.max(280, 200 + padding * 2);

    // Tooltip background with AI-themed styling
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute('rx', '12');
    rect.setAttribute('ry', '12');
    rect.setAttribute('x', (-tooltipWidth / 2).toString());
    rect.setAttribute('y', (-tooltipHeight + padding / 2).toString());
    rect.setAttribute('width', tooltipWidth.toString());
    rect.setAttribute('height', tooltipHeight.toString());
    rect.setAttribute('fill', 'rgba(15, 23, 42, 0.95)');
    
    const aiInsight = this.aiInsights.get(node.id);
    const strokeColor = aiInsight ? getAIRecommendationColor(aiInsight.recommendation) : '#475569';
    rect.setAttribute('stroke', strokeColor);
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('filter', 'drop-shadow(0 8px 32px rgba(0, 0, 0, 0.8))');
    tooltip.appendChild(rect);

    // Render tooltip text with enhanced styling
    textLines.forEach((line, i) => {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute('x', '0');
      text.setAttribute('y', (-tooltipHeight + padding * 2 + i * lineHeight).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', 'Inter, system-ui, sans-serif');
      
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

      text.setAttribute('fill', fillColor);
      text.setAttribute('font-size', fontSize);
      text.setAttribute('font-weight', fontWeight);
      text.textContent = line;
      tooltip.appendChild(text);
    });

    this.svg.appendChild(tooltip);
  }

  private hideTooltip() {
    const existingTooltip = this.svg.querySelector('.node-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
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
      const existingNodesGroup = props.svg.querySelector('.nodes-group');
      if (existingNodesGroup) {
        existingNodesGroup.remove();
      }
      const existingTooltip = props.svg.querySelector('.node-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }
    };
  }, [props.nodes, props.selectedNodeId, props.zoomLevel, props.svg, aiInsights]);

  return null;
});
