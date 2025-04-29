
import React from 'react';

interface NodeProps {
  node: {
    id: string;
    symbol: string;
    x: number;
    y: number;
    radius: number;
    marketCap: number;
    performance: number;
  };
  isCentral: boolean;
  isSelected: boolean;
  onClick: (id: string) => void;
}

const getLogoUrl = (symbol: string) => {
  return `https://cryptoicon-api.vercel.app/api/icon/${symbol.toLowerCase()}`;
};

export const NodeRendererComponent: React.FC<NodeProps> = ({ node, isCentral, isSelected, onClick }) => {
  const borderColor = isSelected ? '#00f0ff' : isCentral ? '#FFD700' : '#888';
  const scale = isSelected ? 1.3 : 1;
  const radius = node.radius * scale;

  return (
    <g transform={`translate(${node.x}, ${node.y})`} onClick={() => onClick(node.id)} style={{ cursor: 'pointer' }}>
      <circle
        r={radius}
        fill="#000"
        stroke={borderColor}
        strokeWidth={isSelected ? 4 : 2}
      />
      <image
        href={getLogoUrl(node.symbol)}
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        preserveAspectRatio="xMidYMid slice"
        onError={(e) => {
          (e.target as SVGImageElement).setAttribute('href', '/images/default_crypto.png');
        }}
        clipPath={`circle(${radius}px at ${radius}px ${radius}px)`}
      />
      <text
        y={radius + 12}
        textAnchor="middle"
        fill="white"
        fontSize="10"
      >
        {node.symbol.toUpperCase()}
      </text>
      <text
        y={radius + 24}
        textAnchor="middle"
        fill="#00ff99"
        fontSize="9"
      >
        {node.performance?.toFixed(2)}%
      </text>
    </g>
  );
};
