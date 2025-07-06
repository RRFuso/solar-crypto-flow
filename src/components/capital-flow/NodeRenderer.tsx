import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { getLogoUrls } from '@/lib/cryptoLogos';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';
import { useTooltip } from '@/contexts/TooltipContext';

// Interfaces and helper functions remain the same
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
  const signal = node.priceActionSignal;
  if (signal?.explosivePotential === 'High') return 'rgba(255, 223, 0, 0.9)';
  
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

const createTooltipData = (node: ExtendedOrbitalNode, aiInsights: Map<string, any>) => {
    const aiInsight = aiInsights.get(node.id);
    return {
        id: node.id,
        name: node.name,
        price: node.price,
        priceChange24h: node.priceChange24h,
        aiAnalysis: aiInsight ? {
            recommendation: aiInsight.recommendation,
            confidence: aiInsight.confidence,
        } : undefined,
        explosivePotential: node.priceActionSignal?.explosivePotential,
        keyFactors: aiInsight?.predictions[0]?.keyFactors,
    };
};


/**
 * This is the core refactored function that implements the D3 Enter-Update-Exit pattern.
 * It handles drawing and updating the visualization without destroying it on every render.
 */
const renderOrUpdateVisualization = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: ExtendedOrbitalNode[],
  centralNode: ExtendedOrbitalNode | null,
  selectedNodeId: string | null,
  zoomLevel: number,
  aiInsights: Map<string, any>,
  showTooltip: (data: any, position: { x: number, y: number }) => void,
  hideTooltip: () => void,
) => {
  // Ensure a 'defs' element exists for patterns
  let defs = svg.select('defs');
  if (defs.empty()) {
    defs = svg.append('defs');
  }

  // Update patterns: Add for new nodes, remove for old ones
  const patterns = defs.selectAll('pattern')
    .data(nodes, (d: any) => d.id);

  patterns.exit().remove();

  const patternEnter = patterns.enter().append('pattern')
    .attr('id', (d: any) => `logo-${d.id}`)
    .attr('width', 1)
    .attr('height', 1)
    .attr('patternContentUnits', 'objectBoundingBox');

  patternEnter.each(function(d) {
    const pattern = d3.select(this);
    const logoUrls = getLogoUrls(d.id);
    let currentUrlIndex = 0;
    const loadImage = () => {
      if (currentUrlIndex >= logoUrls.length) return;
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
    };
    loadImage();
  });

  // Ensure a group for nodes exists
  let nodesGroup = svg.select('.nodes-group');
  if (nodesGroup.empty()) {
    nodesGroup = svg.append('g').attr('class', 'nodes-group');
  }

  // DATA JOIN: The core of the pattern
  const nodeSelection = nodesGroup.selectAll('g.node')
    .data(nodes, (d: any) => d.id);

  // --- EXIT: Remove old elements that are no longer in the data ---
  nodeSelection.exit()
    .transition().duration(500)
    .attr('transform', (d: any) => `translate(${d.x}, ${d.y}) scale(0)`)
    .remove();

  // --- ENTER: Create new elements for new data points ---
  const nodeEnter = nodeSelection.enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d: any) => `translate(${d.x}, ${d.y}) scale(0)`) // Start scaled down
    .style('cursor', 'pointer')
    .on('click', (event: MouseEvent, d: any) => {
      const clickEvent = new CustomEvent('node-click', { detail: { nodeId: d.id } });
      document.dispatchEvent(clickEvent);
    })
    .on('mouseover', (event: MouseEvent, d: any) => {
        const tooltipData = createTooltipData(d, aiInsights);
        showTooltip(tooltipData, { x: event.clientX, y: event.clientY });
    })
    .on('mouseout', () => {
        hideTooltip();
    });

  // Add glow effect for new nodes
  nodeEnter.append('circle')
    .attr('class', 'node-glow')
    .attr('r', 0); // Start with 0 radius

  // Add the main circle for new nodes
  nodeEnter.append('circle')
    .attr('class', 'node-circle')
    .attr('r', 0); // Start with 0 radius

  // Add label for new nodes
  nodeEnter.append('text')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .style('pointer-events', 'none')
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');

  // --- UPDATE: Update existing elements and new elements ---
  const nodeUpdate = nodeEnter.merge(nodeSelection as any);

  // Animate transition to new position and scale
  nodeUpdate.transition().duration(750)
    .attr('transform', (d: any) => `translate(${d.x}, ${d.y}) scale(1)`);

  // Update the glow
  nodeUpdate.select('circle.node-glow')
    .transition().duration(750)
    .attr('r', (d: any) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) * 1.5)
    .attr('fill', (d: any) => getAIGlowColor(d, aiInsights))
    .attr('filter', 'blur(8px)')
    .attr('opacity', (d: any) => aiInsights.get(d.id)?.opportunityScore > 75 ? 0.8 : 0.5);

  // Comet trail for high potential nodes
  nodeUpdate.each(function(d: any) {
    const nodeGroup = d3.select(this);
    if (d.priceActionSignal?.explosivePotential === 'High') {
      // Remove any existing trail
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
      // Remove trail if it exists and potential is no longer high
      nodeGroup.selectAll('.comet-trail').remove();
    }
  });

  // Update the main circle
  nodeUpdate.select('circle.node-circle')
    .transition().duration(750)
    .attr('r', (d: any) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id))
    .attr('fill', (d: any) => `url(#logo-${d.id})`)
    .attr('stroke', (d: any) => {
      if (selectedNodeId === d.id) return '#ffffff';
      const aiInsight = aiInsights.get(d.id);
      if (aiInsight) return getAIRecommendationColor(aiInsight.recommendation);
      if (d.priceActionSignal?.explosivePotential === 'High') return '#FFD700';
      return '#00b5d8';
    })
    .attr('stroke-width', (d: any) => selectedNodeId === d.id ? 4 : 2);

  // Update the text label
  nodeUpdate.select('text')
    .transition().duration(750)
    .attr('dy', (d: any) => calculateNodeRadius(d, zoomLevel, d.id === centralNode?.id) + 16)
    .text((d: any) => {
      const aiInsight = aiInsights.get(d.id);
      if (aiInsight?.recommendation === 'strong_buy') return `${d.id} 🚀`;
      if (aiInsight?.recommendation === 'strong_sell') return `${d.id} ⚠️`;
      return d.id;
    });
};


export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  const { insights: aiInsights } = useAdvancedAI();
  const { showTooltip, hideTooltip } = useTooltip();

  useEffect(() => {
    if (props.svg && props.nodes) {
      // Call the new rendering function which handles updates gracefully.
      renderOrUpdateVisualization(
        props.svg,
        props.nodes,
        props.centralNode,
        props.selectedNodeId,
        props.zoomLevel,
        aiInsights,
        showTooltip,
        hideTooltip
      );
    }
    // The cleanup function is no longer needed because D3's exit selection handles node removal.
  }, [props.svg, props.nodes, props.centralNode, props.selectedNodeId, props.zoomLevel, aiInsights, showTooltip, hideTooltip]);

  return null; // This component only handles D3 rendering, not direct React DOM.
});