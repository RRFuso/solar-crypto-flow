import React from 'react';
import { Coins, TrendingUp } from 'lucide-react';

const CryptoCard = ({ crypto, onClick }) => {
  return (
    <div
      className="bg-gray-900 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-800 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <Coins className="w-10 h-10 text-yellow-400" />
        <span className="text-2xl font-bold">{crypto.id}</span>
      </div>
      <h3 className="text-xl mb-2">{crypto.name}</h3>
      <div className="flex items-center text-green-400">
        <TrendingUp className="w-5 h-5 mr-2" />
        <span>{crypto.performance.toFixed(2)}% vs BTC</span>
      </div>
    </div>
  );
};

export default CryptoCard;