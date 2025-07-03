
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { strategyTemplates, createStrategyFromTemplate, getAvailableTemplates } from '@/lib/autotrade/strategies/templates';
import { TradingStrategy } from '@/types/autotrade';
import { Target, TrendingUp, BarChart3, Zap } from 'lucide-react';

interface StrategyTemplatesProps {
  onSelectTemplate: (strategy: TradingStrategy) => void;
}

export const StrategyTemplates: React.FC<StrategyTemplatesProps> = ({ onSelectTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const templates = getAvailableTemplates();

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'macdMomentum':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'volatilityBreakout':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'meanReversion':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'aiPredictionTrader':
        return <BarChart3 className="w-5 h-5 text-purple-500" />;
      default:
        return <Target className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTemplateType = (templateId: string): string => {
    const template = strategyTemplates[templateId];
    switch (template?.signalType) {
      case 'priceAction':
        return 'Ação de Preço';
      case 'aiPrediction':
        return 'Predição IA';
      case 'flowAnalysis':
        return 'Análise de Fluxo';
      default:
        return 'Combinado';
    }
  };

  const getRiskLevel = (templateId: string): { level: string; color: string } => {
    const template = strategyTemplates[templateId];
    const stopLoss = template?.stopLoss.value || 0;
    
    if (stopLoss <= 1.5) return { level: 'Baixo', color: 'bg-green-500' };
    if (stopLoss <= 2.5) return { level: 'Médio', color: 'bg-yellow-500' };
    return { level: 'Alto', color: 'bg-red-500' };
  };

  const handleSelectTemplate = (templateId: string) => {
    try {
      const strategy = createStrategyFromTemplate(templateId);
      onSelectTemplate(strategy);
    } catch (error) {
      console.error('Erro ao criar estratégia:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Templates de Estratégias</CardTitle>
          <p className="text-sm text-slate-400">
            Escolha um template pré-configurado para começar rapidamente
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const riskLevel = getRiskLevel(template.id);
          const templateType = getTemplateType(template.id);
          const fullTemplate = strategyTemplates[template.id];
          
          return (
            <Card 
              key={template.id}
              className={`bg-slate-900/50 border-slate-700/50 cursor-pointer transition-all duration-200 hover:border-orange-500/50 ${
                selectedTemplate === template.id ? 'border-orange-500' : ''
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getTemplateIcon(template.id)}
                    <div>
                      <h3 className="font-medium text-white">{template.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {templateType}
                        </Badge>
                        <Badge className={`text-xs text-white ${riskLevel.color}`}>
                          Risco {riskLevel.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-slate-400 mb-4">
                  {template.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Stop Loss:</span>
                    <span className="text-white">{fullTemplate?.stopLoss.value}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Take Profit:</span>
                    <span className="text-white">
                      {fullTemplate?.takeProfit.targets[0]?.priceTarget}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Posições Max:</span>
                    <span className="text-white">{fullTemplate?.maxPositions}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Símbolos:</span>
                    <span className="text-white">{fullTemplate?.symbols.length}</span>
                  </div>
                </div>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTemplate(template.id);
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white"
                  size="sm"
                >
                  Usar Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTemplate && (
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Detalhes da Estratégia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-white mb-2">Condições de Entrada</h4>
                <div className="space-y-1">
                  {strategyTemplates[selectedTemplate]?.entryConditions.map((condition, index) => (
                    <div key={index} className="text-sm text-slate-300">
                      • {condition.type} {condition.operator} {condition.value} (peso: {condition.weight})
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Condições de Saída</h4>
                <div className="space-y-1">
                  {strategyTemplates[selectedTemplate]?.exitConditions.map((condition, index) => (
                    <div key={index} className="text-sm text-slate-300">
                      • {condition.type} {condition.operator} {condition.value} (peso: {condition.weight})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StrategyTemplates;
