
// ⚙️ IMPORTS
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement'; // Assume OrbitalNode will be updated
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals'; // Import PriceActionSignal type

// Extend OrbitalNode interface locally for clarity (ideally update the source type)
interface ExtendedOrbitalNode extends OrbitalNode {
  priceActionSignal?: PriceActionSignal; // Add optional price action signal data
  price?: string; // Add price
  priceChange24h?: number; // Add 24h price change
}

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: ExtendedOrbitalNode[]; // Use the extended type
  centralNode: ExtendedOrbitalNode | null;
  selectedNodeId: string | null;
  zoomLevel: number;
}

// 🎯 UTILS - Updated color logic based on Price Action Signals
const getGlowColor = (node: ExtendedOrbitalNode): string => {
  const signal = node.priceActionSignal;
  if (signal?.explosivePotential === 'High') return 'rgba(255, 50, 50, 0.5)'; // Intense Red glow for High
  if (signal?.explosivePotential === 'Medium') return 'rgba(255, 150, 0, 0.4)'; // Orange glow for Medium
  if (signal?.explosivePotential === 'Low') return 'rgba(255, 220, 0, 0.3)'; // Yellow glow for Low
  // Fallback to old logic if no signal
  if (node.divergenceBullish) return 'rgba(0,255,255,0.4)';
  if (node.divergenceBearish) return 'rgba(255,0,180,0.4)';
  if (node.inflow > node.outflow) return 'rgba(0, 255, 204, 0.3)';
  if (node.outflow > node.inflow) return 'rgba(255, 0, 102, 0.3)';
  return 'rgba(0, 181, 216, 0.2)'; // Default subtle glow
};

const getStrokeColor = (node: ExtendedOrbitalNode, selectedNodeId: string | null): string => {
  const signal = node.priceActionSignal;
  if (selectedNodeId === node.id) return '#ffffff'; // White for selected
  if (signal?.explosivePotential === 'High') return '#FFD700'; // Gold for High potential
  if (signal?.isBreakout) return '#FF4500'; // Red-Orange for Breakout
  if (signal?.isExpansion) return '#FFA500'; // Orange for Expansion
  if (signal?.isAccelerating) return '#1E90FF'; // DodgerBlue for Acceleration
  // Fallback to old logic
  if (node.divergenceBullish) return '#00ffff';
  if (node.divergenceBearish) return '#ff0077';
  if (node.inflow > node.outflow) return '#00ffcc';
  if (node.outflow > node.inflow) return '#ff0066';
  return '#00b5d8'; // Default blue
};

// Function to get Price Action Signal text for tooltip
const getPriceActionTooltipText = (signal: PriceActionSignal | undefined): string[] => {
  if (!signal || signal.explosivePotential === 'None') return [];
  const lines: string[] = [];
  lines.push(`Potencial: ${signal.explosivePotential}`);
  if (signal.isBreakout) lines.push('Sinal: Breakout');
  if (signal.isExpansion) lines.push('Sinal: Expansão');
  if (signal.isAccelerating) lines.push('Sinal: Aceleração');
  return lines;
};

