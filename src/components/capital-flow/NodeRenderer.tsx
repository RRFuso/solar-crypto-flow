import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { getLogoUrls } from '@/lib/cryptoLogos';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { AIInsight } from '@/hooks/useAdvancedAI';
import { useTooltip } from '@/contexts/TooltipContext';
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { CapitalFlowLink } from '@/types/capitalFlow';
import { BinanceTickerData } from '@/hooks/useBinanceWebSocket';
import { ExtendedOrbitalNode } from '@/types/orbitalNodes';

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: ExtendedOrbitalNode[];
  centralNode: ExtendedOrbitalNode | null;
  selectedNodeId: string | null;
  zoomLevel: number;
  aiInsights: Map<string, AIInsight>;
  smartMoneyScores: Map<string, { score: number; sentiment: 'Bearish' | 'Neutral' | 'Bullish' }>;
  activeCategory?: string;
  links?: CapitalFlowLink[];
  realtimeTickers?: Map<string, BinanceTickerData>;
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

const createTooltipData = (
  node: ExtendedOrbitalNode, 
  aiInsights: Map<string, AIInsight>, 
  allCapitalFlows?: CapitalFlowLink[],
  realtimeTicker?: BinanceTickerData
) => {
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

    // Use realtime price if available, otherwise fallback to node price
    let priceValue: number | undefined;
    let priceChange24h: number | undefined = node.priceChange24h;
    let volume: number | undefined = node.volume;
    
    if (realtimeTicker) {
      priceValue = realtimeTicker.price;
      priceChange24h = realtimeTicker.priceChangePercent;
      volume = realtimeTicker.quoteVolume;
    } else if (typeof node.price === 'string') {
        const cleaned = node.price.replace(/[$,]/g, '');
        priceValue = parseFloat(cleaned);
    } else if (typeof node.price === 'number') {
        priceValue = node.price;
    }

    return {
        id: node.id,
        name: node.name || 'Unknown',
        price: priceValue,
        priceChange24h: priceChange24h,
        volume: volume,
        capitalFlows: node.capitalFlows,
        allCapitalFlows: allCapitalFlows,
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
        isRealtime: !!realtimeTicker,
        lastUpdate: realtimeTicker?.lastUpdate,
    };
};

