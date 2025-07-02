
import * as d3 from 'd3';

export const createLinks = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  flows: any[],
  nodes: any[]
) => {
  // Create links from flows
  const links = flows.map(flow => ({
    source: nodes.find(n => n.id === flow.from),
    target: nodes.find(n => n.id === flow.to),
    value: flow.value,
    percentage: flow.percentage
  })).filter(link => link.source && link.target);
  
  // Create markers (arrows)
  svg.append("defs").selectAll("marker")
    .data(links)
    .enter().append("marker")
    .attr("id", (d, i) => `arrow-${i}`)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 25)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("fill", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
    .attr("d", "M0,-5L10,0L0,5");
  
  // Draw links with flow animation
  const linkGroup = svg.append("g").attr("class", "links");
  
  const link = linkGroup.selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("stroke", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
    .attr("stroke-width", d => 2 + (Math.abs(d.value) / 10) * 6)
    .attr("fill", "none")
    .attr("stroke-dasharray", "10,10")
    .attr("opacity", 0.7)
    .attr("d", (d: any) => {
      // Create curved paths between nodes
      const dx = (d.target.x || 0) - (d.source.x || 0);
      const dy = (d.target.y || 0) - (d.source.y || 0);
      const dr = Math.sqrt(dx * dx + dy * dy) * 2;
      return `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`;
    })
    .attr("marker-end", (d, i) => `url(#arrow-${i})`);
  
  // Add animated flow particles
  addFlowParticles(svg, links);
  
  return link;
};

function addFlowParticles(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  links: any[]
) {
  links.forEach((d, i) => {
    // Create particle group for this link
    const particles = svg.append("g")
      .attr("class", "flow-particles")
      .selectAll("circle")
      .data(d3.range(5)) // 5 particles per link
      .enter()
      .append("circle")
      .attr("r", 2)
      .attr("fill", d.percentage > 0 ? "#00ffcc" : "#ff0066")
      .attr("opacity", 0.8);
    
    // Animate particles along the path
    function animateParticles() {
      const path = svg.selectAll("path.link").nodes()[i];
      if (!path) return;
      
      const pathLength = path.getTotalLength();
      
      particles
        .attr("transform", function(d: any, j: number) {
          // Stagger the particles
          let offset = (j / 5) * pathLength;
          
          // Add time-based offset that loops
          offset += (Date.now() / 50) % pathLength;
          if (d.percentage !== undefined && d.percentage <= 0) { 
            offset = pathLength - offset; // Reverse direction for outflows
          }
          
          // Loop back to start when reaching the end
          offset = offset % pathLength;
          
          // Get point along the path
          const point = path.getPointAtLength(offset);
          return `translate(${point.x}, ${point.y})`;
        });
    }
    
    animateParticles();
  });
}
