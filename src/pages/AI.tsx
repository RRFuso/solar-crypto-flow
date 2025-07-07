
import React from 'react';
import { AdvancedAIDashboard } from '@/components/ai/AdvancedAIDashboard';
import { OnChainInsightsPanel } from '@/components/onchain/OnChainInsightsPanel';

const AI: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdvancedAIDashboard />
      <div>
        <h2 className="text-2xl font-bold mb-4">Análise On-Chain Detalhada</h2>
        <OnChainInsightsPanel symbol="ETH" />
      </div>
    </div>
  );
};

export default AI;
