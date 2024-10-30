import React, { useState } from 'react';
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

const CryptoOcean = ({ cryptos }: CryptoOceanProps) => {
  const [selectedCrypto, setSelectedCrypto] = useState<(typeof cryptos)[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getSize = (performance: number) => {
    const minSize = 24;
    const maxSize = 96;
    const normalizedSize = Math.max(minSize, Math.min(maxSize, (performance / 100) * maxSize));
    return Math.abs(normalizedSize);
  };

  // Distribuição melhorada dos peixes em uma grade
  const getGridPosition = (index: number) => {
    const columns = Math.ceil(Math.sqrt(cryptos.length));
    const rows = Math.ceil(cryptos.length / columns);
    
    const cellWidth = 90 / columns; // Usando 90% da largura para margem
    const cellHeight = 90 / rows; // Usando 90% da altura para margem
    
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    // Adiciona uma variação aleatória menor dentro da célula
    const randomX = (Math.random() - 0.5) * (cellWidth * 0.3);
    const randomY = (Math.random() - 0.5) * (cellHeight * 0.3);
    
    return {
      left: `${5 + col * cellWidth + cellWidth/2 + randomX}%`,
      top: `${5 + row * cellHeight + cellHeight/2 + randomY}%`,
    };
  };

  const logoMap = {
    'PENDLE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/8409.png',
    'JUP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/25147.png'
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
          const size = getSize(crypto.performance);
          const duration = Math.random() * 20 + 20;
          const delay = -Math.random() * 20;
          const gridPos = getGridPosition(index);
          
          return (
            <div
              key={crypto.id}
              className="absolute group cursor-pointer"
              style={{
                ...gridPos,
                animation: `swim-complex ${duration}s infinite ease-in-out`,
                animationDelay: `${delay}s`,
              }}
              onClick={() => {
                setSelectedCrypto(crypto);
                setDialogOpen(true);
              }}
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