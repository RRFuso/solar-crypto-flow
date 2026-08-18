import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { getLogoUrls } from '@/lib/cryptoLogos';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { AIInsight } from '@/hooks/useAdvancedAI';
import { useTooltip } from '@/contexts/TooltipContext';
import { CapitalFlowLink } from '@/types/capitalFlow';
import { FlowDirection } from '@/hooks/useSmartMoneyFlows';

import { ExtendedOrbitalNode } from '@/types/orbitalNodes';

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: ExtendedOrbitalNode[];
  centralNode: ExtendedOrbitalNode | null;
  selectedNodeId: string | null;
  zoomLevel: number;
  aiInsights: Map<string, AIInsight>;
  smartMoneyScores: Map<string, { score: number; sentiment: 'Bearish' | 'Neutral' | 'Bullish'; confidence?: number; factors?: string[] }>;
  activeCategory?: string;
  links?: CapitalFlowLink[];
  flowDirections?: Map<string, FlowDirection>;
  /** Max number of visible labels (label virtualization). Defaults to Infinity. */
  maxLabels?: number;
}

const getAIRecommendationColor = (recommendation: string): string => {
  switch (recommendation) {
    case 'strong_buy': return '#00FF88';
    case 'buy': return '#66FF99';
    case 'hold': return '#8A2BE2';
    case 'sell': return '#FF6666';
    case 'strong_sell': return '#FF3366';
    default: return '#8A9196';
  }
};

const getAIGlowColor = (node: ExtendedOrbitalNode, aiInsights: Map<string, AIInsight>): string => {
  const signal = node.priceActionSignal;
  if (signal?.explosivePotential === 'High') return 'rgba(128, 0, 128, 0.9)';
  
  const aiInsight = aiInsights.get(node.id);
  if (aiInsight) {
    if (aiInsight.opportunityScore > 80) return 'rgba(0, 255, 136, 0.7)';
    if (aiInsight.riskScore > 70) return 'rgba(255, 50, 50, 0.7)';
  }
  
  return 'rgba(0, 181, 216, 0.4)';
};

const calculateNodeRadius = (node: ExtendedOrbitalNode, zoomLevel: number, isCentral: boolean = false): number => {
  const baseRadius = isCentral ? 25 : 15;
  let volFactor = 1;
  if (node.volume && node.volume > 0) {
    const logVolume = Math.log10(node.volume);
    volFactor = Math.min(2.5, Math.max(0.5, logVolume / 10));
  }
  const zoomFactor = Math.min(2, Math.max(0.5, zoomLevel / 100));
  const aiMultiplier = node.priceActionSignal?.explosivePotential === 'High' ? 1.2 : 1.0;
  const calculatedRadius = baseRadius * volFactor * zoomFactor * aiMultiplier;
  const minRadius = isCentral ? 20 : 12;
  const maxRadius = isCentral ? 40 : 25;
  return Math.max(minRadius, Math.min(maxRadius, calculatedRadius));
};

const generatePriceActionAnalysis = (node: ExtendedOrbitalNode): string => {
  if (typeof node.priceChange24h !== 'number') {
    return "Análise de preço indisponível.";
  }

  const change = node.priceChange24h;
  if (change > 5) {
    return `Forte tendência de alta nas últimas 24h (+${change.toFixed(2)}%). O volume acompanha o movimento.`;
  }
  if (change > 1) {
    return `Leve tendência de alta nas últimas 24h (+${change.toFixed(2)}%).`;
  }
  if (change < -5) {
    return `Forte tendência de baixa nas últimas 24h (${change.toFixed(2)}%). Recomenda-se cautela.`;
  }
  if (change < -1) {
    return `Leve tendência de baixa nas últimas 24h (${change.toFixed(2)}%).`;
  }
  return `Preço estável nas últimas 24h (${change.toFixed(2)}%). Movimento lateral.`;
};

