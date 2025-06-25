
import React, { useEffect } from 'react';
import { OrbitalNode } from './NodePlacement';
import { Prediction } from '@/lib/aiModel';

interface Props {
  svg: SVGSVGElement;
  nodes: OrbitalNode[];
  predictions: Prediction[];
  zoomLevel: number;
}

export const PredictionOrbitalOverlay: React.FC<Props> = ({
  svg,
  nodes,
  predictions,
  zoomLevel,
}) => {
  useEffect(() => {
    if (!svg || !nodes || !predictions.length) return;

    // Remove previous overlays
    const existingOverlays = svg.querySelectorAll('.prediction-pulse-group');
    existingOverlays.forEach(el => el.remove());

    // Map predictions
    const predictionMap = new Map(predictions.map(p => [p.symbol.toUpperCase(), p]));

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute('class', 'prediction-pulse-group');
    svg.appendChild(group);

    nodes.forEach(node => {
      const prediction = predictionMap.get(node.id.toUpperCase());
      if (!prediction) return;

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute('class', 'prediction-pulse');
      circle.setAttribute('cx', (node.x || 0).toString());
      circle.setAttribute('cy', (node.y || 0).toString());
      circle.setAttribute('r', (node.radius * 1.6 * (zoomLevel / 100)).toString());
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', prediction.bullish ? '#00ffcc' : '#ff0066');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('stroke-opacity', '0.7');
      circle.style.pointerEvents = 'none';

      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        .prediction-pulse {
          animation: flow-pulse 2s ease-in-out infinite;
        }
        @keyframes flow-pulse {
          0%, 100% { stroke-opacity: 0.7; }
          50% { stroke-opacity: 0.3; }
        }
      `;
      if (!document.head.querySelector('style[data-prediction-pulse]')) {
        style.setAttribute('data-prediction-pulse', 'true');
        document.head.appendChild(style);
      }

      group.appendChild(circle);
    });

  }, [svg, nodes, predictions, zoomLevel]);

  return null;
};
