
import React, { useEffect, useRef } from 'react'; // Added useRef
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { stylizeLinks, createArrowheads } from './link-renderer/LinkStyling';
import { createLinkTooltip, removeLinkTooltip } from './link-renderer/LinkTooltip';

export interface LinkRendererExtendedProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: any[]; // Should contain references to source and target nodes with updated x, y
  nodes: any[]; // Pass nodes to access their latest positions
  selectedNodeId: string | null;
  predictions: Prediction[];
  animateWithOrbit?: boolean;
  getCategoryColor?: (category: string) => string;
}

export const LinkRendererExtended: React.FC<LinkRendererExtendedProps> = ({
  svg,
  links,
  nodes, // Receive nodes
  selectedNodeId,
  predictions,
  animateWithOrbit = false,
  getCategoryColor
}) => {
  const getColorForFlow = (category: string) => {
    if (getCategoryColor) {
      return getCategoryColor(category);
    }
    switch (category) {
      case "🚀 Alta": return "#00FF88";
      case "🏃 Fuga": return "#FF3366";
      case "🧱 Acum.": return "#FFCC00";
      case "🔁 Rev.": return "#00CCFF";
      case "⚠️ Alert": return "#FF9900";
      default: return "#8A9196";
    }
  };

  // Use a ref to store the animation frame request ID
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!svg || !links || links.length === 0 || !nodes || nodes.length === 0) return;

    // Create a map for quick node lookup by ID
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    svg.selectAll(".flow-links").remove();
    svg.selectAll(".particles-group").remove();

    const linkGroup = svg.append("g").attr("class", "flow-links");

    // Ensure links reference the nodes from the map to get latest positions
    const processedLinks = links.map(link => {
      const sourceNode = nodeMap.get(link.source.id);
      const targetNode = nodeMap.get(link.target.id);
      if (!sourceNode || !targetNode) return null; // Skip if nodes not found
      return {
        ...link,
        source: sourceNode, // Use node from map
        target: targetNode, // Use node from map
        markerId: `marker-${link.source.id}-${link.target.id}`,
        categoryColor: link.data?.category ? getColorForFlow(link.data.category) : null
      };
    }).filter(link => link !== null); // Filter out null links

    if (processedLinks.length === 0) return; // Exit if no valid links

    const handleMouseOver = (event: MouseEvent, linkData: any) => {
      createLinkTooltip(svg, event, linkData);
    };

    const handleMouseOut = () => {
      removeLinkTooltip(svg);
    };

    const linkSelection = stylizeLinks(svg, linkGroup, processedLinks, selectedNodeId, handleMouseOver, handleMouseOut);
    createArrowheads(svg, processedLinks);

    // === PARTICLE ANIMATION SETUP (DYNAMIC) ===
    const particlesGroup = linkGroup.append("g").attr("class", "particles-group");
    const particles: {
      circle: d3.Selection<SVGCircleElement, unknown, null, undefined>;
      linkData: any; // Store the link data
      path: d3.Selection<SVGPathElement, unknown, null, undefined>;
    }[] = [];

    processedLinks.forEach(linkData => {
      const path = particlesGroup.append("path")
        .attr("fill", "none")
        .attr("stroke", "none");

      const circle = particlesGroup.append("circle")
        .attr("r", 3)
        .attr("opacity", 0.9);

      particles.push({ circle, linkData, path });
    });

    const updateLinksAndParticles = () => {
      // Update line paths using current node positions
      linkSelection.attr("d", (d: any) => {
        // Ensure source and target have valid coordinates
        if (typeof d.source.x !== 'number' || typeof d.source.y !== 'number' || 
            typeof d.target.x !== 'number' || typeof d.target.y !== 'number') {
          return null; // Don't draw if coordinates are invalid
        }
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        // Use straight lines temporarily for debugging connection issues
        // const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        // return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`; // Straight line
      });

      // Update particles with new positions
      particles.forEach(({ circle, linkData, path }) => {
        // Ensure source and target have valid coordinates
        if (typeof linkData.source.x !== 'number' || typeof linkData.source.y !== 'number' || 
            typeof linkData.target.x !== 'number' || typeof linkData.target.y !== 'number') {
          circle.attr('opacity', 0); // Hide particle if coordinates invalid
          return;
        }
        circle.attr('opacity', 0.9); // Show particle if coordinates valid
        
        // Use straight line path for particles as well
        const pathD = `M${linkData.source.x},${linkData.source.y}L${linkData.target.x},${linkData.target.y}`;
        path.attr("d", pathD);

        const totalLength = path.node()?.getTotalLength() || 0;
        if (totalLength === 0) return; // Skip if path has no length

        const t = ((Date.now() % 4000) / 4000); // 4s loop
        const point = path.node()?.getPointAtLength(t * totalLength);

        if (point) {
          circle.attr("transform", `translate(${point.x},${point.y})`);
          const r = Math.round(255 * (1 - t));
          const g = Math.round(255 * t);
          circle.attr("fill", `rgb(${r},${g},0)`); // red → green
        }
      });

      // Request next frame only if animation is enabled
      if (animateWithOrbit) {
        animationFrameRef.current = requestAnimationFrame(updateLinksAndParticles);
      }
    };

    // Start the animation loop
    updateLinksAndParticles();

    // Cleanup function
    return () => {
      // Cancel the animation frame request on cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      svg.selectAll(".flow-links").remove();
      svg.selectAll(".particles-group").remove();
    };
  // Add 'nodes' to dependency array to re-run effect when node positions change
  }, [svg, links, nodes, selectedNodeId, animateWithOrbit, getCategoryColor]); 

  return null;
};

export default LinkRendererExtended;

