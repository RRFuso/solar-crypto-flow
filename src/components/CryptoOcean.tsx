import React, { useState, useEffect, useRef } from 'react';
import { Fish } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CryptoOceanProps {
  cryptos: Array<{
    id: string;
    name: string;
    performance: number;
  }>;
}

interface FishPosition {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  targetX: number;
  targetY: number;
}

const CryptoOcean = ({ cryptos }: CryptoOceanProps) => {
  const [selectedCrypto, setSelectedCrypto] = useState<(typeof cryptos)[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fishPositions, setFishPositions] = useState<FishPosition[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const getSize = (performance: number) => {
    const minSize = 24;
    const maxSize = 96;
    const normalizedSize = Math.max(minSize, Math.min(maxSize, (performance / 100) * maxSize));
    return Math.abs(normalizedSize);
  };

  // Initialize fish positions
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    
    const initialPositions: FishPosition[] = cryptos.map((_, index) => {
      const zone = Math.floor(index * 3 / cryptos.length); // 0, 1, or 2 for top, middle, bottom
      const zoneHeight = height / 3;
      const baseY = zone * zoneHeight + zoneHeight / 2;
      
      return {
        x: Math.random() * (width - 100) + 50,
        y: baseY + (Math.random() - 0.5) * (zoneHeight * 0.5),
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: (Math.random() - 0.5) * 2,
        targetX: Math.random() * (width - 100) + 50,
        targetY: baseY + (Math.random() - 0.5) * (zoneHeight * 0.5),
      };
    });

    setFishPositions(initialPositions);
  }, [cryptos]);

  // Animation loop
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    const minDistance = 50; // Minimum distance between fish
    const maxSpeed = 2;
    const turnFactor = 0.05;

    const animate = () => {
      setFishPositions(prevPositions => {
        return prevPositions.map((fish, index) => {
          // Calculate new target if fish is close to current target
          const distanceToTarget = Math.hypot(fish.targetX - fish.x, fish.targetY - fish.y);
          if (distanceToTarget < 50) {
            const zone = Math.floor(index * 3 / cryptos.length);
            const zoneHeight = height / 3;
            const baseY = zone * zoneHeight + zoneHeight / 2;
            
            fish.targetX = Math.random() * (width - 100) + 50;
            fish.targetY = baseY + (Math.random() - 0.5) * (zoneHeight * 0.5);
          }

          // Calculate desired velocity
          const dx = fish.targetX - fish.x;
          const dy = fish.targetY - fish.y;
          const angle = Math.atan2(dy, dx);
          
          // Gradually turn towards target
          const targetVelocityX = Math.cos(angle) * maxSpeed;
          const targetVelocityY = Math.sin(angle) * maxSpeed;
          
          // Update velocity with smooth turning
          let newVelocityX = fish.velocityX + (targetVelocityX - fish.velocityX) * turnFactor;
          let newVelocityY = fish.velocityY + (targetVelocityY - fish.velocityY) * turnFactor;

          // Apply collision avoidance
          prevPositions.forEach((otherFish, otherIndex) => {
            if (index !== otherIndex) {
              const dx = fish.x - otherFish.x;
              const dy = fish.y - otherFish.y;
              const distance = Math.hypot(dx, dy);
              
              if (distance < minDistance) {
                const angle = Math.atan2(dy, dx);
                const repelStrength = (minDistance - distance) / minDistance;
                newVelocityX += Math.cos(angle) * repelStrength;
                newVelocityY += Math.sin(angle) * repelStrength;
              }
            }
          });

          // Normalize velocity to max speed
          const speed = Math.hypot(newVelocityX, newVelocityY);
          if (speed > maxSpeed) {
            newVelocityX = (newVelocityX / speed) * maxSpeed;
            newVelocityY = (newVelocityY / speed) * maxSpeed;
          }

          // Update position
          let newX = fish.x + newVelocityX;
          let newY = fish.y + newVelocityY;

          // Bounce off walls
          if (newX < 50) { newX = 50; newVelocityX *= -1; }
          if (newX > width - 50) { newX = width - 50; newVelocityX *= -1; }
          if (newY < 50) { newY = 50; newVelocityY *= -1; }
          if (newY > height - 50) { newY = height - 50; newVelocityY *= -1; }

          return {
            ...fish,
            x: newX,
            y: newY,
            velocityX: newVelocityX,
            velocityY: newVelocityY,
          };
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cryptos]);

  const logoMap = {
    'PENDLE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/8409.png',
    'JUP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/25147.png'
  };

  return (
    <div 
      ref={containerRef}
      className="mt-8 relative bg-gradient-to-b from-blue-900/90 via-blue-950 to-blue-900/90 rounded-lg p-8 min-h-[500px] overflow-hidden shadow-2xl border border-blue-800/30"
    >
      {/* Bolhas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute bg-blue-400/10 rounded-full"
            style={{
              width: `${Math.random() * 20 + 10}px`,
              height: `${Math.random() * 20 + 10}px`,
              left: `${Math.random() * 100}%`,
              animation: `bubble ${Math.random() * 10 + 5}s infinite linear`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Reflexo de luz */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-blue-300/5 to-transparent transform -skew-y-6" />
      
      <div className="relative z-10">
        {cryptos.map((crypto, index) => {
          const size = getSize(crypto.performance);
          const position = fishPositions[index];
          
          if (!position) return null;

          return (
            <div
              key={crypto.id}
              className="absolute group cursor-pointer transition-transform duration-300"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: `rotate(${Math.atan2(position.velocityY, position.velocityX) * (180 / Math.PI)}deg)`,
              }}
              onClick={() => {
                setSelectedCrypto(crypto);
                setDialogOpen(true);
              }}
            >
              <div className="relative">
                <Fish
                  className="text-white/80 group-hover:text-white"
                  style={{
                    width: size,
                    height: size,
                  }}
                />
                <img
                  src={logoMap[crypto.id] || `https://s3-symbol-logo.tradingview.com/crypto/XTVC${crypto.id}.svg`}
                  alt={`${crypto.name} logo`}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full bg-white/10 p-1"
                  onError={(e) => {
                    e.currentTarget.src = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedCrypto?.name} ({selectedCrypto?.id})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Performance vs BTC:</span>
              <span className={selectedCrypto?.performance >= 0 ? 'text-green-400' : 'text-red-400'}>
                {selectedCrypto?.performance.toFixed(2)}%
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>
        {`
          @keyframes bubble {
            0% {
              transform: translateY(100vh) scale(1);
              opacity: 0.8;
            }
            100% {
              transform: translateY(-100px) scale(1.5);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default CryptoOcean;