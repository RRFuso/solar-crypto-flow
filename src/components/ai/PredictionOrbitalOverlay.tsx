
useEffect(() => {
  if (!svg || predictionMap.size === 0 || !nodes || nodes.length === 0) return;

  svg.selectAll('.prediction-pulse-group').remove();
  const group = svg.append('g').attr('class', 'prediction-pulse-group');

  const pulses = group
    .selectAll('g.pulse-node')
    .data(nodes.filter(n => predictionMap.has(n.id)))
    .enter()
    .append('g')
    .attr('class', 'pulse-node')
    .attr('data-id', d => d.id);

  pulses.each(function (d) {
    const prediction = predictionMap.get(d.id);
    if (!prediction || prediction.confidence < 0.6) return;

    const color = prediction.bullish
      ? `rgba(0, 255, 128, ${prediction.confidence * 0.7})`
      : `rgba(255, 50, 50, ${prediction.confidence * 0.7})`;

    d3.select(this)
      .append('circle')
      .attr('class', 'prediction-pulse')
      .attr('r', d.radius * 1.2)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('opacity', 0.7)
      .attr('pointer-events', 'none')
      .append('animate')
      .attr('attributeName', 'r')
      .attr('values', `${d.radius * 1.2};${d.radius * 1.8};${d.radius * 1.2}`)
      .attr('dur', prediction.bullish ? '3s' : '4s')
      .attr('repeatCount', 'indefinite');

    d3.select(this)
      .select('circle')
      .append('animate')
      .attr('attributeName', 'opacity')
      .attr('values', '0.7;0.3;0.7')
      .attr('dur', prediction.bullish ? '3s' : '4s')
      .attr('repeatCount', 'indefinite');
  });

  // Atualiza posição dinamicamente com base no objeto mutável de `nodes`
  const animate = () => {
    group.selectAll('g.pulse-node')
      .each(function (d: any) {
        if (d && typeof d.x === 'number' && typeof d.y === 'number') {
          d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
        }
      });
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);

  return () => {
    svg.selectAll('.prediction-pulse-group').remove();
  };
}, [svg, predictionMap]);
