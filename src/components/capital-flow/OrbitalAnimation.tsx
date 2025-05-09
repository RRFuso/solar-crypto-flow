
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';

type OrbitalLink = {
  source: OrbitalNode;
  target: OrbitalNode;
  value: number;
  volume?: number;
  percentage: number;
};

interface OrbitalAnimationProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  width: number;
  height: number;
  rotationSpeed?: number;
  updateLinksInRealTime?: boolean;
}

export class OrbitalAnimation {
  private animationRef: number | undefined;

  constructor(props: OrbitalAnimationProps) {
    this.startAnimation(props);
  }

  private startAnimation({ svg, nodes, width, height, rotationSpeed = 0.00012, updateLinksInRealTime = true }: OrbitalAnimationProps) {
    const nonCentralNodes = nodes.filter(node => node.type !== "central");

    if (nonCentralNodes.length === 0) return;

    const animateOrbits = () => {
      nonCentralNodes.forEach((node) => {
        const dx = node.x - width / 2;
        const dy = node.y - height / 2;
        const angle = Math.atan2(dy, dx) + rotationSpeed;
        const radius = Math.sqrt(dx * dx + dy * dy);

        node.x = width / 2 + Math.cos(angle) * radius;
        node.y = height / 2 + Math.sin(angle) * radius;
      });

      // ✅ Corrigido: atualiza corretamente a posição dos grupos de nós
      svg.selectAll<SVGGElement, OrbitalNode>(".node-group")
        .attr("transform", d => `translate(${d.x},${d.y})`);

      svg.selectAll<SVGCircleElement, OrbitalNode>(".node-glow")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      // Atualiza pulsos centrais se existirem
      svg.selectAll(".pulse-circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      if (updateLinksInRealTime) {
        svg.selectAll("path.link-path")
          .attr("d", (d: any) => {
            if (!d || !d.source || !d.target) return "";
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
            return `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
          });

        svg.selectAll("linearGradient")
          .each(function (d: any) {
            if (!d?.source || !d?.target) return;
            d3.select(this)
              .attr("x1", d.source.x)
              .attr("y1", d.source.y)
              .attr("x2", d.target.x)
              .attr("y2", d.target.y);
          });

        svg.selectAll("marker")
          .attr("refX", (d: any) => {
            if (!d?.target) return 8;
            const targetRadius = d.target.radius || 20;
            return 8 + targetRadius * 0.8;
          });
      }

      this.animationRef = requestAnimationFrame(animateOrbits);
    };

    this.animationRef = requestAnimationFrame(animateOrbits);
  }

  public cleanup() {
    if (this.animationRef) {
      cancelAnimationFrame(this.animationRef);
      this.animationRef = undefined;
    }
  }
}

export const OrbitalAnimationComponent = React.memo((props: OrbitalAnimationProps) => {
  const animationInstanceRef = useRef<OrbitalAnimation | null>(null);

  useEffect(() => {
    animationInstanceRef.current = new OrbitalAnimation(props);
    return () => {
      animationInstanceRef.current?.cleanup();
    };
  }, [props]);

  return null;
});
