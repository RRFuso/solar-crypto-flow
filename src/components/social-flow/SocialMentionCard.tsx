
import React from 'react';
import { TrendingUp, TrendingDown, MessageCircle } from 'lucide-react';
import { CryptoMention } from '@/types/social';

interface SocialMentionCardProps {
  rank: number;
  mention: CryptoMention;
  compact?: boolean;
}

const SocialMentionCard = ({ rank, mention, compact = false }: SocialMentionCardProps) => {
  const getTrendIcon = () => {
    if (mention.trend > 0) {
      return <TrendingUp className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-green-500`} />;
    } else if (mention.trend < 0) {
      return <TrendingDown className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-red-500`} />;
    }
    return null;
  };

  if (compact) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center">
        <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-sm font-bold mr-3">
          {rank}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{mention.symbol}</span>
              {getTrendIcon()}
            </div>
            <div className="flex items-center text-gray-400 text-xs">
              <MessageCircle className="w-3 h-3 mr-1" />
              {mention.count.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 -mr-6 -mt-6 rounded-full bg-purple-500/10 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center text-lg font-bold">
          {rank}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xl font-bold">{mention.symbol}</h3>
        <span className="text-sm text-gray-400">{mention.name}</span>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <span className="text-lg font-bold">{mention.count.toLocaleString()}</span>
        </div>
        {getTrendIcon() && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={`text-sm font-semibold ${mention.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(mention.trend)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <div className="text-xs text-gray-400 mb-1">Sentimento</div>
        <div className="w-full h-2 bg-gray-700 rounded-full">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-green-500" 
            style={{ width: `${mention.sentiment * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>Negativo</span>
          <span>Positivo</span>
        </div>
      </div>
    </div>
  );
};

export default SocialMentionCard;
