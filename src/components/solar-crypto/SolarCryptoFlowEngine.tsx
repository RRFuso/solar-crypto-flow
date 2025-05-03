
import React, { useState } from 'react';
import { useMockFlowData } from '@/hooks/solar-crypto/useMockFlowData';
import FlowMatrixVisualization from './FlowMatrixVisualization';
import CryptoGravityIndex from './CryptoGravityIndex';
import AIInsightsPanel from './AIInsightsPanel';
import CapitalMigrationChart from './CapitalMigrationChart';
import { FlowData } from '@/types/crypto';

const SolarCryptoFlowEngine = () => {
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { flowData, isLoading, cryptoMetrics } = useMockFlowData(timeframe);
  
  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          SolarCripto Flow Engine + AI Module
        </h1>
        <div className="flex gap-2">
          <select 
            className="bg-black/30 border border-gray-700 rounded-md px-3 py-1 text-sm"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="15m">15 minutes</option>
            <option value="1h">1 hour</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
          </select>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Flow visualization */}
        <div className="lg:col-span-2 bg-black/30 border border-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Capital Flow Visualization</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <FlowMatrixVisualization 
              flowData={flowData} 
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          )}
        </div>
        
        {/* Right column - Metrics and AI insights */}
        <div className="flex flex-col gap-6">
          {/* AI Insights Panel */}
          <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">AI Insights</h2>
            <AIInsightsPanel timeframe={timeframe} flowData={flowData} />
          </div>
          
          {/* Crypto Gravity Index */}
          <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Crypto Gravity Index (CGI)</h2>
            <CryptoGravityIndex cryptoMetrics={cryptoMetrics} />
          </div>
          
          {/* Capital Migration Chart */}
          <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Capital Migration Index (CMI)</h2>
            <CapitalMigrationChart flowData={flowData} timeframe={timeframe} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarCryptoFlowEngine;
