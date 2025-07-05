
import React, { useState } from 'react';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, AlertTriangle, Brain, Target, Shield, Clock, Zap } from 'lucide-react';
import { ExplosiveWatchPanel } from './ExplosiveWatchPanel';

export const AdvancedAIDashboard: React.FC = () => {
  const [selectedSymbols] = useState(['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI']);
  const [selectedTimeframe] = useState('4h');
  
  const {
    insights,
    isLoading,
    error,
    lastUpdate,
    refreshInsights,
    getTopOpportunities,
    getHighRiskAssets,
    getInsightsByRecommendation
  } = useAdvancedAI(selectedSymbols, selectedTimeframe);

  const topOpportunities = getTopOpportunities(65);
  const highRiskAssets = getHighRiskAssets(65);
  const strongBuys = getInsightsByRecommendation('strong_buy');
  const strongSells = getInsightsByRecommendation('strong_sell');

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy': return 'bg-green-600';
      case 'buy': return 'bg-green-500';
      case 'hold': return 'bg-yellow-500';
      case 'sell': return 'bg-red-500';
      case 'strong_sell': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy':
      case 'buy':
        return <TrendingUp className="w-4 h-4" />;
      case 'sell':
      case 'strong_sell':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">AI Analysis Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={refreshInsights} variant="outline">
          Retry Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold">Advanced AI Market Intelligence</h1>
            <p className="text-gray-600">
              {lastUpdate 
                ? `Last updated: ${lastUpdate.toLocaleTimeString()}`
                : 'Initializing AI analysis...'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refreshInsights} disabled={isLoading} variant="outline">
            {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
          {isLoading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />}
        </div>
      </div>

      {/* Overview Cards & Explosive Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Top Opportunities</p>
                    <p className="text-2xl font-bold text-green-600">{topOpportunities.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Strong Buys</p>
                    <p className="text-2xl font-bold text-blue-600">{strongBuys.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">High Risk</p>
                    <p className="text-2xl font-bold text-red-600">{highRiskAssets.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Assets Analyzed</p>
                    <p className="text-2xl font-bold text-purple-600">{insights.size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <ExplosiveWatchPanel />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="insights">Deep Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Top Trading Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topOpportunities.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No high-confidence opportunities found</p>
                ) : (
                  topOpportunities.map((insight) => (
                    <div key={insight.symbol} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{insight.symbol}</h3>
                          <Badge className={`${getRecommendationColor(insight.recommendation)} text-white`}>
                            {getRecommendationIcon(insight.recommendation)}
                            <span className="ml-1">{insight.recommendation.replace('_', ' ').toUpperCase()}</span>
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Confidence</p>
                          <p className="text-lg font-bold">{Math.round(insight.confidence)}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Opportunity Score</p>
                          <Progress value={insight.opportunityScore} className="mt-1" />
                          <p className="text-xs text-right mt-1">{Math.round(insight.opportunityScore)}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Risk Score</p>
                          <Progress value={insight.riskScore} className="mt-1" />
                          <p className="text-xs text-right mt-1">{Math.round(insight.riskScore)}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Explosive Potential</p>
                          <Progress value={insight.features.explosivePotential} className="mt-1" />
                          <p className="text-xs text-right mt-1">{Math.round(insight.features.explosivePotential)}/100</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Key Patterns</p>
                          <div className="space-y-1">
                            {insight.patterns.slice(0, 2).map((pattern, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {pattern.pattern}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Next 24h Prediction</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              insight.predictions.find(p => p.horizon === '1d')?.direction === 'bullish' 
                                ? 'text-green-600' 
                                : insight.predictions.find(p => p.horizon === '1d')?.direction === 'bearish'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}>
                              {insight.predictions.find(p => p.horizon === '1d')?.direction?.toUpperCase() || 'NEUTRAL'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({Math.round(insight.predictions.find(p => p.horizon === '1d')?.confidence || 0)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Multi-Horizon Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array.from(insights.values()).slice(0, 5).map((insight) => (
                  <div key={insight.symbol} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">{insight.symbol}</h3>
                    <div className="grid grid-cols-5 gap-4">
                      {insight.predictions.map((prediction) => (
                        <div key={prediction.horizon} className="text-center">
                          <p className="text-sm text-gray-600 mb-2">{prediction.horizon}</p>
                          <div className={`p-2 rounded-lg ${
                            prediction.direction === 'bullish' ? 'bg-green-100 text-green-800' :
                            prediction.direction === 'bearish' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            <p className="text-xs font-medium">{prediction.direction.toUpperCase()}</p>
                            <p className="text-lg font-bold">{Math.round(prediction.confidence)}%</p>
                            <p className="text-xs">
                              {prediction.expectedMove > 0 ? '+' : ''}{prediction.expectedMove.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Pattern Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(insights.values())
                  .filter(insight => insight.patterns.length > 0)
                  .map((insight) => (
                    <div key={insight.symbol} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">{insight.symbol}</h3>
                        <Badge variant="outline">{insight.patterns.length} patterns detected</Badge>
                      </div>
                      <div className="space-y-2">
                        {insight.patterns.map((pattern, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{pattern.pattern}</p>
                              <p className="text-sm text-gray-600">{pattern.description}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={`${
                                pattern.implication === 'bullish' ? 'bg-green-500' :
                                pattern.implication === 'bearish' ? 'bg-red-500' :
                                'bg-gray-500'
                              } text-white`}>
                                {pattern.implication}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">{pattern.confidence}% confidence</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {highRiskAssets.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No high-risk assets detected</p>
                ) : (
                  highRiskAssets.map((insight) => (
                    <div key={insight.symbol} className="border rounded-lg p-4 border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">{insight.symbol}</h3>
                        <Badge className="bg-red-600 text-white">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          HIGH RISK
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Risk Score</p>
                          <Progress value={insight.riskScore} className="mt-1" />
                          <p className="text-xs text-right mt-1 text-red-600">{Math.round(insight.riskScore)}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Volatility Regime</p>
                          <Badge variant={insight.features.volatilityRegime === 'extreme' ? 'destructive' : 'secondary'}>
                            {insight.features.volatilityRegime.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-red-50 p-3 rounded">
                        <p className="text-sm font-medium text-red-800 mb-2">Risk Factors:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {insight.predictions[0]?.riskFactors.map((factor, idx) => (
                            <li key={idx} className="text-sm text-red-700">{factor}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from(insights.values()).slice(0, 4).map((insight) => (
              <Card key={insight.symbol}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{insight.symbol}</span>
                    <Badge className={`${getRecommendationColor(insight.recommendation)} text-white`}>
                      {insight.recommendation.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Bullish Score</p>
                      <p className="text-xl font-bold text-green-600">{Math.round(insight.features.bullishScore)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bearish Score</p>
                      <p className="text-xl font-bold text-red-600">{Math.round(insight.features.bearishScore)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Key Factors:</p>
                    <div className="space-y-1">
                      {insight.predictions[0]?.keyFactors.slice(0, 3).map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Technical Analysis:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>RSI: {insight.marketData[insight.marketData.length - 1]?.rsi.toFixed(1)}</div>
                      <div>EMA Alignment: {(insight.features.emaAlignment * 100).toFixed(1)}%</div>
                      <div>Volume Breakout: {insight.features.volumeBreakout.toFixed(1)}x</div>
                      <div>Trend Strength: {insight.features.trendStrength.toFixed(1)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
