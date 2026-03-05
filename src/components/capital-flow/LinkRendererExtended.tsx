import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { stylizeLinks, createArrowheads } from './link-renderer/LinkStyling';
import { LinkData } from '@/types/capitalFlow';
import { NarrativeNode } from '@/types/narratives';
import { getCategoryColor as getSignalCategoryColor } from './constants/signalCategories';
import { SmartMoneyFlow } from '@/hooks/useSmartMoneyFlows';
import { FlowParticleConfig } from '@/types/smartMoney';

export interface LinkRendererExtendedProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: LinkData[];
  nodes: NarrativeNode[];
  selectedNodeId: string | null;
  predictions: Prediction[];
  animateWithOrbit?: boolean;
  getCategoryColor?: (category: string) => string;
  showLines: boolean;
  activeCategory?: string;
  smartMoneyFlows?: SmartMoneyFlow[];
}

const getLinkId = (link: LinkData): string => `${link.source?.id}-${link.target?.id}`;
const getLinksKey = (links: LinkData[]): string => links.map(getLinkId).sort().join('|');
const getNodesPositionKey = (nodes: NarrativeNode[]): string =>
  nodes
    .map((n) => `${n.id}:${Math.round((n.x || 0) * 10) / 10}:${Math.round((n.y || 0) * 10) / 10}`)
    .sort()
    .join('|');

const getLinkPath = (d: LinkData): string => {
  if (!d.source || !d.target) return '';
  const dx = d.target.x - d.source.x;
  const dy = d.target.y - d.source.y;
  const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
  return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
};

const getLinkOpacity = (d: LinkData, selectedNodeId: string | null, activeCategory: string): number => {
  if (activeCategory !== 'all') {
    const sourceInCategory = d.source.categories?.includes(activeCategory);
    const targetInCategory = d.target.categories?.includes(activeCategory);
    if (!sourceInCategory && !targetInCategory) {
      return 0.1;
    }
  }

  if (selectedNodeId) {
    return d.source.id === selectedNodeId || d.target.id === selectedNodeId ? 0.9 : 0.15;
  }

  return 0.8;
};

const getLinkWidth = (d: LinkData, selectedNodeId: string | null): number => {
  const baseWidth = 1.5 + Math.min(6, Math.sqrt(Math.abs(d.value || 0)) / 10);
  return selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId)
    ? baseWidth * 1.5
    : baseWidth;
};

