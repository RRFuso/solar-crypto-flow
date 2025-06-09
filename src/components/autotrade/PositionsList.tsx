
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Position } from '@/types/autotrade';
import { TrendingUp, TrendingDown, X, Clock } from 'lucide-react';

interface PositionsListProps {
  positions: Position[];
  onClosePosition: (positionId: string) => void;
  compact?: boolean;
}

export const PositionsList: React.FC<PositionsListProps> = ({
  positions,
  onClosePosition,
  compact = false
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeSinceOpen = (openTime: number) => {
    const now = Date.now();
    const diff = now - openTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (positions.length === 0) {
    return (
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Open Positions</h3>
          <p className="text-slate-400">
            Your open positions will appear here when AutoTrade creates them
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/30 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Open Positions ({positions.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map(position => (
            <div
              key={position.id}
              className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div>
                    <h4 className="font-medium text-white">{position.symbol}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={position.side === 'long' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {position.side.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {getTimeSinceOpen(position.openTime)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      {position.unrealizedPnl >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`font-medium ${
                        position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {formatCurrency(position.unrealizedPnl)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {position.unrealizedPnlPercentage.toFixed(2)}%
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onClosePosition(position.id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!compact && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Amount</p>
                    <p className="text-white">{position.amount.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Entry Price</p>
                    <p className="text-white">{formatCurrency(position.entryPrice)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Current Price</p>
                    <p className="text-white">{formatCurrency(position.currentPrice)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Opened</p>
                    <p className="text-white">{formatTime(position.openTime)}</p>
                  </div>
                </div>
              )}

              {position.stopLoss && position.takeProfit && (
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Stop Loss</p>
                    <p className="text-red-400">{formatCurrency(position.stopLoss)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Take Profit</p>
                    <p className="text-green-400">{formatCurrency(position.takeProfit)}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