const renderOrUpdateVisualization = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: ExtendedOrbitalNode[],
  centralNode: ExtendedOrbitalNode | null,
  selectedNodeId: string | null,
  zoomLevel: number,
  aiInsights: Map<string, AIInsight>,
  smartMoneyScores: Map<string, { score: number; sentiment: 'Bearish' | 'Neutral' | 'Bullish' }>,
  showTooltip: (data: any, position: { x: number, y: number }) => void,
  hideTooltip: () => void,
  activeCategory: string = 'all',
  allCapitalFlows?: CapitalFlowLink[],
  realtimeTickers?: Map<string, BinanceTickerData>,
) => {
  let defs = svg.select('defs');
  if (defs.empty()) {
    defs = svg.append('defs');
  }

  // Add glow filters
  const bullishGlow = defs.append('filter')
    .attr('id', 'bullish-glow')
    .append('feGaussianBlur')
    .attr('stdDeviation', '3.5')
    .attr('result', 'coloredBlur');
  
  const bearishGlow = defs.append('filter')
    .attr('id', 'bearish-glow')
    .append('feGaussianBlur')
    .attr('stdDeviation', '3.5')
    .attr('result', 'coloredBlur');

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
        const realtimeTicker = realtimeTickers?.get(d.id);
        const tooltipData = createTooltipData(d, aiInsights, allCapitalFlows, realtimeTicker);
        showTooltip(tooltipData, { x: event.clientX, y: event.clientY });
    })
    .on('mouseout', () => {
        tooltipHideTimer = setTimeout(() => {
            hideTooltip();
        }, 300);
    });

  nodeEnter.append('circle')
    .attr('class', 'node-glow')
    .attr('r', 0);

  nodeEnter.append('circle')
    .attr('class', 'node-circle')
    .attr('r', 0);

  nodeEnter.append('text')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .style('pointer-events', 'none')
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');

  const nodeUpdate = nodeEnter.merge(nodeSelection as d3.Selection<SVGGElement, ExtendedOrbitalNode, SVGGElement, unknown>);
  
  nodeUpdate.transition().duration(750)
    .attr('transform', (d: ExtendedOrbitalNode) => `translate(${d.x}, ${d.y}) scale(1)`)
    .style('opacity', (d: ExtendedOrbitalNode) => {
      // Se uma categoria específica está selecionada, reduz opacidade dos nós que não pertencem a ela
      if (activeCategory !== 'all') {
        // A 'categories' agora é um array no nó
        const belongsTo = d.categories?.includes(activeCategory);
        return belongsTo ? 1 : 0.2;
      }
      return 1;
    });

  nodeUpdate.select('circle.node-glow')
    .transition().duration(750)
    .attr('r', (d: ExtendedOrbitalNode) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) * 1.5)
    .attr('fill', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = smartMoneyScores.get(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish') return 'rgba(0, 255, 0, 0.7)';
      if (onChainSentiment === 'Bearish') return 'rgba(255, 0, 0, 0.7)';
      return getAIGlowColor(d, aiInsights);
    })
    .attr('filter', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = smartMoneyScores.get(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish') return 'url(#bullish-glow)';
      if (onChainSentiment === 'Bearish') return 'url(#bearish-glow)';
      return 'blur(8px)';
    })
    .attr('opacity', (d: ExtendedOrbitalNode) => {
      const onChainSentiment = smartMoneyScores.get(d.id)?.sentiment;
      if (onChainSentiment === 'Bullish' || onChainSentiment === 'Bearish') return 0.9;
      return aiInsights.get(d.id)?.opportunityScore > 75 ? 0.8 : 0.5;
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
      // Use sanitized ID to match pattern creation
      const sanitizedId = d.id.replace(/[^a-zA-Z0-9-_]/g, '_');
      return `url(#logo-${sanitizedId})`;
    })
    .attr('stroke', (d: ExtendedOrbitalNode) => {
      if (selectedNodeId === d.id) return '#ffffff';
      if (d.priceActionSignal?.explosivePotential === 'High') return '#800080';
      const aiInsight = aiInsights.get(d.id);
      if (aiInsight) return getAIRecommendationColor(aiInsight.recommendation);
      return '#00b5d8';
    })
    .attr('stroke-width', (d: ExtendedOrbitalNode) => selectedNodeId === d.id ? 4 : 2);

  nodeUpdate.select('text')
    .transition().duration(750)
    .attr('dy', (d: ExtendedOrbitalNode) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) + 16)
    .text((d: ExtendedOrbitalNode) => {
      const aiInsight = aiInsights.get(d.id);
      if (aiInsight?.recommendation === 'strong_buy') return `${d.id} 🚀`;
      if (aiInsight?.recommendation === 'strong_sell') return `${d.id} ⚠️`;
      return d.id;
    });
};

export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  const { showTooltip, hideTooltip } = useTooltip();
  const { requestOnChainData } = useOnChainData();
  const prevTickersRef = useRef<Map<string, BinanceTickerData>>(new Map());

  // Request on-chain data for visible nodes
  useEffect(() => {
    const symbols = props.nodes.map(node => node.id);
    if (symbols.length > 0) {
      requestOnChainData(symbols);
    }
  }, [props.nodes, requestOnChainData]);

  // Update node visuals with realtime price data
  useEffect(() => {
    if (!props.svg || !props.realtimeTickers) return;
    
    const nodesGroup = props.svg.select('.nodes-group');
    if (nodesGroup.empty()) return;

    props.realtimeTickers.forEach((ticker, symbol) => {
      const prevTicker = prevTickersRef.current.get(symbol);
      const priceChanged = !prevTicker || prevTicker.price !== ticker.price;
      
      if (priceChanged) {
        // Flash effect on price change
        const nodeGroup = nodesGroup.selectAll('g.node')
          .filter((d: any) => d?.id === symbol);
        
        if (!nodeGroup.empty()) {
          const isPositive = ticker.priceChangePercent > 0;
          const flashColor = isPositive ? 'rgba(0, 255, 136, 0.8)' : 'rgba(255, 50, 50, 0.8)';
          
          nodeGroup.select('circle.node-glow')
            .transition()
            .duration(200)
            .attr('fill', flashColor)
            .attr('opacity', 1)
            .transition()
            .duration(500)
            .attr('opacity', 0.5);
        }
      }
    });
    
    prevTickersRef.current = new Map(props.realtimeTickers);
  }, [props.svg, props.realtimeTickers]);

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
        props.realtimeTickers
      );
    }
  }, [props.svg, props.nodes, props.centralNode, props.selectedNodeId, props.zoomLevel, props.aiInsights, props.smartMoneyScores, showTooltip, hideTooltip, props.activeCategory, props.links, props.realtimeTickers]);

  return null;
});