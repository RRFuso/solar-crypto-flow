import React, { useState, useEffect } from 'react';
import { AIAnalysisResult } from '@/types/ai_analyst';
import { analyzeAndGenerateSignals } from '@/lib/ai_analyst';
import AIChatPanel from './AIChatPanel';

const AIAnalystPanel: React.FC = () => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const result = await analyzeAndGenerateSignals();
        setAnalysis(result);
      } catch (err) {
        setError('Failed to fetch AI analysis.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  if (loading) {
    return <div>Loading AI Analyst...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!analysis) {
    return <div>No analysis available.</div>;
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4">AI Analyst</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Market Summary</h3>
        <p className="text-gray-300">{analysis.marketSummary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Entry Signals</h3>
          <div className="space-y-4">
            {analysis.entrySignals.map((signal, index) => (
              <div key={index} className="p-4 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">{signal.asset}</span>
                  <span className="text-green-400">Confidence: {Math.round(signal.confidence * 100)}%</span>
                </div>
                <p>Entry Price: ${signal.suggestedEntryPrice}</p>
                <p className="text-sm text-gray-400 mt-2">{signal.justification}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Exit Signals</h3>
          <div className="space-y-4">
            {analysis.exitSignals.map((signal, index) => (
              <div key={index} className="p-4 bg-gray-700 rounded-lg">
                <div className="font-bold text-lg">{signal.asset}</div>
                <p>Exit Price: ${signal.suggestedExitPrice}</p>
                <p className="text-sm text-gray-400 mt-2">{signal.justification}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AIChatPanel />
    </div>
  );
};

export default AIAnalystPanel;
