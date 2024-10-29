import React from 'react';
import { Fish, Waves } from 'lucide-react';

interface CryptoOceanProps {
  cryptos: Array<{
    id: string;
    name: string;
    performance: number;
  }>;
}

const CryptoOcean = ({ cryptos }: CryptoOceanProps) => {
  // Normaliza os valores de performance para tamanhos entre 16 e 64 pixels
  const getSize = (performance: number) => {
    const minSize = 16;
    const maxSize = 64;
    const normalizedSize = Math.max(minSize, Math.min(maxSize, (performance / 100) * maxSize));
    return Math.abs(normalizedSize);
  };

  return (
    <div className="mt-8 relative bg-gradient-to-b from-blue-900 to-blue-950 rounded-lg p-8 min-h-[300px] overflow-hidden">
      <div className="absolute top-0 left-0 w-full">
        <Waves className="w-full h-12 text-blue-400/20" />
      </div>
      
      <div className="relative z-10 flex flex-wrap gap-4 justify-center items-center">
        {cryptos.map((crypto) => (
          <div
            key={crypto.id}
            className="group relative transition-all duration-500 hover:scale-110"
            style={{
              animation: `swim ${Math.random() * 5 + 5}s infinite ease-in-out`,
            }}
          >
            <Fish
              className={`transform ${crypto.performance < 0 ? 'rotate-180' : ''} text-white/80`}
              style={{
                width: getSize(crypto.performance),
                height: getSize(crypto.performance),
              }}
            />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/75 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
              {crypto.name}: {crypto.performance.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes swim {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
};

export default CryptoOcean;