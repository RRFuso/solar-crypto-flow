import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Progress } from "@/components/ui/progress";

interface Character {
  x: number;
  y: number;
  width: number;
  height: number;
  power: {
    width: number;
    height: number;
    color: string;
  };
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: {
    x: number;
    y: number;
  };
  alpha: number;
}

const BtcDominanceBattle = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dominance, setDominance] = useState(50);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  
  const { data } = useQuery({
    queryKey: ['btc-dominance'],
    queryFn: async () => {
      // In a real implementation, this would fetch from an API
      return Math.random() * (65 - 55) + 55; // Mock data between 55-65%
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (data) {
      setDominance(data);
    }
  }, [data]);

  const createParticle = (x: number, y: number, color: string): Particle => ({
    x,
    y,
    radius: Math.random() * 3 + 2,
    color,
    velocity: {
      x: (Math.random() - 0.5) * 3,
      y: (Math.random() - 0.5) * 3
    },
    alpha: 1
  });

  const updateParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    return particles.filter(particle => {
      particle.alpha -= 0.01;
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;

      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
      ctx.restore();

      return particle.alpha > 0;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const btcCharacter = {
      x: 50,
      y: canvas.height / 2,
      width: 60,
      height: 100,
      power: {
        width: (canvas.width * dominance) / 100,
        height: 40,
        color: '#F7931A', // Bitcoin orange
      },
    };

    const altCharacter = {
      x: canvas.width - 50,
      y: canvas.height / 2,
      width: 60,
      height: 100,
      power: {
        width: (canvas.width * (100 - dominance)) / 100,
        height: 40,
        color: '#6E59A5', // Purple for altcoins
      },
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#1a1b1e');
      gradient.addColorStop(1, '#2a2b2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw characters
      ctx.fillStyle = '#F7931A';
      ctx.fillRect(
        btcCharacter.x - btcCharacter.width / 2,
        btcCharacter.y - btcCharacter.height / 2,
        btcCharacter.width,
        btcCharacter.height
      );

      ctx.fillStyle = '#6E59A5';
      ctx.fillRect(
        altCharacter.x - altCharacter.width / 2,
        altCharacter.y - altCharacter.height / 2,
        altCharacter.width,
        altCharacter.height
      );

      // Draw power beams with gradients
      const btcBeamGradient = ctx.createLinearGradient(
        btcCharacter.x,
        0,
        btcCharacter.x + btcCharacter.power.width,
        0
      );
      btcBeamGradient.addColorStop(0, '#F7931A');
      btcBeamGradient.addColorStop(1, 'rgba(247, 147, 26, 0.3)');
      ctx.fillStyle = btcBeamGradient;
      ctx.fillRect(
        btcCharacter.x,
        btcCharacter.y - btcCharacter.power.height / 2,
        btcCharacter.power.width,
        btcCharacter.power.height
      );

      const altBeamGradient = ctx.createLinearGradient(
        altCharacter.x - altCharacter.power.width,
        0,
        altCharacter.x,
        0
      );
      altBeamGradient.addColorStop(0, 'rgba(110, 89, 165, 0.3)');
      altBeamGradient.addColorStop(1, '#6E59A5');
      ctx.fillStyle = altBeamGradient;
      ctx.fillRect(
        altCharacter.x - altCharacter.power.width,
        altCharacter.y - altCharacter.power.height / 2,
        altCharacter.power.width,
        altCharacter.power.height
      );

      // Generate particles at collision point
      const collisionX = (canvas.width * dominance) / 100;
      if (Math.random() > 0.7) {
        for (let i = 0; i < 3; i++) {
          setParticles(prev => [
            ...prev,
            createParticle(
              collisionX,
              canvas.height / 2,
              Math.random() > 0.5 ? '#F7931A' : '#6E59A5'
            )
          ]);
        }
      }

      // Update and draw particles
      setParticles(prev => updateParticles(ctx, prev));

      // Draw collision effect
      const collisionGradient = ctx.createRadialGradient(
        collisionX,
        canvas.height / 2,
        0,
        collisionX,
        canvas.height / 2,
        40
      );
      collisionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      collisionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = collisionGradient;
      ctx.beginPath();
      ctx.arc(collisionX, canvas.height / 2, 40, 0, Math.PI * 2);
      ctx.fill();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dominance, particles]);

  return (
    <div className="w-full space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Dominância BTC</span>
        <span className="text-sm font-medium">{dominance.toFixed(2)}%</span>
      </div>
      <Progress value={dominance} className="h-2" />
      <div className="relative w-full h-[200px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
};

export default BtcDominanceBattle;