const createTooltipData = (node: ExtendedOrbitalNode, aiInsights: Map<string, AIInsight>, allCapitalFlows?: CapitalFlowLink[]) => {
    const aiInsight = aiInsights.get(node.id);
    const trendReasons = [];
    if (aiInsight) {
        if (aiInsight.predictions[0]?.bullishFactors) {
            trendReasons.push(...aiInsight.predictions[0].bullishFactors);
        }
        if (aiInsight.predictions[0]?.bearishFactors) {
            trendReasons.push(...aiInsight.predictions[0].bearishFactors);
        }
    }
    
    const priceActionAnalysisText = generatePriceActionAnalysis(node);

    // Parse price properly - handle both string and number formats
    let priceValue: number | undefined;
    if (typeof node.price === 'string') {
        const cleaned = node.price.replace(/[$,]/g, '');
        priceValue = parseFloat(cleaned);
    } else if (typeof node.price === 'number') {
        priceValue = node.price;
    }

    return {
        id: node.id,
        name: node.name || 'Unknown',
        price: priceValue,
        priceChange24h: node.priceChange24h,
        volume: node.volume,
        capitalFlows: node.capitalFlows,
        allCapitalFlows: allCapitalFlows, // Pass all flows for global scale
        aiModel: aiInsight,
        trendReasons: trendReasons,
        aiAnalysis: {
            ...(aiInsight || {}),
            recommendation: aiInsight?.recommendation || 'N/A',
            confidence: aiInsight?.confidence || 0,
            priceAction: priceActionAnalysisText,
        },
        explosivePotential: node.priceActionSignal?.explosivePotential,
        keyFactors: aiInsight?.predictions[0]?.keyFactors,
    };
};