// Format price
const formatPrice = (priceString: string | undefined): string => {
  const price = parseFloat(priceString || '0');
  if (isNaN(price)) return 'N/A';
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}`;
};

// Format percentage change
const formatPercentage = (change: number | undefined): string => {
  if (change === undefined || isNaN(change)) return 'N/A';
  return `${change.toFixed(2)}%`;
};

// 📦 CLASS
class NodeRendererClass {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private nodes: ExtendedOrbitalNode[];
  private selectedNodeId: string | null;
  private zoomLevel: number;

  constructor(props: NodeRendererProps) {
    this.svg = props.svg;
    this.nodes = props.nodes;
    this.selectedNodeId = props.selectedNodeId;
    this.zoomLevel = props.zoomLevel;
    this.renderNodes();
  }

  private renderNodes() {
    this.svg.selectAll('.nodes-group').remove();
    const nodesGroup = this.svg.append("g").attr("class", "nodes-group");

    this.createNodePatterns(this.svg, this.nodes);

    // 🟢 GLOW (Updated color logic)
    nodesGroup.selectAll('circle.node-glow')
      .data(this.nodes)
      .enter()
      .append('circle')
      .attr('class', 'node-glow')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => {
        const volFactor = d.volume ? Math.sqrt(d.volume) / 100 : 1;
        return d.radius * 1.3 * volFactor * (this.zoomLevel / 100);
      })
      .attr('fill', getGlowColor)
      .attr('filter', 'blur(6px)');

    // 🧠 MAIN NODE GROUP
    const node = nodesGroup.selectAll('g.node')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('data-id', d => d.id)
      .style('cursor', 'pointer')
      .on('mouseenter', (event: MouseEvent, d: ExtendedOrbitalNode) => { // Correct event handler signature
        this.svg.selectAll('.node-tooltip').remove();
        const tooltip = this.svg.append('g')
          .attr('class', 'node-tooltip')
          .attr('transform', `translate(${d.x},${d.y - d.radius * (this.zoomLevel / 100) - 15})`); // Adjust vertical position

        // --- Tooltip Content --- 
        const priceLine = `Preço: ${formatPrice(d.price)}`;
        const change24h = d.priceChange24h ?? 0;
        const changeColor = change24h >= 0 ? '#22c55e' : '#ef4444'; // Green or Red
        const changeLine = `24h: ${formatPercentage(change24h)}`;
        const volumeLine = `Volume: ${d.volume?.toLocaleString() || 'N/A'}`;
        const priceActionLines = getPriceActionTooltipText(d.priceActionSignal);
        
        const textLines = [
          d.name || d.id, 
          priceLine, 
          changeLine, 
          volumeLine, 
          ...priceActionLines
        ];
        const padding = 10;
        const lineHeight = 16;
        const tooltipHeight = textLines.length * lineHeight + padding * 1.5; // Adjusted padding
        let maxWidth = 0;

        // Pre-calculate max width
        const tempText = tooltip.append('text').style('opacity', 0);
        textLines.forEach(line => {
            const textNode = tempText.text(line).node();
            const w = textNode?.getComputedTextLength() || 0;
            if (w > maxWidth) maxWidth = w;
        });
        tempText.remove();
        const tooltipWidth = Math.max(150, maxWidth + padding * 2); // Min width

        tooltip.append('rect')
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('x', -tooltipWidth / 2)
          .attr('y', -tooltipHeight + padding / 2)
          .attr('width', tooltipWidth)
          .attr('height', tooltipHeight)
          .attr('fill', 'rgba(10, 20, 30, 0.9)')
          .attr('stroke', getStrokeColor(d, this.selectedNodeId))
          .attr('stroke-width', 1.5);

        textLines.forEach((line, i) => {
          let fillColor = '#FFFFFF'; // Default white
          let fontWeight = 'normal';
          let fontSize = '11px';

          if (i === 0) { // Symbol/Name
            fontWeight = 'bold';
            fontSize = '13px';
          } else if (i === 1) { // Price
             fillColor = '#E0E0E0';
          } else if (i === 2) { // Change 24h
             fillColor = changeColor;
             fontWeight = 'medium';
          } else if (i === 3) { // Volume
             fillColor = '#AAAAAA';
          } else { // Price Action Signals
             fillColor = '#00B5D8'; // Cyan for signals
             fontSize = '10px';
          }

          tooltip.append('text')
            .attr('x', 0)
            .attr('y', -tooltipHeight + padding * 1.8 + i * lineHeight)
            .attr('text-anchor', 'middle')
            .attr('fill', fillColor)
            .attr('font-size', fontSize)
            .attr('font-weight', fontWeight)
            .text(line);
        });
      })
      .on('mouseleave', () => this.svg.selectAll('.node-tooltip').remove())
      .on('click', (event: MouseEvent, d: ExtendedOrbitalNode) => { // Correct event handler signature and fix string literal
        const clickEvent = new CustomEvent('node-click', { detail: { nodeId: d.id } });
        document.dispatchEvent(clickEvent);
      });

    // 🔵 CIRCLE (Updated stroke logic)
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => {
        const volFactor = d.volume ? Math.sqrt(d.volume) / 100 : 1;
        return d.radius * volFactor * (this.zoomLevel / 100);
      })
      .attr('fill', d => `url(#logo-${d.id})`)
      .attr('stroke', d => getStrokeColor(d, this.selectedNodeId))
      .attr('stroke-width', d => this.selectedNodeId === d.id ? 3 : 2)
      .attr('stroke-opacity', 0.9);

    // 🔤 LABEL (Adjust position slightly based on radius)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius * (this.zoomLevel / 100) * 1.1 + 12)
      .attr('fill', 'white')
      .attr('font-size', d => Math.max(9, Math.min(12, d.radius * 0.35) * (this.zoomLevel / 100)))
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.id);
  }

  private createNodePatterns(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, nodes: ExtendedOrbitalNode[]) {
    svg.select('defs').remove();
    const defs = svg.append('defs');
    nodes.forEach(node => {
      const pattern = defs.append('pattern')
        .attr('id', `logo-${node.id}`)
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternContentUnits', 'objectBoundingBox');

      const logoUrl = getCryptoLogoUrl(node.id);
      pattern.append('image')
        .attr('href', logoUrl)
        .attr('width', 1)
        .attr('height', 1)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('error', function () {
          // Use d3.select with 'this' context inside a standard function
          d3.select(this).attr('href', getFallbackLogoUrl());
        });
    });
  }
}

// 🔁 REACT WRAPPER
export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  useEffect(() => {
    // Ensure nodes have the necessary data before rendering
    // This check might be redundant if data fetching/passing is handled correctly upstream
    const nodesWithData = props.nodes.map(node => ({
      ...node,
    }));
    
    // Create an instance of the class to render nodes
    const rendererInstance = new NodeRendererClass({ ...props, nodes: nodesWithData });
    
    // Cleanup function remains the same
    return () => {
      props.svg.selectAll('.nodes-group').remove();
      props.svg.selectAll('.node-tooltip').remove();
    };
  // Dependency array includes all props used inside useEffect or the class instance
  }, [props.nodes, props.selectedNodeId, props.zoomLevel, props.svg]); 

  return null;
});

