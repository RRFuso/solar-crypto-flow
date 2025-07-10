import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { getLogoUrls } from '@/lib/cryptoLogos';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { AIInsight } from '@/hooks/useAdvancedAI';
import { useTooltip } from '@/contexts/TooltipContext';
import { CapitalFlowLink } from '@/types/capitalFlow';
import { RealtimeTicker } from '@/hooks/useRealtimeTicker';

// --- Interfaces ---
interface ExtendedOrbitalNode extends OrbitalNode {
  priceActionSignal?: PriceActionSignal;
  price?: string;
  priceChange24h?: number;
  capitalFlows?: CapitalFlowLink[];
  aiModel?: AIInsight;
}

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: ExtendedOrbitalNode[];
  centralNode: ExtendedOrbitalNode | null;
  selectedNodeId: string | null;
  zoomLevel: number;
  aiInsights: Map<string, AIInsight>;
  smartMoneyScores: Map<string, { score: number; sentiment: 'Bearish' | 'Neutral' | 'Bullish' }>;
  realtimeTickers: Map<string, RealtimeTicker>;
}

// --- Constants ---
const VOLATILITY_THRESHOLD = 0.008; // Sensitivity increased to 0.8%

// --- Helper Functions ---
const getAIRecommendationColor = (recommendation: string): string => {
  switch (recommendation) {
    case 'strong_buy': return '#00FF88';
    case 'buy': return '#66FF99';
    case 'hold': return '#00B5D8';
    case 'sell': return '#FF6666';
    case 'strong_sell': return '#FF3366';
    default: return '#8A9196';
  }
};

const getNodeStrokeColor = (
  d: ExtendedOrbitalNode,
  selectedNodeId: string | null,
  aiInsights: Map<string, AIInsight>
): string => {
  if (selectedNodeId === d.id) return '#ffffff';
  if (d.priceActionSignal?.explosivePotential === 'High') return '#800080';
  const aiInsight = aiInsights.get(d.id);
  if (aiInsight) return getAIRecommendationColor(aiInsight.recommendation);
  return '#00b5d8';
};

const getOnChainGlowColor = (node: ExtendedOrbitalNode, smartMoneyScores: Map<string, any>): string => {
  const sentiment = smartMoneyScores.get(node.id)?.sentiment;
  if (sentiment === 'Bullish') return 'rgba(0, 255, 0, 0.7)';
  if (sentiment === 'Bearish') return 'rgba(255, 0, 0, 0.7)';
  const aiInsight = node.aiModel;
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
  return Math.max(isCentral ? 20 : 12, Math.min(isCentral ? 40 : 25, calculatedRadius));
};

const createTooltipData = (node: ExtendedOrbitalNode, aiInsights: Map<string, any>, realtimeTickers: Map<string, RealtimeTicker>) => {
    const realtimeData = realtimeTickers.get(`${node.id}USDT`);
    return {
        id: node.id,
        name: node.name,
        price: realtimeData ? realtimeData.price : node.price,
        priceChange24h: node.priceChange24h,
        volume: node.volume,
        capitalFlows: node.capitalFlows,
        aiModel: aiInsights.get(node.id),
        explosivePotential: node.priceActionSignal?.explosivePotential,
    };
};

