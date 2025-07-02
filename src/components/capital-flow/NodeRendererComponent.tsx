import React from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { Prediction } from '@/lib/aiModel';

interface NodeRendererComponentProps {
  nodes: OrbitalNode[];
  centralNode: OrbitalNode | null;
  svgRef: React.RefObject<SVGSVGElement>;
  zoomLevel: number;
  predictions?: Prediction[];
  aiInsights?: Map<string, any>;
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
}

export const NodeRendererComponent: React.FC<NodeRendererComponentProps> = ({
  nodes,
  centralNode,
  svgRef,
  zoomLevel,
  predictions = [],
  aiInsights = new Map(),
  onNodeClick,
  onNodeHover
}) => {
  
  React.useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    
    // Remove existing nodes
    svg.selectAll('.node-group').remove();

    // Create node groups
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    
    const nodeSelection = nodeGroup
      .selectAll('.node-group')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    // Add glow effects
    nodeSelection
      .append('circle')
      .attr('class', 'node-glow')
      .attr('r', d => {
        const baseRadius = d.type === 'central' ? 35 : 20;
        return (baseRadius + (zoomLevel - 70) * 0.3) * 1.5;
      })
      .attr('fill', d => {
        const prediction = predictions.find(p => p.symbol === d.id);
        if (prediction) {
          return prediction.bullish ? '#00ff88' : '#ff3366';
        }
        const insight = aiInsights.get(d.id);
        if (insight) {
          return insight.sentiment > 0.6 ? '#10b981' : '#ef4444';
        }
        return d.type === 'central' ? '#f59e0b' : '#8b5cf6';
      })
      .attr('opacity', 0.3)
      .attr('filter', 'blur(8px)');

    // Add main node circles
    nodeSelection
      .append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => {
        const baseRadius = d.type === 'central' ? 35 : 20;
        return baseRadius + (zoomLevel - 70) * 0.3;
      })
      .attr('fill', d => {
        const prediction = predictions.find(p => p.symbol === d.id);
        if (prediction) {
          return prediction.bullish ? '#00ff88' : '#ff3366';
        }
        const insight = aiInsights.get(d.id);
        if (insight) {
          return insight.sentiment > 0.6 ? '#10b981' : '#ef4444';
        }
        return d.type === 'central' ? '#f59e0b' : '#8b5cf6';
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', d => d.type === 'central' ? 3 : 2)
      .style('cursor', 'pointer');

    // Add node labels
    nodeSelection
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.type === 'central' ? '0.3em' : `${20 + (zoomLevel - 70) * 0.3 + 18}px`)
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', d => d.type === 'central' ? '16px' : '12px')
      .text(d => d.id);

    // Add prediction indicators for orbital nodes
    nodeSelection
      .filter(d => d.type === 'orbital')
      .append('text')
      .attr('class', 'prediction-label')
      .attr('text-anchor', 'middle')
      .attr('dy', d => `${20 + (zoomLevel - 70) * 0.3 + 32}px`)
      .attr('fill', d => {
        const prediction = predictions.find(p => p.symbol === d.id);
        if (prediction) {
          return prediction.bullish ? '#10b981' : '#ef4444';
        }
        return '#6b7280';
      })
      .attr('font-size', '10px')
      .text(d => {
        const prediction = predictions.find(p => p.symbol === d.id);
        if (prediction) {
          return `${prediction.bullish ? '↗' : '↘'} ${(prediction.confidence * 100).toFixed(0)}%`;
        }
        return '';
      });

    // Add interactivity
    nodeSelection
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d.id);
      })
      .on('mouseenter', (event, d) => {
        onNodeHover?.(d.id);
        
        // Highlight effect
        d3.select(event.currentTarget)
          .select('.node-circle')
          .transition()
          .duration(200)
          .attr('r', () => {
            const baseRadius = d.type === 'central' ? 35 : 20;
            return (baseRadius + (zoomLevel - 70) * 0.3) * 1.1;
          });
      })
      .on('mouseleave', (event, d) => {
        onNodeHover?.(null);
        
        // Reset highlight
        d3.select(event.currentTarget)
          .select('.node-circle')
          .transition()
          .duration(200)
          .attr('r', () => {
            const baseRadius = d.type === 'central' ? 35 : 20;
            return baseRadius + (zoomLevel - 70) * 0.3;
          });
      });

    // Add pulsing animation for central node
    if (centralNode) {
      const centralSelection = nodeSelection.filter(d => d.type === 'central');
      
      centralSelection
        .append('circle')
        .attr('class', 'central-pulse')
        .attr('r', 35 + (zoomLevel - 70) * 0.3)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2)
        .attr('opacity', 0.5)
        .append('animateTransform')
        .attr('attributeName', 'transform')
        .attr('type', 'scale')
        .attr('values', '1;1.2;1')
        .attr('dur', '4s')
        .attr('repeatCount', 'indefinite');
    }

    return () => {
      svg.selectAll('.node-group').remove();
    };
  }, [nodes, centralNode, svgRef, zoomLevel, predictions, aiInsights, onNodeClick, onNodeHover]);

  return null;
};

export default NodeRendererComponent;