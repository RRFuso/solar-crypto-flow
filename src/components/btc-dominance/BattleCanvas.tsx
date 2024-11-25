import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface BattleCanvasProps {
  btcDominance: number;
}

const BattleCanvas = ({ btcDominance }: BattleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  const drawBattle = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate positions based on BTC dominance
    const collisionPoint = (width * btcDominance) / 100;
    
    // Draw background
    ctx.fillStyle = theme === 'dark' ? '#1a1b1e' : '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    // Draw BTC character (left)
    ctx.fillStyle = '#F7931A'; // Bitcoin orange
    ctx.beginPath();
    ctx.arc(100, height/2, 40, 0, Math.PI * 2);
    ctx.fill();

    // Draw Altcoin character (right)
    ctx.fillStyle = '#627EEA'; // Ethereum blue (representing altcoins)
    ctx.beginPath();
    ctx.arc(width - 100, height/2, 40, 0, Math.PI * 2);
    ctx.fill();

    // Draw power beams
    const gradient1 = ctx.createLinearGradient(100, 0, collisionPoint, 0);
    gradient1.addColorStop(0, 'rgba(247, 147, 26, 0.8)'); // BTC color
    gradient1.addColorStop(1, 'rgba(247, 147, 26, 0.2)');
    
    const gradient2 = ctx.createLinearGradient(width - 100, 0, collisionPoint, 0);
    gradient2.addColorStop(0, 'rgba(98, 126, 234, 0.8)'); // Alt color
    gradient2.addColorStop(1, 'rgba(98, 126, 234, 0.2)');

    // BTC beam
    ctx.fillStyle = gradient1;
    ctx.fillRect(140, height/2 - 20, collisionPoint - 140, 40);

    // Altcoin beam
    ctx.fillStyle = gradient2;
    ctx.fillRect(collisionPoint, height/2 - 20, width - 240 - collisionPoint, 40);

    // Collision effect
    const collisionGradient = ctx.createRadialGradient(
      collisionPoint, height/2, 0,
      collisionPoint, height/2, 40
    );
    collisionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    collisionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = collisionGradient;
    ctx.beginPath();
    ctx.arc(collisionPoint, height/2, 40, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = `${canvas.offsetWidth}px`;
      canvas.style.height = `${canvas.offsetHeight}px`;
      drawBattle(ctx, canvas.offsetWidth, canvas.offsetHeight);
    };

    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [btcDominance, theme]);

  return (
    <div className="relative w-full h-32">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-sm font-medium bg-background/80 px-3 py-1 rounded-full">
        Dominância BTC: {btcDominance.toFixed(2)}%
      </div>
    </div>
  );
};

export default BattleCanvas;