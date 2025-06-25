
import React from 'react';
import { MarketIndex } from '@/types/indices';
import { createNodePatterns } from './createNodePatterns';
import { createNodeVisuals } from './createNodeVisuals';
import { createNodeText } from './createNodeText';
import { createNodeTooltips } from './createNodeTooltips';

interface NodeElementsProps {
  svg: any;
  nodes: any[];
}

export const createNodeElements = (props: NodeElementsProps) => {
  const { svg, nodes } = props;

  // Create patterns for logos using native DOM methods
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  svg.appendChild(defs);
  
  // Create patterns for each node
  nodes.forEach(node => {
    const patternId = `logo-${node.id}`;
    const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    pattern.setAttribute("id", patternId);
    pattern.setAttribute("width", "1");
    pattern.setAttribute("height", "1");
    pattern.setAttribute("patternUnits", "objectBoundingBox");
    
    const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.setAttribute("href", `https://cryptocurrencyliveprices.com/img/${node.id.toLowerCase()}.png`);
    image.setAttribute("width", (node.radius * 2 * 0.8).toString());
    image.setAttribute("height", (node.radius * 2 * 0.8).toString());
    image.setAttribute("x", (node.radius * 0.2).toString());
    image.setAttribute("y", (node.radius * 0.2).toString());
    image.setAttribute("preserveAspectRatio", "xMidYMid slice");
    
    pattern.appendChild(image);
    defs.appendChild(pattern);
  });
  
  // Create node group
  const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  nodeGroup.setAttribute("class", "nodes");
  svg.appendChild(nodeGroup);
  
  const nodeElements: SVGGElement[] = [];
  
  nodes.forEach(node => {
    const nodeElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodeElement.setAttribute("transform", `translate(${node.x || 0},${node.y || 0})`);
    
    // Add glow effect
    const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    glow.setAttribute("r", (node.radius * 1.4).toString());
    glow.setAttribute("fill", node.isCentral ? "rgba(247, 147, 26, 0.3)" : "rgba(0, 181, 216, 0.3)");
    glow.setAttribute("filter", "blur(8px)");
    nodeElement.appendChild(glow);
    
    // Add main circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "node-circle");
    circle.setAttribute("r", node.radius.toString());
    circle.setAttribute("fill", `url(#logo-${node.id})`);
    circle.setAttribute("stroke", node.isCentral ? "#F7931A" : "#00b5d8");
    circle.setAttribute("stroke-width", "3");
    circle.setAttribute("stroke-opacity", "0.9");
    nodeElement.appendChild(circle);
    
    // Add text elements
    const ticker = document.createElementNS("http://www.w3.org/2000/svg", "text");
    ticker.setAttribute("class", "ticker");
    ticker.setAttribute("text-anchor", "middle");
    ticker.setAttribute("dy", "2.0em");
    ticker.setAttribute("fill", "white");
    ticker.setAttribute("font-weight", "bold");
    ticker.setAttribute("font-size", node.isCentral ? "16px" : "14px");
    ticker.textContent = node.id;
    nodeElement.appendChild(ticker);
    
    const percentage = document.createElementNS("http://www.w3.org/2000/svg", "text");
    percentage.setAttribute("class", "percentage");
    percentage.setAttribute("text-anchor", "middle");
    percentage.setAttribute("dy", "4.4em");
    percentage.setAttribute("fill", node.change >= 0 ? "#4ade80" : "#f43f5e");
    percentage.setAttribute("font-weight", "bold");
    percentage.setAttribute("font-size", "13px");
    percentage.textContent = (node.change >= 0 ? "+" : "") + (node.change ? node.change.toFixed(2) : "0.00") + "%";
    nodeElement.appendChild(percentage);
    
    nodeGroup.appendChild(nodeElement);
    nodeElements.push(nodeElement);
  });

  return nodeElements;
};
