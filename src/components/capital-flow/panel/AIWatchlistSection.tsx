import React, { memo, Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDisclaimer } from './LegalDisclaimer';

// Lazy load WhaleGalaxyPanel for better performance
const WhaleGalaxyPanel = lazy(() => import('../../ai/WhaleGalaxyPanel'));

interface WhaleGalaxySectionProps {
  maxItems?: number;
}

const WhaleGalaxySkeleton = () => (
  <div className="p-4 space-y-4">
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-10 w-full" />
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const WhaleGalaxySection: React.FC<WhaleGalaxySectionProps> = ({
  maxItems = 15,
}) => {
  return (
    <div className="h-full flex flex-col bg-black border border-gray-700 rounded-lg overflow-hidden">
      <Suspense fallback={<WhaleGalaxySkeleton />}>
        <WhaleGalaxyPanel maxItems={maxItems} />
      </Suspense>
      
      {/* Legal disclaimer at bottom */}
      <div className="p-2 border-t border-gray-700">
        <LegalDisclaimer variant="minimal" />
      </div>
    </div>
  );
};

export default memo(WhaleGalaxySection);
