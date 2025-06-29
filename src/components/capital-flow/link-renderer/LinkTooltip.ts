
import { formatValue } from '../utils/formatHelpers';

/**
 * Creates and manages tooltips for link hover interactions using native DOM
 */
export const createLinkTooltip = (
  svg: Element,
  event: MouseEvent, 
  linkData: any
) => {
  // Show tooltip with flow details using native DOM methods
  const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "g");
  tooltip.setAttribute("class", "tooltip");
  tooltip.setAttribute("transform", `translate(${event.offsetX},${event.offsetY - 40})`);
  
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("rx", "5");
  rect.setAttribute("ry", "5");
  rect.setAttribute("x", "-80");
  rect.setAttribute("y", "-40");
  rect.setAttribute("width", "160");
  rect.setAttribute("height", "55");
  rect.setAttribute("fill", "rgba(0, 0, 0, 0.8)");
  rect.setAttribute("stroke", linkData.percentage > 0 ? "#4ade80" : "#f43f5e");
  rect.setAttribute("stroke-width", "1");
  tooltip.appendChild(rect);
    
  // Flow direction text
  const flowText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  flowText.setAttribute("x", "0");
  flowText.setAttribute("y", "-25");
  flowText.setAttribute("text-anchor", "middle");
  flowText.setAttribute("fill", "white");
  flowText.setAttribute("font-weight", "bold");
  flowText.textContent = `${linkData.source.id.toUpperCase()} → ${linkData.target.id.toUpperCase()}`;
  tooltip.appendChild(flowText);
  
  // Flow value text
  const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  valueText.setAttribute("x", "0");
  valueText.setAttribute("y", "-5");
  valueText.setAttribute("text-anchor", "middle");
  valueText.setAttribute("fill", "white");
  valueText.textContent = `Volume: $${formatValue(linkData.value)}`;
  tooltip.appendChild(valueText);
  
  // Change percentage text
  const changeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  changeText.setAttribute("x", "0");
  changeText.setAttribute("y", "15");
  changeText.setAttribute("text-anchor", "middle");
  changeText.setAttribute("fill", linkData.percentage > 0 ? "#4ade80" : "#f43f5e");
  changeText.textContent = `Change: ${(linkData.percentage >= 0 ? "+" : "") + linkData.percentage.toFixed(2)}%`;
  tooltip.appendChild(changeText);
  
  svg.appendChild(tooltip);
  return tooltip;
};

/**
 * Removes any tooltips from the SVG
 */
export const removeLinkTooltip = (
  svg: Element
) => {
  const tooltips = svg.querySelectorAll(".tooltip");
  tooltips.forEach(tooltip => tooltip.remove());
};
