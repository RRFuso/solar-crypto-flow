import React, { useState, useEffect, useRef } from 'react';
import { Fish } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface CryptoData {
  id: string;
  name: string;
  performance: number;
  marketCap?: number;
  price?: number;
  totalSupply?: number;
}

interface CryptoOceanProps {
  cryptos: CryptoData[];
}

interface Position {
  x: number;
  y: number;
}

const CryptoOcean = ({ cryptos }: CryptoOceanProps) => {
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const [caughtFish, setCaughtFish] = useState<CryptoData[]>([]);
  const [positions, setPositions] = useState<Map<string, Position>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const clickTimestamps = useRef<Map<string, number>>(new Map());
  const { toast } = useToast();

  const getSize = (performance: number) => {
    const minSize = 24;
    const maxSize = 96;
    const normalizedSize = Math.max(minSize, Math.min(maxSize, (performance / 100) * maxSize));
    return Math.abs(normalizedSize);
  };

  const calculateInitialPositions = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const newPositions = new Map<string, Position>();
    const minDistance = 100; // Minimum distance between fish
    
    cryptos.forEach((crypto) => {
      let attempts = 0;
      let position: Position;
      
      do {
        position = {
          x: Math.random() * (width - 100) + 50,
          y: Math.random() * (height - 100) + 50
        };
        attempts++;
      } while (
        Array.from(newPositions.values()).some(pos => 
          Math.hypot(pos.x - position.x, pos.y - position.y) < minDistance
        ) && attempts < 100
      );
      
      newPositions.set(crypto.id, position);
    });
    
    setPositions(newPositions);
  };

  useEffect(() => {
    calculateInitialPositions();
    window.addEventListener('resize', calculateInitialPositions);
    return () => window.removeEventListener('resize', calculateInitialPositions);
  }, [cryptos]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleFishClick = (crypto: CryptoData) => {
    const now = Date.now();
    const lastClick = clickTimestamps.current.get(crypto.id) || 0;
    
    if (now - lastClick < 300) { // Double click detected (300ms threshold)
      if (!caughtFish.find(fish => fish.id === crypto.id)) {
        setCaughtFish([...caughtFish, crypto]);
        toast({
          title: `${crypto.name} capturado!`,
          description: "O peixe foi movido para o painel lateral.",
        });
      }
    }
    
    clickTimestamps.current.set(crypto.id, now);
  };

  const logoMap = {
    'PENDLE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/8409.png',
    'JUP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/25147.png'
  };

  return (
    <div className="flex gap-6">
      <div 
        ref={containerRef}
        className="flex-1 relative bg-gradient-to-b from-blue-900/90 via-blue-950 to-blue-900/90 rounded-lg p-8 min-h-[500px] overflow-hidden shadow-2xl border border-blue-800/30"
        onMouseMove={handleMouseMove}
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
          {cryptos
            .filter(crypto => !caughtFish.find(fish => fish.id === crypto.id))
            .map((crypto) => {
              const pos = positions.get(crypto.id);
              if (!pos) return null;

              const size = getSize(crypto.performance);
              const dx = mousePos.x - pos.x;
              const dy = mousePos.y - pos.y;
              const distance = Math.hypot(dx, dy);
              const repelStrength = Math.min(1, 100 / distance);
              
              const newX = pos.x - (dx * repelStrength * 0.1);
              const newY = pos.y - (dy * repelStrength * 0.1);
              
              return (
                <div
                  key={crypto.id}
                  className="absolute group cursor-pointer"
                  style={{
                    left: newX,
                    top: newY,
                    transition: 'all 0.3s ease-out',
                  }}
                  onClick={() => handleFishClick(crypto)}
                >
                  <div className="relative">
                    <Fish
                      className={`transform transition-all duration-300 ${
                        crypto.performance < 0 ? 'rotate-180' : ''
                      } text-white/80 group-hover:text-white`}
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
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white px-3 py-1.5 rounded-lg text-sm opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-300 transform group-hover:-translate-y-1">
                    <div className="font-bold">{crypto.name}</div>
                    <div className={crypto.performance >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {crypto.performance.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
          })}
        </div>
      </div>

      {/* Painel lateral de peixes capturados */}
      <div className="w-80 space-y-4">
        <h3 className="text-xl font-bold mb-4">Peixes Capturados</h3>
        {caughtFish.map((fish) => (
          <div key={fish.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={logoMap[fish.id] || `https://s3-symbol-logo.tradingview.com/crypto/XTVC${fish.id}.svg`}
                alt={`${fish.name} logo`}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';
                }}
              />
              <div>
                <h4 className="font-bold">{fish.name}</h4>
                <p className="text-sm text-gray-400">{fish.id}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p>Preço: ${fish.price?.toLocaleString() || 'N/A'}</p>
              <p>Cap. de Mercado: ${fish.marketCap?.toLocaleString() || 'N/A'}</p>
              <p>Supply Total: {fish.totalSupply?.toLocaleString() || 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>

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