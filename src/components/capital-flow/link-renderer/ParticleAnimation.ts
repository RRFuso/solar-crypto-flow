
export const addFlowParticles = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  group: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: any[],
  selectedNodeId: string | null
) => {
  // Crie um grupo específico para partículas
  const particlesGroup = group.append("g").attr("class", "particles-group");

  links.forEach((link, index) => {
    const pathId = `flow-path-${index}`;
    
    // Cria um caminho oculto para a bolinha seguir
    const path = particlesGroup
      .append("path")
      .attr("id", pathId)
      .attr("d", () => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        return `M${link.source.x},${link.source.y}A${dr},${dr} 0 0,1 ${link.target.x},${link.target.y}`;
      })
      .attr("fill", "none")
      .attr("stroke", "none");

    const totalLength = path.node()?.getTotalLength?.() || 0;

    // Adiciona uma bolinha que segue a linha e muda de cor
    const circle = particlesGroup
      .append("circle")
      .attr("r", 3)
      .attr("opacity", 0.8);

    // Função para mover e mudar cor durante o percurso
    function animateParticle() {
      circle
        .transition()
        .duration(4000)
        .ease(d3.easeLinear)
        .attrTween("transform", () => {
          return (t: number) => {
            const point = path.node()?.getPointAtLength(t * totalLength);
            const x = point?.x || 0;
            const y = point?.y || 0;
            return `translate(${x},${y})`;
          };
        })
        .attrTween("fill", () => {
          return (t: number) => {
            // Interpolação de vermelho para verde
            const r = Math.round(255 * (1 - t));
            const g = Math.round(255 * t);
            return `rgb(${r},${g},0)`;
          };
        })
        .on("end", animateParticle); // Loop contínuo
    }

    animateParticle();
  });
};