const LinkRendererExtendedInner: React.FC<LinkRendererExtendedProps> = ({
  svg,
  links,
  nodes,
  selectedNodeId,
  predictions,
  animateWithOrbit = false,
  getCategoryColor,
  showLines,
  activeCategory = 'all',
  smartMoneyFlows
}) => {
  const previousLinksKeyRef = useRef<string>('');
  const linkElementsRef = useRef<d3.Selection<SVGPathElement, LinkData, SVGGElement, unknown> | null>(null);

  const getColorForFlow = (category: string) => {
    if (getCategoryColor) return getCategoryColor(category);

    const categoryMapping: Record<string, string> = {
      '🚀 Alta': 'explosive',
      '🏃 Fuga': 'capitulation',
      '🧱 Acum.': 'accumulation',
      '💰 Normal': 'neutral',
      '🔁 Rev.': 'reversal',
      '⚠️ Alert': 'distribution'
    };

    const signalCategory = categoryMapping[category] || 'neutral';
    return getSignalCategoryColor(signalCategory);
  };

  const processedLinks = useMemo(() => {
    if (!links?.length || !nodes?.length) return [];

    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    return links
      .map((link) => {
        const sourceNode = nodeById.get(link.source.id);
        const targetNode = nodeById.get(link.target.id);
        if (!sourceNode || !targetNode) return null;

        return {
          ...link,
          source: sourceNode,
          target: targetNode,
          markerId: `marker-${sourceNode.id}-${targetNode.id}`,
          categoryColor: link.fromCategory ? getColorForFlow(link.fromCategory) : null
        };
      })
      .filter(Boolean) as LinkData[];
  }, [links, nodes, getCategoryColor]);

  useEffect(() => {
    if (!svg || processedLinks.length === 0) return;

    const currentLinksKey = getLinksKey(processedLinks);
    const linksStructureChanged = currentLinksKey !== previousLinksKeyRef.current;

    if (linksStructureChanged || svg.select('.flow-links').empty()) {
      svg.selectAll('.flow-links').remove();
      svg.selectAll('.particles-group').remove();

      const linkGroup = svg.append('g').attr('class', 'flow-links');
      linkGroup.style('visibility', showLines ? 'visible' : 'hidden');

      const handleMouseOver = (_event: MouseEvent, _linkData: LinkData) => {};
      const handleMouseOut = () => {};

      const link = stylizeLinks(svg, linkGroup, processedLinks, selectedNodeId, handleMouseOver, handleMouseOut, activeCategory);
      createArrowheads(svg, processedLinks);
      linkElementsRef.current = link as d3.Selection<SVGPathElement, LinkData, SVGGElement, unknown>;
      previousLinksKeyRef.current = currentLinksKey;

      let particleCleanup: (() => void) | null = null;

      const getFlowConfig = (flowLink: LinkData): FlowParticleConfig => {
        if (!smartMoneyFlows || smartMoneyFlows.length === 0) {
          return {
            direction: flowLink.percentage > 0 ? 1 : -1,
            color: '#facc15',
            speed: 0.002,
            isRealData: false,
          };
        }

        const sourceSymbol = flowLink.source.id?.toUpperCase();
        const targetSymbol = flowLink.target.id?.toUpperCase();
        const sourceFlow = smartMoneyFlows.find(f => f.token_symbol === sourceSymbol);
        const targetFlow = smartMoneyFlows.find(f => f.token_symbol === targetSymbol);
        const primaryFlow = (sourceFlow?.flow_intensity || 0) > (targetFlow?.flow_intensity || 0) ? sourceFlow : targetFlow;

        if (!primaryFlow) {
          return { direction: flowLink.percentage > 0 ? 1 : -1, color: '#facc15', speed: 0.002, isRealData: false };
        }

        let direction: 1 | -1 | 0 = 0;
        let color = '#facc15';
        if (primaryFlow.dominant_direction === 'bullish') { direction = 1; color = '#22c55e'; }
        else if (primaryFlow.dominant_direction === 'bearish') { direction = -1; color = '#ef4444'; }

        const speedMultiplier = 1 + (primaryFlow.flow_intensity / 100) * 2;
        return {
          direction: direction || (flowLink.percentage > 0 ? 1 : -1),
          color,
          speed: 0.002 * speedMultiplier,
          intensity: primaryFlow.flow_intensity,
          isRealData: true,
        };
      };

      if (showLines && processedLinks.length > 0) {
        import('./link-renderer/ParticleAnimation').then(({ addFlowParticles }) => {
          particleCleanup = addFlowParticles(svg, linkGroup, processedLinks, selectedNodeId, getFlowConfig);
        });
      }

      if (animateWithOrbit) {
        import('@/utils/animationOptimizer').then(({ globalAnimator }) => {
          const updateLinks = () => {
            if (!linkElementsRef.current) return;
            linkElementsRef.current.attr('d', getLinkPath);
          };
          globalAnimator.addCallback(updateLinks);
          globalAnimator.start();
        });
      }

      return () => {
        if (particleCleanup) particleCleanup();
      };
    }

    const reboundSelection = svg
      .select('.flow-links')
      .selectAll<SVGPathElement, LinkData>('path.link-path')
      .data(processedLinks, (d) => getLinkId(d as LinkData));

    reboundSelection
      .attr('d', getLinkPath)
      .attr('opacity', (d) => getLinkOpacity(d, selectedNodeId, activeCategory))
      .attr('stroke-width', (d) => getLinkWidth(d, selectedNodeId))
      .attr('marker-end', (d) => `url(#${d.markerId})`);

    linkElementsRef.current = reboundSelection;

    svg.selectAll('.flow-links').style('visibility', showLines ? 'visible' : 'hidden');

    svg
      .select('defs')
      .selectAll<SVGLinearGradientElement, LinkData>('linearGradient')
      .data(processedLinks, (d) => getLinkId(d as LinkData))
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    svg
      .select('defs')
      .selectAll<SVGMarkerElement, LinkData>('marker')
      .data(processedLinks, (d) => getLinkId(d as LinkData))
      .attr('refX', (d) => 8 + (d.target?.radius || 20) * 0.7);
  }, [svg, processedLinks, selectedNodeId, animateWithOrbit, showLines, activeCategory, smartMoneyFlows]);

  return null;
};

export const LinkRendererExtended = React.memo(LinkRendererExtendedInner, (prev, next) => {
  if (prev.showLines !== next.showLines) return false;
  if (prev.activeCategory !== next.activeCategory) return false;
  if (prev.selectedNodeId !== next.selectedNodeId) return false;
  if (prev.links.length !== next.links.length) return false;
  if (getLinksKey(prev.links) !== getLinksKey(next.links)) return false;
  if ((prev.smartMoneyFlows?.length || 0) !== (next.smartMoneyFlows?.length || 0)) return false;
  if (getNodesPositionKey(prev.nodes) !== getNodesPositionKey(next.nodes)) return false;
  return true;
});

export default LinkRendererExtended;
