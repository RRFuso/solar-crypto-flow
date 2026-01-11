
import React, { memo, Suspense, lazy, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDisclaimer } from './LegalDisclaimer';

// Lazy load chat panel for performance
const AIChatPanel = lazy(() => import('../../ai/AIChatPanel'));

const ChatSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'} rounded-lg`} />
        </div>
      ))}
    </div>
    <Skeleton className="h-12 w-full" />
  </div>
);

interface SolarAnalystSectionProps {
  isFloating?: boolean;
}

const SolarAnalystSection: React.FC<SolarAnalystSectionProps> = ({ 
  isFloating = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isFloating) {
    // Embedded version (full height)
    return (
      <div className="h-full flex flex-col bg-gray-900 border border-slate-700 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-700 bg-gradient-to-r from-purple-900/50 to-pink-900/50 text-center">
          <h3 className="font-semibold text-white text-lg">Analista Solar</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<ChatSkeleton />}>
            <AIChatPanel />
          </Suspense>
        </div>
        <div className="p-2 border-t border-slate-700">
          <LegalDisclaimer variant="minimal" />
        </div>
      </div>
    );
  }

  // Floating version
  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Floating chat panel */}
      {isOpen && (
        <div 
          className={`fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 transition-all duration-300 ${
            isMinimized 
              ? 'bottom-4 right-4 w-72 h-14' 
              : 'bottom-4 right-4 w-96 h-[500px] max-h-[70vh]'
          }`}
        >
          {/* Header */}
          <div className="p-3 border-b border-slate-700 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <h3 className="font-semibold text-white text-sm">Analista Solar</h3>
                {!isMinimized && (
                  <p className="text-[10px] text-slate-400">Assistente educativo</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="flex flex-col h-[calc(100%-56px)]">
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<ChatSkeleton />}>
                  <AIChatPanel />
                </Suspense>
              </div>
              <div className="p-2 border-t border-slate-700">
                <LegalDisclaimer variant="minimal" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default memo(SolarAnalystSection);