// --- D3 Rendering Logic ---
const renderStructure = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: ExtendedOrbitalNode[],
  centralNode: ExtendedOrbitalNode | null,
  zoomLevel: number,
  aiInsights: Map<string, any>,
  smartMoneyScores: Map<string, any>,
  realtimeTickers: Map<string, RealtimeTicker>,
  showTooltip: (data: any, position: { x: number, y: number }) => void,
  hideTooltip: () => void,
) => {
  let defs = svg.select('defs');
  if (defs.empty()) defs = svg.append('defs');

  const glowFilter = defs.select('#glow-filter').node()
    ? defs.select('#glow-filter')
    : defs.append('filter').attr('id', 'glow-filter');
  glowFilter.html('');
  glowFilter.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur');
  
  const patterns = defs.selectAll('pattern').data(nodes, (d: any) => d.id);
  patterns.exit().remove();
  const patternEnter = patterns.enter().append('pattern')
    .attr('id', (d: any) => `logo-${d.id}`)
    .attr('width', 1).attr('height', 1)
    .attr('patternContentUnits', 'objectBoundingBox');
  patternEnter.each(function(d) {
    const pattern = d3.select(this);
    const logoUrls = getLogoUrls(d.id);
    let currentUrlIndex = 0;
    const loadImage = () => {
      if (currentUrlIndex >= logoUrls.length) return;
      const imageUrl = logoUrls[currentUrlIndex];
      pattern.select('image').remove();
      pattern.append('image').attr('href', imageUrl)
        .attr('width', 1).attr('height', 1)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('error', () => { currentUrlIndex++; loadImage(); });
    };
    loadImage();
  });

  let nodesGroup = svg.select('.nodes-group');
  if (nodesGroup.empty()) nodesGroup = svg.append('g').attr('class', 'nodes-group');

  const nodeSelection = nodesGroup.selectAll('g.node').data(nodes, (d: any) => d.id);
  nodeSelection.exit().transition().duration(500).attr('transform', (d: any) => `translate(${d.x}, ${d.y}) scale(0)`).remove();

  const nodeEnter = nodeSelection.enter().append('g')
    .attr('class', 'node').attr('transform', (d: any) => `translate(${d.x}, ${d.y}) scale(0)`)
    .style('cursor', 'pointer')
    .on('click', (event: MouseEvent, d: any) => {
      document.dispatchEvent(new CustomEvent('node-click', { detail: { nodeId: d.id } }));
    })
    .on('mouseover', (event: MouseEvent, d: any) => {
        showTooltip(createTooltipData(d, aiInsights, realtimeTickers), { x: event.clientX, y: event.clientY });
    })
    .on('mouseout', hideTooltip);

  nodeEnter.append('circle').attr('class', 'node-glow');
  nodeEnter.append('circle').attr('class', 'node-circle');
  nodeEnter.append('text').attr('text-anchor', 'middle').attr('fill', 'white')
    .attr('font-size', '12px').attr('font-weight', 'bold')
    .style('pointer-events', 'none').style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');

  const nodeUpdate = nodeEnter.merge(nodeSelection as any);
  nodeUpdate.transition().duration(750).attr('transform', (d: any) => `translate(${d.x}, ${d.y}) scale(1)`);
  
  nodeUpdate.select('circle.node-glow').transition().duration(750)
    .attr('r', (d: any) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) * 1.5)
    .attr('fill', (d: any) => getOnChainGlowColor(d, smartMoneyScores))
    .style('filter', 'url(#glow-filter)');

  nodeUpdate.select('circle.node-circle').transition().duration(750)
    .attr('r', (d: any) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id))
    .attr('fill', (d: any) => `url(#logo-${d.id})`);

  nodeUpdate.select('text').transition().duration(750)
    .attr('dy', (d: any) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) + 16)
    .text((d: any) => {
      const aiInsight = aiInsights.get(d.id);
      if (aiInsight?.recommendation === 'strong_buy') return `${d.id} 🚀`;
      if (aiInsight?.recommendation === 'strong_sell') return `${d.id} ⚠️`;
      return d.id;
    });
};

// --- React Component ---
export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  const { showTooltip, hideTooltip } = useTooltip();

  // Effect for structural rendering (runs infrequently but handles on-chain glow)
  useEffect(() => {
    if (props.svg && props.nodes) {
      renderStructure(
        props.svg, props.nodes, props.centralNode, props.zoomLevel, 
        props.aiInsights, props.smartMoneyScores, props.realtimeTickers, showTooltip, hideTooltip
      );
    }
  }, [props.svg, props.nodes, props.centralNode, props.zoomLevel, props.aiInsights, props.smartMoneyScores, showTooltip, hideTooltip]);

  // Effect for real-time style updates (runs frequently and is lightweight)
  useEffect(() => {
    if (!props.svg) return;

    props.svg.selectAll('g.node')
      .each(function(d: any) {
        const node = d as ExtendedOrbitalNode;
        const nodeCircle = d3.select(this).select('circle.node-circle');
        if (nodeCircle.empty()) return;

        const realtimeData = props.realtimeTickers.get(`${node.id}USDT`);
        let volatilityState: 'pump' | 'dump' | null = null;

        if (node.price && realtimeData) {
          const stablePrice = parseFloat(node.price);
          const realtimePrice = parseFloat(realtimeData.price);
          const change = (realtimePrice - stablePrice) / stablePrice;
          
          if (Math.abs(change) > VOLATILITY_THRESHOLD) {
            volatilityState = change > 0 ? 'pump' : 'dump';
          }
        }

        let strokeColor = getNodeStrokeColor(node, props.selectedNodeId, props.aiInsights);
        let strokeWidth = props.selectedNodeId === node.id ? 4 : 2;
        
        if (volatilityState === 'pump') {
          strokeColor = '#00FF88'; // Bright Green
          strokeWidth = 4;
        } else if (volatilityState === 'dump') {
          strokeColor = '#FF3366'; // Bright Red
          strokeWidth = 4;
        }
        
        nodeCircle
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      });
  }, [props.realtimeTickers, props.selectedNodeId, props.aiInsights, props.svg, props.nodes]);

  return null;
});