const renderOrUpdateVisualization = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: ExtendedOrbitalNode[],
  centralNode: ExtendedOrbitalNode | null,
  selectedNodeId: string | null,
  zoomLevel: number,
  aiInsights: Map<string, AIInsight>,
  smartMoneyScores: Map<string, { score: number; sentiment: 'Bearish' | 'Neutral' | 'Bullish'; confidence?: number; factors?: string[] }>,
  showTooltip: (data: any, position: { x: number, y: number }) => void,
  hideTooltip: () => void,
  activeCategory: string = 'all',
  allCapitalFlows?: CapitalFlowLink[],
  flowDirections?: Map<string, FlowDirection>,
  maxLabels: number = Infinity,
) => {
  // Helper: lookup smart money score with case-insensitive matching
  const getSmartMoneyScore = (nodeId: string) => {
    return smartMoneyScores.get(nodeId) || smartMoneyScores.get(nodeId.toUpperCase()) || smartMoneyScores.get(nodeId.toLowerCase());
  };

  // Helper: get effective smart money confidence (0-100) from both data sources.
  // A ring is only meaningful when the signal is *directional* — a neutral flow
  // (or a neutral oracle sentiment) is not a smart-money signal, no matter how
  // confident the aggregation was.
  const getEffectiveSmartMoneyConfidence = (nodeId: string): number => {
    const upperId = nodeId.toUpperCase();

    // Source 1: flowDirections from smart-money-tracker (confidence already 0-100,
    // and already zeroed by the hook when the cache row is stale).
    const flow = flowDirections?.get(upperId);
    const flowConfidence = flow && flow.direction !== 0
      ? Math.min(100, flow.confidenceScore || 0)
      : 0;

    // Source 2: smartMoneyScores from onchain-oracle (confidence 0-1, score -10 to 10)
    const oracleScore = getSmartMoneyScore(nodeId);
    const oracleDirectional = !!oracleScore && oracleScore.sentiment !== 'Neutral' && Math.abs(oracleScore.score) >= 3;
    // Convert oracle confidence (0-1) to percentage, also factor in absolute score strength
    const oracleConfidence = oracleDirectional
      ? Math.max(
          (oracleScore!.confidence || 0) * 100,
          Math.abs(oracleScore!.score) >= 5 ? 75 : 60
        )
      : 0;

    // Return the highest confidence from either source
    return Math.max(flowConfidence, oracleConfidence);
  };

  let defs = svg.select('defs');
  if (defs.empty()) {
    defs = svg.append('defs');
  }

  // Add glow filters with enhanced visual effects
  if (defs.select('#bullish-glow').empty()) {
    const bullishFilter = defs.append('filter')
      .attr('id', 'bullish-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    bullishFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    
    bullishFilter.append('feFlood')
      .attr('flood-color', '#22c55e')
      .attr('flood-opacity', '0.6')
      .attr('result', 'glowColor');
    
    bullishFilter.append('feComposite')
      .attr('in', 'glowColor')
      .attr('in2', 'coloredBlur')
      .attr('operator', 'in')
      .attr('result', 'coloredGlow');
    
    const bullishMerge = bullishFilter.append('feMerge');
    bullishMerge.append('feMergeNode').attr('in', 'coloredGlow');
    bullishMerge.append('feMergeNode').attr('in', 'SourceGraphic');
  }
  
  if (defs.select('#bearish-glow').empty()) {
    const bearishFilter = defs.append('filter')
      .attr('id', 'bearish-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    bearishFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    
    bearishFilter.append('feFlood')
      .attr('flood-color', '#ef4444')
      .attr('flood-opacity', '0.6')
      .attr('result', 'glowColor');
    
    bearishFilter.append('feComposite')
      .attr('in', 'glowColor')
      .attr('in2', 'coloredBlur')
      .attr('operator', 'in')
      .attr('result', 'coloredGlow');
    
    const bearishMerge = bearishFilter.append('feMerge');
    bearishMerge.append('feMergeNode').attr('in', 'coloredGlow');
    bearishMerge.append('feMergeNode').attr('in', 'SourceGraphic');
  }
  
  // Add pulsing ring animation filter
  if (defs.select('#pulse-animation').empty()) {
    defs.append('style').text(`
      @keyframes pulse-ring {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.15); opacity: 0.4; }
        100% { transform: scale(1); opacity: 0.8; }
      }
      @keyframes golden-shimmer {
        0% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -20; }
      }
      .sentiment-ring-bullish {
        animation: pulse-ring 2s ease-in-out infinite;
        transform-origin: center;
      }
      .sentiment-ring-bearish {
        animation: pulse-ring 1.5s ease-in-out infinite;
        transform-origin: center;
      }
      .premium-smart-money-shimmer {
        animation: golden-shimmer 1.5s linear infinite;
        transform-origin: center;
      }
    `);
  }

  // Add golden glow filter for premium smart money
  if (defs.select('#golden-glow').empty()) {
    const goldenFilter = defs.append('filter')
      .attr('id', 'golden-glow')
      .attr('x', '-80%')
      .attr('y', '-80%')
      .attr('width', '260%')
      .attr('height', '260%');
    
    goldenFilter.append('feGaussianBlur')
      .attr('stdDeviation', '6')
      .attr('result', 'coloredBlur');
    
    goldenFilter.append('feFlood')
      .attr('flood-color', '#facc15')
      .attr('flood-opacity', '0.7')
      .attr('result', 'glowColor');
    
    goldenFilter.append('feComposite')
      .attr('in', 'glowColor')
      .attr('in2', 'coloredBlur')
      .attr('operator', 'in')
      .attr('result', 'coloredGlow');
    
    const goldenMerge = goldenFilter.append('feMerge');
    goldenMerge.append('feMergeNode').attr('in', 'coloredGlow');
    goldenMerge.append('feMergeNode').attr('in', 'SourceGraphic');
  }

  const patterns = defs.selectAll('pattern')
    .data(nodes, (d: ExtendedOrbitalNode) => d.id);

  patterns.exit().remove();

  const patternEnter = patterns.enter().append('pattern')
    .attr('id', (d: ExtendedOrbitalNode) => {
      // Sanitize ID to prevent encoding issues with special characters
      const sanitizedId = d.id.replace(/[^a-zA-Z0-9-_]/g, '_');
      return `logo-${sanitizedId}`;
    })
    .attr('width', 1)
    .attr('height', 1)
    .attr('patternContentUnits', 'objectBoundingBox');

  patternEnter.each(function(d) {
    const pattern = d3.select(this);
    try {
      const logoUrls = getLogoUrls(d.id);
      let currentUrlIndex = 0;
      const loadImage = () => {
        if (currentUrlIndex >= logoUrls.length) return;
        try {
          const imageUrl = logoUrls[currentUrlIndex];
          pattern.select('image').remove();
          pattern.append('image')
            .attr('href', imageUrl)
            .attr('width', 1)
            .attr('height', 1)
            .attr('preserveAspectRatio', 'xMidYMid slice')
            .on('error', () => {
              currentUrlIndex++;
              loadImage();
            });
        } catch (e) {
          console.warn(`Failed to load image for ${d.id}:`, e);
        }
      };
      loadImage();
    } catch (e) {
      console.warn(`Failed to create pattern for ${d.id}:`, e);
    }
  });

  let nodesGroup = svg.select('.nodes-group');
  if (nodesGroup.empty()) {
    nodesGroup = svg.append('g').attr('class', 'nodes-group');
  }

  const nodeSelection = nodesGroup.selectAll('g.node')
    .data(nodes, (d: ExtendedOrbitalNode) => d.id);

  nodeSelection.exit()
    .transition().duration(500)
    .attr('transform', (d: ExtendedOrbitalNode) => `translate(${d.x}, ${d.y}) scale(0)`)
    .remove();

  let tooltipHideTimer: NodeJS.Timeout;

  const nodeEnter = nodeSelection.enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d: ExtendedOrbitalNode) => `translate(${d.x}, ${d.y}) scale(0)`)
    .style('cursor', 'pointer')
    .on('click', (event: MouseEvent, d: ExtendedOrbitalNode) => {
      const clickEvent = new CustomEvent('node-click', { detail: { nodeId: d.id } });
      document.dispatchEvent(clickEvent);
    })
    .on('mouseover', (event: MouseEvent, d: ExtendedOrbitalNode) => {
        clearTimeout(tooltipHideTimer);
        const tooltipData = createTooltipData(d, aiInsights, allCapitalFlows);
        showTooltip(tooltipData, { x: event.clientX, y: event.clientY });
    })
    .on('mouseout', () => {
        tooltipHideTimer = setTimeout(() => {
            hideTooltip();
        }, 300);
    });

  // Sentiment indicator ring (outermost)
  nodeEnter.append('circle')
    .attr('class', 'sentiment-ring')
    .attr('r', 0)
    .attr('fill', 'none')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '4,2');

   // Smart Money dashed ring
  nodeEnter.append('circle')
    .attr('class', 'smart-money-dashed-ring')
    .attr('r', 0)
    .attr('fill', 'none')
    .attr('stroke', '#facc15')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,3')
    .attr('opacity', 0);

  nodeEnter.append('circle')
    .attr('class', 'node-glow')
    .attr('r', 0);

  nodeEnter.append('circle')
    .attr('class', 'node-circle')
    .attr('r', 0);

  // Sentiment badge background
  nodeEnter.append('rect')
    .attr('class', 'sentiment-badge-bg')
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('opacity', 0);

  // Sentiment badge text
  nodeEnter.append('text')
    .attr('class', 'sentiment-badge-text')
    .attr('text-anchor', 'middle')
    .attr('font-size', '8px')
    .attr('font-weight', 'bold')
    .attr('fill', 'white')
    .style('pointer-events', 'none')
    .attr('opacity', 0);

  // Sentiment arrow indicator
  nodeEnter.append('text')
    .attr('class', 'sentiment-arrow')
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .style('pointer-events', 'none')
    .attr('opacity', 0);

  nodeEnter.append('text')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .style('pointer-events', 'none')
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');

  const nodeUpdate = nodeEnter.merge(nodeSelection as d3.Selection<SVGGElement, ExtendedOrbitalNode, SVGGElement, unknown>);
  
  // Build set of connected node IDs for selected node
  const connectedNodeIds = new Set<string>();
  if (selectedNodeId) {
    connectedNodeIds.add(selectedNodeId);
    (allCapitalFlows || []).forEach(link => {
      const srcId = (link as any).source?.id || (link as any).source;
      const tgtId = (link as any).target?.id || (link as any).target;
      if (srcId === selectedNodeId) connectedNodeIds.add(tgtId);
      if (tgtId === selectedNodeId) connectedNodeIds.add(srcId);
    });
  }

  // Label virtualization: pick top-N nodes for visible labels.
  // Priority: central > selected/connected > Oracle-highlighted > smart-money > marketCap.
  const labelVisibleIds = new Set<string>();
  if (Number.isFinite(maxLabels) && nodes.length > maxLabels) {
    const ranked = [...nodes].map(n => {
      let p = (n as any).marketCap || 0;
      if (centralNode && n.id === centralNode.id) p += 1e20;
      if (selectedNodeId && connectedNodeIds.has(n.id)) p += 1e18;
      if ((n as any)._commandHighlighted) p += 1e17;
      const sm = getSmartMoneyScore(n.id);
      if (sm && (sm.sentiment === 'Bullish' || sm.sentiment === 'Bearish')) p += 1e15;
      return { id: n.id, p };
    }).sort((a, b) => b.p - a.p);
    ranked.slice(0, maxLabels).forEach(r => labelVisibleIds.add(r.id));
  } else {
    nodes.forEach(n => labelVisibleIds.add(n.id));
  }


  nodeUpdate.transition().duration(750)
    .attr('transform', (d: ExtendedOrbitalNode) => `translate(${d.x}, ${d.y}) scale(1)`)
    .style('opacity', (d: any) => {
      // If the Oracle has highlighted specific symbols, dim unselected ones
      if (d._hasCommandFilter) {
        return d._commandHighlighted ? 1 : 0.15;
      }
      // Selected node: highlight connected, dim others
      if (selectedNodeId) {
        return connectedNodeIds.has(d.id) ? 1 : 0.15;
      }
      // Category filter
      if (activeCategory !== 'all') {
        const belongsTo = d.categories?.includes(activeCategory);
        return belongsTo ? 1 : 0.2;
      }
      return 1;
    });

  // Update Smart Money dashed ring (confidence > 70% from ANY source)
  nodeUpdate.select('circle.smart-money-dashed-ring')
    .transition().duration(750)
    .attr('r', (d: ExtendedOrbitalNode) => {
      const confidence = getEffectiveSmartMoneyConfidence(d.id);
      if (confidence > 70) {
        return calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) * 1.8;
      }
      return 0;
    })
    .attr('stroke', (d: ExtendedOrbitalNode) => {
      const confidence = getEffectiveSmartMoneyConfidence(d.id);
      if (confidence > 85) return '#f59e0b';
      return '#facc15';
    })
    .attr('stroke-width', (d: ExtendedOrbitalNode) => {
      const confidence = getEffectiveSmartMoneyConfidence(d.id);
      return confidence > 85 ? 2.5 : 2;
    })
    .attr('opacity', (d: ExtendedOrbitalNode) => {
      const confidence = getEffectiveSmartMoneyConfidence(d.id);
      return confidence > 70 ? 0.9 : 0;
    })
    .attr('class', (d: ExtendedOrbitalNode) => {
      const confidence = getEffectiveSmartMoneyConfidence(d.id);
      if (confidence > 70) {
        return 'smart-money-dashed-ring premium-smart-money-shimmer';
      }
      return 'smart-money-dashed-ring';
    });

  // Update sentiment ring (pulsing outer ring for on-chain sentiment)
  nodeUpdate.select('circle.sentiment-ring')
    .transition().duration(750)
    .attr('r', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish' || onChainSentiment === 'Bearish') {
        return calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) * 1.8;
      }
      return 0;
    })
    .attr('stroke', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish') return '#22c55e';
      if (onChainSentiment === 'Bearish') return '#ef4444';
      return 'transparent';
    })
    .attr('class', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish') return 'sentiment-ring sentiment-ring-bullish';
      if (onChainSentiment === 'Bearish') return 'sentiment-ring sentiment-ring-bearish';
      return 'sentiment-ring';
    });

  nodeUpdate.select('circle.node-glow')
    .transition().duration(750)
    .attr('r', (d: ExtendedOrbitalNode) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) * 1.5)
    .attr('fill', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish') return 'rgba(34, 197, 94, 0.6)';
      if (onChainSentiment === 'Bearish') return 'rgba(239, 68, 68, 0.6)';
      return getAIGlowColor(d, aiInsights);
    })
    .attr('filter', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish') return 'url(#bullish-glow)';
      if (onChainSentiment === 'Bearish') return 'url(#bearish-glow)';
      return 'blur(8px)';
    })
    .attr('opacity', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish' || onChainSentiment === 'Bearish') return 0.9;
      return aiInsights.get(d.id)?.opportunityScore > 75 ? 0.8 : 0.5;
    });

  // Update sentiment badge
  nodeUpdate.select('rect.sentiment-badge-bg')
    .transition().duration(750)
    .attr('x', (d: ExtendedOrbitalNode) => -16)
    .attr('y', (d: ExtendedOrbitalNode) => -calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) - 20)
    .attr('width', 32)
    .attr('height', 14)
    .attr('fill', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish') return '#22c55e';
      if (onChainSentiment === 'Bearish') return '#ef4444';
      return 'transparent';
    })
    .attr('opacity', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      return (onChainSentiment === 'Bullish' || onChainSentiment === 'Bearish') ? 0.9 : 0;
    });

  nodeUpdate.select('text.sentiment-badge-text')
    .transition().duration(750)
    .attr('y', (d: ExtendedOrbitalNode) => -calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) - 10)
    .text((d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish') return '▲ BULL';
      if (onChainSentiment === 'Bearish') return '▼ BEAR';
      return '';
    })
    .attr('opacity', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      return (onChainSentiment === 'Bullish' || onChainSentiment === 'Bearish') ? 1 : 0;
    });

  // Update sentiment arrow indicator (below node)
  nodeUpdate.select('text.sentiment-arrow')
    .transition().duration(750)
    .attr('y', (d: ExtendedOrbitalNode) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) + 30)
    .text((d: ExtendedOrbitalNode) => {
      const score = getSmartMoneyScore(d.id);
      if (!score) return '';
      const intensity = score.score || 0;
      if (score.sentiment === 'Bullish') {
        return intensity > 70 ? '⬆️⬆️' : '⬆️';
      }
      if (score.sentiment === 'Bearish') {
        return intensity > 70 ? '⬇️⬇️' : '⬇️';
      }
      return '';
    })
    .attr('fill', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish') return '#22c55e';
      if (onChainSentiment === 'Bearish') return '#ef4444';
      return 'transparent';
    })
    .attr('opacity', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;
      return (onChainSentiment === 'Bullish' || onChainSentiment === 'Bearish') ? 1 : 0;
    });

  nodeUpdate.each(function(d: ExtendedOrbitalNode) {
    const nodeGroup = d3.select(this);
    if (d.priceActionSignal?.explosivePotential === 'High') {
      nodeGroup.selectAll('.comet-trail').remove();

      const trail = nodeGroup.insert('g', ':first-child')
        .attr('class', 'comet-trail');

      const trailLength = 5;
      const trailOpacity = d3.scaleLinear()
        .domain([0, trailLength])
        .range([0.6, 0]);

      for (let i = 0; i < trailLength; i++) {
        trail.append('circle')
          .attr('r', calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) * (1 - i / trailLength))
          .attr('fill', 'rgba(255, 223, 0, 0.8)')
          .attr('opacity', trailOpacity(i))
          .transition()
          .delay(i * 50)
          .ease(d3.easeQuadOut)
          .attr('transform', `translate(0, ${i * 4})`);
      }
    } else {
      nodeGroup.selectAll('.comet-trail').remove();
    }
  });

  nodeUpdate.select('circle.node-circle')
    .transition().duration(750)
    .attr('r', (d: ExtendedOrbitalNode) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id))
    .attr('fill', (d: ExtendedOrbitalNode) => {
      const sanitizedId = d.id.replace(/[^a-zA-Z0-9-_]/g, '_');
      return `url(#logo-${sanitizedId})`;
    })
    .attr('stroke', (d: any) => {
      if ((d as any)._commandHighlighted) return '#facc15'; // Gold highlight for Oracle-selected
      if (selectedNodeId === d.id) return '#ffffff';
      if (d.priceActionSignal?.explosivePotential === 'High') return '#800080';
      const aiInsight = aiInsights.get(d.id);
      if (aiInsight) return getAIRecommendationColor(aiInsight.recommendation);
      return '#00b5d8';
    })
    .attr('stroke-width', (d: any) => {
      if ((d as any)._commandHighlighted) return 4;
      return selectedNodeId === d.id ? 4 : 2;
    });

  nodeUpdate.selectAll('text:not(.sentiment-badge-text):not(.sentiment-arrow)')
    .filter(function() { return !d3.select(this).classed('sentiment-badge-text') && !d3.select(this).classed('sentiment-arrow'); })
    .transition().duration(750)
    .attr('dy', (d: ExtendedOrbitalNode) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) + 16)
    .attr('opacity', (d: ExtendedOrbitalNode) => labelVisibleIds.has(d.id) ? 1 : 0)
    .text((d: ExtendedOrbitalNode) => {
      if (!labelVisibleIds.has(d.id)) return '';
      const aiInsight = aiInsights.get(d.id);
      const onChainSentiment = getSmartMoneyScore(d.id)?.sentiment;

      // Add on-chain indicator to the symbol name
      let suffix = '';
      if (onChainSentiment === 'Bullish') suffix = ' 🟢';
      else if (onChainSentiment === 'Bearish') suffix = ' 🔴';
      else if (aiInsight?.recommendation === 'strong_buy') suffix = ' 🚀';
      else if (aiInsight?.recommendation === 'strong_sell') suffix = ' ⚠️';

      return `${d.id}${suffix}`;
    });
};

export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  const { showTooltip, hideTooltip } = useTooltip();
  useEffect(() => {
    if (props.svg && props.nodes) {
      renderOrUpdateVisualization(
        props.svg,
        props.nodes,
        props.centralNode,
        props.selectedNodeId,
        props.zoomLevel,
        props.aiInsights,
        props.smartMoneyScores,
        showTooltip,
        hideTooltip,
        props.activeCategory || 'all',
        props.links,
        props.flowDirections,
        props.maxLabels ?? Infinity
      );
    }
  }, [props.svg, props.nodes, props.centralNode, props.selectedNodeId, props.zoomLevel, props.aiInsights, props.smartMoneyScores, showTooltip, hideTooltip, props.activeCategory, props.links, props.flowDirections, props.maxLabels]);

  return null;
});