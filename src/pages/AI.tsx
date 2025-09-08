
import React from 'react';
import { AdvancedAIDashboard } from '@/components/ai/AdvancedAIDashboard';
import { ExplosiveSignalsPanel } from '@/components/signals/ExplosiveSignalsPanel';
import AIAnalystPanel from '@/components/ai/AIAnalystPanel';
import AIChatPanel from '@/components/ai/AIChatPanel';

const AI: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            🔥 AI Explosive Signals
          </h1>
          <p className="text-muted-foreground text-lg">
            Máquina de detecção de explosões de preço em tempo real
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIAnalystPanel />
          <AIChatPanel />
        </div>

        <div className="grid gap-6">
          <ExplosiveSignalsPanel />
          <AdvancedAIDashboard />
        </div>
      </div>
    </div>
  );
};

export default AI;
