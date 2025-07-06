import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

interface TooltipData {
  id: string;
  name?: string;
  price?: string;
  priceChange24h?: number;
  aiAnalysis?: {
    recommendation: string;
    confidence: number;
  };
  explosivePotential?: string;
  keyFactors?: string[];
}

interface UnifiedTooltipProps {
  data: TooltipData | null;
  position: { x: number; y: number };
}

const getRecommendationVariant = (recommendation: string): "default" | "destructive" | "outline" => {
  if (recommendation.includes('buy')) return 'default';
  if (recommendation.includes('sell')) return 'destructive';
  return 'outline';
}

export const UnifiedTooltip: React.FC<UnifiedTooltipProps> = ({ data, position }) => {
  if (!data) return null;

  return (
    <div
      className="absolute z-50 p-2 transition-opacity duration-200"
      style={{
        left: position.x + 15,
        top: position.y + 15,
        pointerEvents: 'none',
      }}
    >
      <Card className="w-64 bg-slate-900/80 backdrop-blur-sm border-slate-700 text-white shadow-2xl">
        <CardHeader className="p-3">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>{data.id}</span>
            {data.name && <span className="text-sm text-slate-400">{data.name}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Price:</span>
            <span>{data.price ? `$${parseFloat(data.price).toLocaleString()}` : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">24h Change:</span>
            <span className={data.priceChange24h && data.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}>
              {data.priceChange24h?.toFixed(2) ?? 'N/A'}%
            </span>
          </div>
          {data.aiAnalysis && (
            <div className="border-t border-slate-700 pt-2 mt-2">
              <h4 className="font-bold text-slate-300 mb-1">AI Analysis</h4>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Recommendation:</span>
                <Badge variant={getRecommendationVariant(data.aiAnalysis.recommendation)}>
                  {data.aiAnalysis.recommendation.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span>{data.aiAnalysis.confidence.toFixed(1)}%</span>
              </div>
            </div>
          )}
          {data.explosivePotential === 'High' && (
            <div className="border-t border-slate-700 pt-2 mt-2">
              <h4 className="font-bold text-yellow-400 mb-1">🔥 High Explosive Potential</h4>
              {data.keyFactors && (
                <div>
                  <span className="text-slate-400">Key Factors:</span>
                  <ul className="list-disc list-inside text-xs pl-2">
                    {data.keyFactors.map((factor, i) => <li key={i}>{factor}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
