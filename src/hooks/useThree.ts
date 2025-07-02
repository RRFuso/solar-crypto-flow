
import { useCallback } from 'react';

// Mock types for crypto data
interface CryptoNode {
  id: string;
  name: string;
  marketCap: number;
  color: number;
  type: 'blackhole' | 'layer1' | 'token';
  parentId?: string;
}

interface CapitalFlow {
  from: string;
  to: string;
  value: number;
  isInflow: boolean;
}

// Mock data for initial rendering
const mockCryptoData: CryptoNode[] = [
  // Black hole (BTC)
  { id: 'btc', name: 'Bitcoin', marketCap: 100, color: 0x000000, type: 'blackhole' },
  
  // Layer 1 cryptos
  { id: 'eth', name: 'Ethereum', marketCap: 45, color: 0x8B5CF6, type: 'layer1' },
  { id: 'sol', name: 'Solana', marketCap: 15, color: 0x00FFAA, type: 'layer1' },
  { id: 'avax', name: 'Avalanche', marketCap: 10, color: 0xFF3333, type: 'layer1' },
  
  // Ethereum ecosystem tokens
  { id: 'uni', name: 'Uniswap', marketCap: 5, color: 0xD946EF, type: 'token', parentId: 'eth' },
  { id: 'link', name: 'Chainlink', marketCap: 6, color: 0x0EA5E9, type: 'token', parentId: 'eth' },
  { id: 'aave', name: 'Aave', marketCap: 4, color: 0x6633FF, type: 'token', parentId: 'eth' },
  
  // Solana ecosystem tokens
  { id: 'ray', name: 'Raydium', marketCap: 2, color: 0x0066FF, type: 'token', parentId: 'sol' },
  { id: 'srm', name: 'Serum', marketCap: 1, color: 0x00CCFF, type: 'token', parentId: 'sol' },
  
  // Avalanche ecosystem tokens
  { id: 'joe', name: 'Trader Joe', marketCap: 0.8, color: 0xF97316, type: 'token', parentId: 'avax' },
  { id: 'avme', name: 'AVME', marketCap: 0.5, color: 0xFF6600, type: 'token', parentId: 'avax' },
];

const mockFlowData: CapitalFlow[] = [
  { from: 'btc', to: 'eth', value: 5, isInflow: true },
  { from: 'btc', to: 'sol', value: 8, isInflow: true },
  { from: 'eth', to: 'avax', value: 3, isInflow: true },
  { from: 'sol', to: 'btc', value: 2, isInflow: false },
];

export function useThree() {
  let animationFrameId: number;
  
  // Mock implementation without Three.js dependencies
  const init = useCallback((container: HTMLDivElement) => {
    console.log('Canvas-based visualization initialized');
    
    // Create a simple canvas-based visualization
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.background = 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)';
    
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return { cleanup: () => {} };
    
    // Draw a simple representation of the crypto ecosystem
    const drawVisualization = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw stars background
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        
        ctx.fillStyle = 'white';
        ctx.globalAlpha = Math.random() * 0.8 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
      
      // Draw central black hole (BTC)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw accretion disk
      const gradient = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 80);
      gradient.addColorStop(0, 'rgba(255, 150, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 50, 0, 0.1)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw orbiting layer1 cryptos
      const time = Date.now() * 0.001;
      const layer1Cryptos = mockCryptoData.filter(c => c.type === 'layer1');
      
      layer1Cryptos.forEach((crypto, index) => {
        const angle = time * 0.2 + (index * Math.PI * 2 / layer1Cryptos.length);
        const distance = 150 + (index * 40);
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        // Draw orbit path
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, distance, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw crypto node
        const color = '#' + crypto.color.toString(16).padStart(6, '0');
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw glow
        const nodeGradient = ctx.createRadialGradient(x, y, 15, x, y, 25);
        nodeGradient.addColorStop(0, color + '80');
        nodeGradient.addColorStop(1, color + '00');
        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw label
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(crypto.name, x, y + 35);
      });
      
      // Draw BTC label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Bitcoin', centerX, centerY + 50);
    };
    
    const animate = () => {
      drawVisualization();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawVisualization();
    };
    
    window.addEventListener('resize', handleResize);
    
    return {
      cleanup: () => {
        window.removeEventListener('resize', handleResize);
        if (container.contains(canvas)) {
          container.removeChild(canvas);
        }
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      }
    };
  }, []);
  
  // Animation loop with canvas-based animation
  const animate = useCallback(() => {
    // Animation is handled in the init function
  }, []);
  
  return { init, animate };
}
