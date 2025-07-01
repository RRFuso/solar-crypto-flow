
import React, { useEffect, useState, useRef } from 'react';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePriceActionSignals } from '@/hooks/usePriceActionSignals';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
  predictions?: Prediction[];
  chartTimeframe?: string;
  activeCategory?: string;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ 
  flowData, 
  zoomLevel = 60,
  predictions = [],
  chartTimeframe = '4h',
  activeCategory = 'all'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const animationRef = useRef<number | null>(null);

  const { data: cryptoData, isLoading: loadingCryptoData } = useCryptoData();
  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(['BTC', 'ETH']);
  const { insights: aiInsights, isLoading: loadingAI } = useAdvancedAI();

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 600
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced canvas-based visualization (without Three.js dependencies)
  useEffect(() => {
    if (!canvasRef.current || !flowData || flowData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    let time = 0;

    const animate = () => {
      time += 0.01;

      // Clear canvas with dark space background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated starfield background
      ctx.fillStyle = 'white';
      for (let i = 0; i < 150; i++) {
        const x = (Math.random() * canvas.width + time * 10) % canvas.width;
        const y = (Math.random() * canvas.height + time * 5) % canvas.height;
        const size = Math.random() * 2;
        const opacity = Math.sin(time + i) * 0.4 + 0.6;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw central node (BTC) with pulsing effect
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const pulseSize = 30 + Math.sin(time * 2) * 8;
      
      // Outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, pulseSize, centerX, centerY, pulseSize + 40);
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.1)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize + 40, 0, Math.PI * 2);
      ctx.fill();

      // Central node
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Draw label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BTC', centerX, centerY + 5);

      // Draw orbital nodes with animated movement
      const filteredFlowData = activeCategory === 'all' ? flowData : 
        flowData.filter(flow => {
          const cryptoInfo = cryptoData?.find(c => c.symbol === flow.to || c.symbol === flow.from);
          return cryptoInfo?.category === activeCategory;
        });

      filteredFlowData.slice(0, 12).forEach((flow, index) => {
        const baseAngle = (index * Math.PI * 2 / 12);
        const orbitRadius = 120 + (index % 3) * 50;
        const speed = 0.3 + (index % 3) * 0.1;
        const angle = baseAngle + time * speed;
        
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius;

        // Node color based on flow value and predictions
        const prediction = predictions?.find(p => p.symbol === flow.to || p.symbol === flow.from);
        let color = flow.value > 0 ? '#10b981' : '#ef4444';
        
        if (prediction) {
          color = prediction.bullish ? '#00ff88' : '#ff3366';
        }

        // Draw orbit path
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw connection line with flow animation
        const lineOpacity = 0.6 + Math.sin(time * 3 + index) * 0.3;
        ctx.strokeStyle = `${color}${Math.floor(lineOpacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2 + Math.abs(flow.value) * 0.1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw orbital node with glow
        const nodeGlow = ctx.createRadialGradient(x, y, 15, x, y, 25);
        nodeGlow.addColorStop(0, `${color}CC`);
        nodeGlow.addColorStop(1, `${color}00`);
        ctx.fillStyle = nodeGlow;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw label
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const label = flow.to !== 'BTC' ? flow.to : flow.from;
        ctx.fillText(label || 'N/A', x, y + 35);

        // Draw value indicator
        ctx.font = '10px Arial';
        ctx.fillStyle = flow.value > 0 ? '#10b981' : '#ef4444';
        const valueText = `${flow.value > 0 ? '+' : ''}${flow.value.toFixed(1)}%`;
        ctx.fillText(valueText, x, y + 48);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [flowData, dimensions, zoomLevel, predictions, activeCategory, cryptoData]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (loadingCryptoData || loadingSignals || loadingAI) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading visualization...</p>
        </div>
      </div>
    );
  }

  if (!flowData || flowData.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <p className="text-slate-400 text-lg">🌌 No flow data available</p>
          <p className="text-slate-500 text-sm">Waiting for market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Overlay controls */}
      <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-2">
        <div className="text-xs text-white/60">
          Zoom: {zoomLevel}%
        </div>
        <div className="text-xs text-white/60">
          Timeframe: {chartTimeframe}
        </div>
        {activeCategory !== 'all' && (
          <div className="text-xs text-white/60">
            Category: {activeCategory}
          </div>
        )}
      </div>
    </div>
  );
};
