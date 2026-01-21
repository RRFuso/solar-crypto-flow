
import React, { memo, Suspense, lazy, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDisclaimer } from './LegalDisclaimer';

// Lazy load HeliusOracleChat for performance
const HeliusOracleChat = lazy(() => import('../../ai/HeliusOracleChat'));

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
    // Embedded version (full height) - Using HeliusOracleChat
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <Suspense fallback={<ChatSkeleton />}>
          <HeliusOracleChat className="h-full" />
        </Suspense>
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
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Floating chat panel */}
      {isOpen && (
        <div 
          className={`fixed z-50 bg-black border border-gray-800 rounded-xl shadow-2xl shadow-black/50 transition-all duration-300 ${
            isMinimized 
              ? 'bottom-4 right-4 w-72 h-14' 
              : 'bottom-4 right-4 w-[400px] h-[550px] max-h-[75vh]'
          }`}
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-800 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/SOLCRY.webp" alt="Helius Oracle" className="w-8 h-8" />
              <div>
                <h3 className="font-bold text-white text-sm">Helius Oracle</h3>
                {!isMinimized && (
                  <p className="text-[10px] text-gray-400">Análise de mercado em tempo real</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-white"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="flex flex-col h-[calc(100%-56px)]">
              <Suspense fallback={<ChatSkeleton />}>
                <HeliusOracleChat className="h-full border-0 rounded-none" />
              </Suspense>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default memo(SolarAnalystSection);
