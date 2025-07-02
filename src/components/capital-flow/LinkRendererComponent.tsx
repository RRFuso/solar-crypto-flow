import React from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { FlowData } from '@/types/crypto';

interface LinkData {
  source: OrbitalNode | null;
  target: OrbitalNode;
  value: number;
  percentage: number;
  prediction?: any;
  isSelected: boolean;
}

interface LinkRendererComponentProps {
  nodes: OrbitalNode[];
  centralNode: OrbitalNode | null;
  flowData: FlowData[];
  svgRef: React.RefObject<SVGSVGElement>;
  showLines: boolean;
  selectedNodeId?: string | null;
  predictions?: any[];
}

export const LinkRendererComponent: React.FC<LinkRendererComponentProps> = ({
  nodes,
  centralNode,
  flowData,
  svgRef,
  showLines,
  selectedNodeId,
  predictions = []
}) => {

  React.useEffect(() => {
    if (!svgRef.current || !showLines || nodes.length === 0) {
      // Remove links if showLines is false
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll('.links-group').remove();
      }
      return;
    }

    const svg = d3.select(svgRef.current);
    
    // Remove existing links
    svg.selectAll('.links-group').remove();

    // Create links group
    const linksGroup = svg.append('g').attr('class', 'links-group');

    // Create defs for gradients and markers
    let defs = svg.select('defs');
    if (defs.empty()) {
      defs = svg.append('defs');
    }

    // Create links data
    const links = nodes
      .filter(node => node.type === 'orbital')
      .map(orbitalNode => {
        const flowInfo = flowData.find(flow => 
          flow.to === orbitalNode.id || flow.from === orbitalNode.id
        );
        
        const prediction = predictions.find(p => p.symbol === orbitalNode.id);
        
        const isSelected = selectedNodeId && (
          selectedNodeId === centralNode?.id || 
          selectedNodeId === orbitalNode.id
        );
        
        return {
          source: centralNode,
          target: orbitalNode,
          value: flowInfo?.value || 0,
          percentage: flowInfo?.percentage || 0,
          prediction,
          isSelected
        };
      })
      .filter(link => link.source && link.target);

    // Create gradients for each link
    links.forEach((link, i) => {
      const gradientId = `link-gradient-${i}`;
      
      let startColor = '#8b5cf6';
      let endColor = '#10b981';
      
      if (link.prediction) {
        startColor = link.prediction.bullish ? '#00ff88' : '#ff3366';
        endColor = link.prediction.bullish ? '#10b981' : '#ef4444';
      } else if (link.value !== 0) {
        startColor = link.value > 0 ? '#10b981' : '#ef4444';
        endColor = link.value > 0 ? '#00ff88' : '#ff6b6b';
      }

      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', link.source!.x)
        .attr('y1', link.source!.y)
        .attr('x2', link.target.x)
        .attr('y2', link.target.y);

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', startColor)
        .attr('stop-opacity', 0.8);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', endColor)
        .attr('stop-opacity', 0.6);
    });

    // Create arrow markers
    links.forEach((link, i) => {
      const markerId = `arrow-${i}`;
      
      let arrowColor = '#8b5cf6';
      if (link.prediction) {
        arrowColor = link.prediction.bullish ? '#00ff88' : '#ff3366';
      } else if (link.value !== 0) {
        arrowColor = link.value > 0 ? '#10b981' : '#ef4444';
      }

      defs.append('marker')
        .attr('id', markerId)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('fill', arrowColor)
        .attr('d', 'M0,-5L10,0L0,5');
    });

    // Create link paths
    const linkSelection = linksGroup
      .selectAll('.link-path')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link-path')
      .attr('d', (d: LinkData) => {
        if (!d.source || !d.target) return '';
        
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
        
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      })
      .attr('stroke', (d, i) => `url(#link-gradient-${i})`)
      .attr('stroke-width', (d: LinkData) => {
        let baseWidth = 2;
        
        if (d.prediction) {
          baseWidth = 2 + d.prediction.confidence * 4;
        } else if (Math.abs(d.value) > 0) {
          baseWidth = 2 + Math.min(4, Math.abs(d.value) / 10);
        }
        
        return d.isSelected ? baseWidth * 1.5 : baseWidth;
      })
      .attr('fill', 'none')
      .attr('opacity', (d: LinkData) => {
        if (selectedNodeId) {
          return d.isSelected ? 0.9 : 0.2;
        }
        return 0.7;
      })
      .attr('stroke-dasharray', '5,5')
      .attr('marker-end', (d, i) => `url(#arrow-${i})`)
      .style('cursor', 'pointer');

    // Add flow animation
    linkSelection.each(function(d, i) {
      const path = d3.select(this);
      
      // Add animated dash effect
      path
        .style('animation', `flowDash 3s linear infinite`)
        .style('animation-delay', `${i * 0.5}s`);
    });

    // Add particle animation for selected links
    if (selectedNodeId) {
      const selectedLinks = links.filter(link => link.isSelected);
      
      selectedLinks.forEach((link, linkIndex) => {
        for (let i = 0; i < 3; i++) {
          const particle = linksGroup
            .append('circle')
            .attr('class', 'flow-particle')
            .attr('r', 3)
            .attr('fill', link.prediction ? 
              (link.prediction.bullish ? '#00ff88' : '#ff3366') : '#8b5cf6'
            )
            .attr('opacity', 0.8);

          // Animate particle along path
          const animateParticle = () => {
            if (!link.source || !link.target) return;
            
            particle
              .attr('cx', link.source.x)
              .attr('cy', link.source.y)
              .transition()
              .duration(2000)
              .delay(i * 300)
              .attr('cx', link.target.x)
              .attr('cy', link.target.y)
              .on('end', animateParticle);
          };
          
          animateParticle();
        }
      });
    }

    // Add interactivity
    linkSelection
      .on('mouseenter', function(event, d: LinkData) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', () => {
            let baseWidth = 2;
            if (d.prediction) {
              baseWidth = 2 + d.prediction.confidence * 4;
            } else if (Math.abs(d.value) > 0) {
              baseWidth = 2 + Math.min(4, Math.abs(d.value) / 10);
            }
            return baseWidth * 1.5;
          })
          .attr('opacity', 1);
      })
      .on('mouseleave', function(event, d: LinkData) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', () => {
            let baseWidth = 2;
            if (d.prediction) {
              baseWidth = 2 + d.prediction.confidence * 4;
            } else if (Math.abs(d.value) > 0) {
              baseWidth = 2 + Math.min(4, Math.abs(d.value) / 10);
            }
            return d.isSelected ? baseWidth * 1.5 : baseWidth;
          })
          .attr('opacity', (d: LinkData) => {
            if (selectedNodeId) {
              return d.isSelected ? 0.9 : 0.2;
            }
            return 0.7;
          });
      });

    return () => {
      svg.selectAll('.links-group').remove();
      svg.selectAll('.flow-particle').remove();
    };
  }, [nodes, centralNode, flowData, svgRef, showLines, selectedNodeId, predictions]);

  return null;
};

export default LinkRendererComponent;