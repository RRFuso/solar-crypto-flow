
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { stylizeLinks, createArrowheads } from './link-renderer/LinkStyling';
import { LinkData } from '@/types/capitalFlow';
import { NarrativeNode } from '@/types/narratives';
import { getCategoryColor as getSignalCategoryColor } from './constants/signalCategories';

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
}

export const LinkRendererExtended: React.FC<LinkRendererExtendedProps> = ({
  svg,
  links,
  nodes,
  selectedNodeId,
  predictions,
  animateWithOrbit = false,
  getCategoryColor,
  showLines,
  activeCategory = 'all'
}) => {
  const getColorForFlow = (category: string) => {
    if (getCategoryColor) {
      return getCategoryColor(category);
    }
    
    // Mapear categorias antigas para novas
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

  useEffect(() => {
    if (!svg || !links || links.length === 0 || !nodes || nodes.length === 0) return;

    svg.selectAll(".flow-links").remove();
    svg.selectAll(".particles-group").remove();

    const linkGroup = svg.append("g").attr("class", "flow-links");

    // Set visibility based on showLines prop
    linkGroup.style("visibility", showLines ? "visible" : "hidden");

    // Ensure links have valid source and target nodes with current positions
    const processedLinks = links.map(link => {
      const sourceNode = nodes.find(n => n.id === link.source.id);
      const targetNode = nodes.find(n => n.id === link.target.id);
      
      if (!sourceNode || !targetNode) {
        console.warn('Link missing valid source or target node:', link);
        return null;
      }

      return {
        ...link,
        source: sourceNode,
        target: targetNode,
        markerId: `marker-${sourceNode.id}-${targetNode.id}`,
        categoryColor: link.fromCategory ? getColorForFlow(link.fromCategory) : null
      };
    }).filter(Boolean) as LinkData[];

    const handleMouseOver = (event: MouseEvent, linkData: LinkData) => {
      // Placeholder for future implementation
    };

    const handleMouseOut = () => {
      // Placeholder for future implementation
    };

    const link = stylizeLinks(svg, linkGroup, processedLinks, selectedNodeId, handleMouseOver, handleMouseOut, activeCategory);
    createArrowheads(svg, processedLinks);

    // === OPTIMIZED PARTICLE SYSTEM ===
    let particleCleanup: (() => void) | null = null;
    
    // Only create particles if showing lines
    if (showLines && processedLinks.length > 0) {
      import('./link-renderer/ParticleAnimation').then(({ addFlowParticles }) => {
        particleCleanup = addFlowParticles(svg, linkGroup, processedLinks, selectedNodeId);
      });
    }

    let animationFrameId: number | null = null;

    if (animateWithOrbit) {
      import('@/utils/animationOptimizer').then(({ globalAnimator }) => {
        const updateLinks = (deltaTime: number) => {
          // Update line paths using current node positions with smooth interpolation
          link.attr("d", (d: LinkData) => {
            if (!d.source || !d.target || 
                typeof d.source.x !== 'number' || typeof d.source.y !== 'number' ||
                typeof d.target.x !== 'number' || typeof d.target.y !== 'number') {
              return "";
            }

            // Use smooth curves instead of straight lines for better visual appeal
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 0.8; // Reduced curve for smoother motion
            
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
          });
        };

        globalAnimator.addCallback(updateLinks);
        globalAnimator.start();
        
        // Store cleanup for later
        animationFrameId = 1; // Flag to indicate we're using global animator
      });
    }

    return () => {
      // Cleanup optimized animation
      if (animationFrameId && animationFrameId !== 1) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Cleanup particle animation
      if (particleCleanup) {
        particleCleanup();
      }
      
      // Import and cleanup global animator
      import('@/utils/animationOptimizer').then(({ globalAnimator }) => {
        // We can't easily remove specific callbacks without reference, 
        // but the global animator will handle cleanup when components unmount
      });
      
      svg.selectAll(".flow-links").remove();
      svg.selectAll(".particles-group").remove();
    };
  }, [svg, links, nodes, selectedNodeId, animateWithOrbit, getCategoryColor, showLines, activeCategory]);

  return null;
};

export default LinkRendererExtended;
