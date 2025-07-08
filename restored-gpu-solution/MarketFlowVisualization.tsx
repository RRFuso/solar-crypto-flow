import React from 'react';

interface MarketFlowVisualizationProps {
  data: any; // Temporarily use 'any' for data type
}

const MarketFlowVisualization: React.FC<MarketFlowVisualizationProps> = ({ data }) => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-800 text-white">
      <p className="text-lg">Placeholder de Visualização de Fluxo de Capital</p>
      <p className="text-sm mt-2">Dados recebidos: {JSON.stringify(data)}</p>
    </div>
  );
};

export default MarketFlowVisualization;


