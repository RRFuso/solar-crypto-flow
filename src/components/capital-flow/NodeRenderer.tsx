import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
  centralNode: any;
  selectedNodeId: string | null;
  zoomLevel: number;
  predictions?: Prediction[];
}

export const NodeRendererComponent: React.FC<NodeRendererProps> = ({
  svg,
  nodes,
  centralNode,
  selectedNodeId,
  zoomLevel,
  predictions = []
}) => {
  useEffect(() => {
    if (!svg || !nodes || nodes.length === 0) return;

    svg.selectAll('.node').remove();

    const predictionMap = new Map(predictions.map(p => [p.symbol, p]));

    const group = svg.append('g').attr('class', 'nodes');

    group.selectAll('.node')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => {
        const prediction = predictionMap.get(d.id);
        const base = 6 + zoomLevel * 0.05;
        if (prediction && prediction.confidence) {
          return base + prediction.confidence * 8; // confidence impacta raio
        }
        return base;
      })
      .attr('fill', d => {
        const prediction = predictionMap.get(d.id);
        if (prediction) {
          const alpha = Math.min(0.9, 0.5 + prediction.confidence * 0.4);
          return prediction.bullish
            ? `rgba(0, 255, 128, ${alpha})`
            : `rgba(255, 50, 50, ${alpha})`;
        }
        return 'rgba(120, 120, 120, 0.4)'; // neutro
      })
      .attr('stroke', d => (d.id === selectedNodeId ? '#00c8ff' : 'transparent'))
      .attr('stroke-width', d => (d.id === selectedNodeId ? 2 : 0))
      .on('mouseover', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', function (d: any) {
            const prediction = predictionMap.get(d.id);
            return prediction ? 12 + prediction.confidence * 10 : 12;
          });
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', function (d: any) {
            const prediction = predictionMap.get(d.id);
            const base = 6 + zoomLevel * 0.05;
            return prediction ? base + prediction.confidence * 8 : base;
          });
      });

    return () => {
      svg.selectAll('.node').remove();
    };
  }, [svg, nodes, predictions, selectedNodeId, zoomLevel]);

  return null;
};
