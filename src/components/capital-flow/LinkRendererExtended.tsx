
import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { stylizeLinks, createArrowheads } from './link-renderer/LinkStyling';
import { addFlowParticles } from './link-renderer/ParticleAnimation';
import { globalAnimator } from '@/utils/animationOptimizer';
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
  showParticles?: boolean;
}

// Stable key for link list to detect structural changes
const getLinksKey = (links: LinkData[]): string => {
  return links.map(l => `${l.source?.id}-${l.target?.id}`).sort().join('|');
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
  smartMoneyFlows,
  showParticles = true,
}) => {
  const svgElement = svg?.node();
  const linkElementsRef = useRef<d3.Selection<any, any, any, any> | null>(null);
  const particleCleanupRef = useRef<(() => void) | null>(null);
  const smartMoneyFlowsRef = useRef<SmartMoneyFlow[] | undefined>(smartMoneyFlows);

  useEffect(() => {
    smartMoneyFlowsRef.current = smartMoneyFlows;
  }, [smartMoneyFlows]);

  const getColorForFlow = (category: string) => {
    if (getCategoryColor) {
      return getCategoryColor(category);
    }
    const categoryMapping: Record<string, string> = {
      "🚀 Alta": "explosive",
      "🏃 Fuga": "capitulation", 
      "🧱 Acum.": "accumulation",
      "💰 Normal": "neutral",
      "🔁 Rev.": "reversal",
      "⚠️ Alert": "distribution"
    };
    const signalCategory = categoryMapping[category] || 'neutral';
    return getSignalCategoryColor(signalCategory);
  };

  // Memoize processed links to avoid recalculating on every render
  const processedLinks = useMemo(() => {
    if (!links || links.length === 0 || !nodes || nodes.length === 0) return [];
    
    return links.map(link => {
      const sourceNode = nodes.find(n => n.id === link.source.id);
      const targetNode = nodes.find(n => n.id === link.target.id);
      
      if (!sourceNode || !targetNode) return null;

      return {
        ...link,
        source: sourceNode,
        target: targetNode,
        markerId: `marker-${sourceNode.id}-${targetNode.id}`,
        categoryColor: link.fromCategory ? getColorForFlow(link.fromCategory) : null
      };
    }).filter(Boolean) as LinkData[];
  }, [links, nodes, getCategoryColor]);

  const processedLinksKey = useMemo(() => getLinksKey(processedLinks), [processedLinks]);

  useEffect(() => {
    if (!svgElement || processedLinks.length === 0) return;

    const stableSvg = d3.select(svgElement);

    stableSvg.selectAll(".flow-links").remove();
    stableSvg.selectAll(".particles-group").remove();
    particleCleanupRef.current?.();
    particleCleanupRef.current = null;

    const linkGroup = stableSvg.select(".nodes-group").empty()
      ? stableSvg.append("g").attr("class", "flow-links")
      : stableSvg.insert("g", ".nodes-group").attr("class", "flow-links");
    linkGroup.style("visibility", showLines ? "visible" : "hidden");

    const handleMouseOver = (event: MouseEvent, linkData: LinkData) => {};
    const handleMouseOut = () => {};

    const link = stylizeLinks(stableSvg, linkGroup, processedLinks, selectedNodeId, handleMouseOver, handleMouseOut, activeCategory);
    createArrowheads(stableSvg, processedLinks);
    linkElementsRef.current = link;

    const getFlowConfig = (link: LinkData): FlowParticleConfig => {
        const currentSmartMoneyFlows = smartMoneyFlowsRef.current;
        if (!currentSmartMoneyFlows || currentSmartMoneyFlows.length === 0) {
          return {
            direction: link.percentage > 0 ? 1 : -1,
            color: '#facc15',
            speed: 0.002,
            isRealData: false,
          };
        }
        const sourceSymbol = link.source.id?.toUpperCase();
        const targetSymbol = link.target.id?.toUpperCase();
        const sourceFlow = currentSmartMoneyFlows.find(f => f.token_symbol === sourceSymbol);
        const targetFlow = currentSmartMoneyFlows.find(f => f.token_symbol === targetSymbol);
        const primaryFlow = (sourceFlow?.flow_intensity || 0) > (targetFlow?.flow_intensity || 0) ? sourceFlow : targetFlow;

        if (!primaryFlow) {
          return { direction: link.percentage > 0 ? 1 : -1, color: '#facc15', speed: 0.002, isRealData: false };
        }

        let direction: 1 | -1 | 0 = 0;
        let color = '#facc15';
        if (primaryFlow.dominant_direction === 'bullish') { direction = 1; color = '#22c55e'; }
        else if (primaryFlow.dominant_direction === 'bearish') { direction = -1; color = '#ef4444'; }

        const speedMultiplier = 1 + (primaryFlow.flow_intensity / 100) * 2;
        return {
          direction: direction || (link.percentage > 0 ? 1 : -1),
          color,
          speed: 0.002 * speedMultiplier,
          intensity: primaryFlow.flow_intensity,
          isRealData: true,
        };
      };

    if (showLines && showParticles && processedLinks.length > 0) {
      particleCleanupRef.current = addFlowParticles(stableSvg, linkGroup, processedLinks, selectedNodeId, getFlowConfig);
    }

    return () => {
      particleCleanupRef.current?.();
      particleCleanupRef.current = null;
      stableSvg.selectAll(".flow-links").remove();
      stableSvg.selectAll(".particles-group").remove();
      linkElementsRef.current = null;
    };
  }, [svgElement, processedLinksKey, selectedNodeId, showLines, activeCategory]);

  useEffect(() => {
    if (!animateWithOrbit) return;

    const updateLinks = () => {
      if (!linkElementsRef.current) return;
      linkElementsRef.current.attr("d", (d: LinkData) => {
        if (!d.source || !d.target || 
            typeof d.source.x !== 'number' || typeof d.source.y !== 'number' ||
            typeof d.target.x !== 'number' || typeof d.target.y !== 'number') {
          return "";
        }
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });
    };

    globalAnimator.addCallback(updateLinks);
    globalAnimator.start();
    return () => globalAnimator.removeCallback(updateLinks);
  }, [animateWithOrbit]);

  return null;
};

// Strict memo: only re-render when filters or link structure change
export const LinkRendererExtended = React.memo(LinkRendererExtendedInner, (prev, next) => {
  // Re-render only if these change
  if (prev.showLines !== next.showLines) return false;
  if (prev.showParticles !== next.showParticles) return false;
  if (prev.activeCategory !== next.activeCategory) return false;
  if (prev.selectedNodeId !== next.selectedNodeId) return false;
  if (prev.links.length !== next.links.length) return false;
  if (prev.nodes.length !== next.nodes.length) return false;
  return true;
});

export default LinkRendererExtended;
