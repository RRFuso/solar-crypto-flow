
import React, { memo, Suspense, lazy } from 'react';
import { Prediction } from '@/lib/aiModel';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDisclaimer } from './LegalDisclaimer';

// Lazy load AIWatchlist for better performance
const AIWatchlist = lazy(() => import('../../ai/AIWatchlist'));

interface AIWatchlistSectionProps {
  predictions: Prediction[];
  chartTimeframe: string;
  maxItems?: number;
}

const AIWatchlistSkeleton = () => (
  <div className="p-4 space-y-4">
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-10 w-full" />
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  </div>
);

const AIWatchlistSection: React.FC<AIWatchlistSectionProps> = ({
  predictions,
  chartTimeframe,
  maxItems = 15,
}) => {
  return (
    <div className="h-full flex flex-col bg-black border border-gray-700 rounded-lg overflow-hidden">
      <Suspense fallback={<AIWatchlistSkeleton />}>
        <AIWatchlist 
          predictions={predictions} 
          maxItems={maxItems} 
          chartTimeframe={chartTimeframe}
        />
      </Suspense>
      
      {/* Legal disclaimer at bottom */}
      <div className="p-2 border-t border-gray-700">
        <LegalDisclaimer variant="minimal" />
      </div>
    </div>
  );
};

export default memo(AIWatchlistSection);
