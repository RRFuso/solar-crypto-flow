import React, { useRef, useEffect, useState } from 'react';
import { IndexRotationResult } from '@/types/indices';

interface MarketFlowVisualizationGPUProps {
  data: IndexRotationResult;
  useGPURendering?: boolean;
}

export const MarketFlowVisualizationGPU: React.FC<MarketFlowVisualizationGPUProps> = ({ 
  data, 
  useGPURendering = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 350 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set initial dimensions
    setDimensions({
      width: containerRef.current.clientWidth,
      height: 350
    });
    
    // Update dimensions on window resize
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 350
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div ref={containerRef} className="w-full flex-1 relative">
      {dimensions.width > 0 && useGPURendering && (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-900 to-purple-900 text-white">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">🚀 Renderização GPU Ativada</h3>
            <p className="text-gray-300">Sistema Solar Cripto com Three.js</p>
            <div className="mt-4 text-sm text-green-400">
              ⚡ Performance otimizada para {data.indices?.length || 0} elementos
            </div>
          </div>
        </div>
      )}
      
      {/* Fallback message if GPU rendering is disabled */}
      {!useGPURendering && (
        <div className="flex items-center justify-center h-full bg-gray-900 text-white">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Renderização GPU Desabilitada</h3>
            <p className="text-gray-400">Ative a renderização GPU para melhor performance</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketFlowVisualizationGPU;

