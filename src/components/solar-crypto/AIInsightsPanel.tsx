
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FlowData } from '@/types/crypto';
import { 
  AlertTriangle, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  Zap,
  ArrowRight
} from 'lucide-react';

interface AIInsightsPanelProps {
  timeframe: string;
  flowData: FlowData[];
}

// Mock AI insights based on flow data
const generateInsights = (flowData: FlowData[], timeframe: string) => {
  if (!flowData.length) return [];

  // Sort flows by value
  const sortedFlows = [...flowData].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  
  // Get top inflows and outflows
  const topInflows = sortedFlows.filter(flow => flow.percentage > 0).slice(0, 3);
  const topOutflows = sortedFlows.filter(flow => flow.percentage < 0).slice(0, 3);
  
  const insights = [];
  
  // Generate push/pull insights
  if (topInflows.length) {
    const flow = topInflows[0];
    insights.push({
      type: 'push',
      title: `Capital Push into ${flow.to.toUpperCase()}`,
      description: `Strong inflow detected from ${flow.from} to ${flow.to} (+${flow.percentage.toFixed(2)}%)`,
      severity: 'high',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'green'
    });
  }
  
  if (topOutflows.length) {
    const flow = topOutflows[0];
    insights.push({
      type: 'pull',
      title: `Capital Flight from ${flow.from.toUpperCase()}`,
      description: `Significant outflow from ${flow.from} to ${flow.to} (${flow.percentage.toFixed(2)}%)`,
      severity: 'medium',
      icon: <TrendingDown className="h-4 w-4" />,
      color: 'red'
    });
  }
  
  // Check for potential accumulation patterns
  const potentialAccumulation = sortedFlows.find(flow => 
    Math.abs(flow.percentage) < 3 && Math.abs(flow.value) > 5000000
  );
  
  if (potentialAccumulation) {
    insights.push({
      type: 'accumulation',
      title: `Potential Accumulation in ${potentialAccumulation.to}`,
      description: `High volume with stable price movement (±${Math.abs(potentialAccumulation.percentage).toFixed(1)}%)`,
      severity: 'medium',
      icon: <Sparkles className="h-4 w-4" />,
      color: 'blue'
    });
  }
  
  // Look for rapid reversals
  const rapidChanges = flowData.filter(flow => Math.abs(flow.percentage) > 15);
  
  if (rapidChanges.length) {
    insights.push({
      type: 'reversal',
      title: 'Potential Market Reversal',
      description: `${rapidChanges.length} assets with >15% flow changes in ${timeframe}`,
      severity: 'high',
      icon: <Zap className="h-4 w-4" />,
      color: 'yellow'
    });
  }
  
  // Generate anomaly alert if extreme outliers exist
  const anomalies = flowData.filter(flow => Math.abs(flow.percentage) > 30);
  
  if (anomalies.length) {
    insights.push({
      type: 'anomaly',
      title: 'Unusual Market Activity Detected',
      description: `Extreme flow detected in ${anomalies.length} assets, high volatility expected`,
      severity: 'critical',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'orange'
    });
  }
  
  // Add some specific category-based insights
  const stablecoins = flowData.filter(flow => 
    flow.fromCategory === 'stablecoin' || flow.toCategory === 'stablecoin'
  );
  
  if (stablecoins.length > 3) {
    const netInflow = stablecoins.reduce((sum, flow) => {
      return flow.toCategory === 'stablecoin' ? sum + flow.value : sum;
    }, 0);
    
    if (netInflow > 0) {
      insights.push({
        type: 'stablecoin',
        title: 'Stablecoin Inflow Increasing',
        description: 'Capital moving to stablecoins indicates potential market caution',
        severity: 'medium',
        icon: <TrendingDown className="h-4 w-4" />,
        color: 'blue'
      });
    }
  }
  
  return insights.slice(0, 5); // Limit to 5 insights
};

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ timeframe, flowData }) => {
  const insights = generateInsights(flowData, timeframe);
  
  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-700 text-green-100';
      case 'red': return 'bg-red-700 text-red-100';
      case 'blue': return 'bg-blue-700 text-blue-100';
      case 'yellow': return 'bg-yellow-700 text-yellow-100';
      case 'orange': return 'bg-orange-700 text-orange-100';
      default: return 'bg-gray-700 text-gray-100';
    }
  };
  
  if (!flowData.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No data available to generate insights
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {insights.length ? (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className="border border-gray-700 bg-gray-900/50 rounded-lg p-3 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <span className={`p-1.5 rounded-full ${getBadgeColor(insight.color)}`}>
                    {insight.icon}
                  </span>
                  {insight.title}
                </h3>
                <Badge variant="outline" className={getBadgeColor(insight.color)}>
                  {insight.severity}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-300">{insight.description}</p>
              
              {insight.type === 'push' || insight.type === 'pull' ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <span>Trade opportunity</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="text-blue-400">See analysis</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          Not enough data to generate AI insights
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
