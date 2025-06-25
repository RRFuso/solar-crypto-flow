
import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface StarfieldBackgroundProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
}

/**
 * Starfield desativado para melhorar performance.
 */
export const StarfieldBackground: React.FC<StarfieldBackgroundProps> = ({ svg, width, height }) => {
  useEffect(() => {
    // Remove qualquer fundo anterior
    svg.selectAll('.starfield').remove();

    // Se desejar manter a estrutura para reativar no futuro:
    svg.append("g").attr("class", "starfield");

    return () => {
      svg.selectAll('.starfield').remove();
    };
  }, [svg, width, height]);

  return null;
};
