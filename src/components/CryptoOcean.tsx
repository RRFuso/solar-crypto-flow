import React from 'react';
import { Shark } from 'lucide-react';

interface CryptoOceanProps {
  cryptos: Array<{
    id: string;
    name: string;
    performance: number;
  }>;
}

const CryptoOcean = ({ cryptos }: CryptoOceanProps) => {
  const getSize = (performance: number) => {
    const minSize = 24;
    const maxSize = 96;
    const normalizedSize = Math.max(minSize, Math.min(maxSize, (performance / 100) * maxSize));
    return Math.abs(normalizedSize);
  };

  const getRandomPosition = () => {
    return {
      left: `${Math.random() * 80 + 10}%`,
      top: `${Math.random() * 80 + 10}%`,
    };
  };

  return (
    <div className="mt-8 relative bg-gradient-to-b from-blue-900/90 via-blue-950 to-blue-900/90 rounded-lg p-8 min-h-[500px] overflow-hidden shadow-2xl border border-blue-800/30">
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
          const randomPos = getRandomPosition();
          const size = getSize(crypto.performance);
          const duration = Math.random() * 20 + 20;
          const delay = -Math.random() * 20;
          
          return (
            <div
              key={crypto.id}
              className="absolute group"
              style={{
                ...randomPos,
                animation: `swim-complex ${duration}s infinite ease-in-out`,
                animationDelay: `${delay}s`,
              }}
            >
              <Shark
                className={`transform transition-all duration-300 ${
                  crypto.performance < 0 ? 'rotate-180' : ''
                } text-white/80 group-hover:text-white`}
                style={{
                  width: size,
                  height: size,
                }}
              />
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

          @keyframes swim-complex {
            0% {
              transform: translate(0, 0) rotate(5deg);
            }
            25% {
              transform: translate(30px, 30px) rotate(-5deg);
            }
            50% {
              transform: translate(0, 60px) rotate(5deg);
            }
            75% {
              transform: translate(-30px, 30px) rotate(-5deg);
            }
            100% {
              transform: translate(0, 0) rotate(5deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default CryptoOcean;