import React from 'react';
import { Fish } from 'lucide-react';
import { cn } from "@/lib/utils";

interface FishSpriteProps {
  size: number;
  performance: number;
  rotation: number;
  logoUrl: string;
  isEating?: boolean;
  onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const FishSprite = ({ size, performance, rotation, logoUrl, isEating, onError }: FishSpriteProps) => {
  const isPositive = performance >= 0;
  
  return (
    <div
      className={cn(
        "relative group transition-transform duration-300",
        isEating && "animate-pulse"
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <Fish
        className={cn(
          "text-white/80 group-hover:text-white transition-colors",
          isEating && "text-red-400/80 group-hover:text-red-400"
        )}
        style={{
          width: size,
          height: size,
        }}
      />
      <img
        src={logoUrl}
        alt="Crypto logo"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full bg-white/10 p-1"
        onError={onError}
      />
      <div 
        className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          "font-bold text-xs md:text-sm whitespace-nowrap px-1 rounded",
          isPositive ? "text-green-400" : "text-red-400"
        )}
        style={{
          fontSize: `${size * 0.2}px`,
        }}
      >
        {performance >= 0 ? '+' : ''}{performance.toFixed(1)}%
      </div>
    </div>
  );
};