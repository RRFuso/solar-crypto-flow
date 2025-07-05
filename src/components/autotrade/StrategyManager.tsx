
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradingStrategy, SignalCondition } from '@/types/autotrade';
import { Plus, Edit, Trash2, Target, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface StrategyManagerProps {
  strategies: TradingStrategy[];
  onAddStrategy: (strategy: TradingStrategy) => void;
  onUpdateStrategy: (id: string, updates: Partial<TradingStrategy>) => void;
  onRemoveStrategy: (id: string) => void;
}

export const StrategyManager: React.FC<StrategyManagerProps> = ({
  strategies,
  onAddStrategy,
  onUpdateStrategy,
  onRemoveStrategy
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<TradingStrategy | null>(null);

  const defaultStrategy: Partial<TradingStrategy> = {
    name: '',
    description: '',
    enabled: true,
    signalType: 'combined',
    entryConditions: [
      {
        type: 'confidence',
        operator: 'gte',
        value: 0.7,
        weight: 1
      }
    ],
    exitConditions: [],
    positionSize: {
      type: 'percentage',
      value: 2,
      maxRisk: 1
    },
    stopLoss: {
      enabled: true,
      type: 'percentage',
      value: 5
    },
    takeProfit: {
      enabled: true,
      targets: [
        { percentage: 50, priceTarget: 10 },
        { percentage: 50, priceTarget: 20 }
      ]
    },
    maxPositions: 1,
    symbols: ['BTC', 'ETH']
  };

  const handleCreateStrategy = (formData: any) => {
    const strategy: TradingStrategy = {
      id: `strategy_${Date.now()}`,
      ...defaultStrategy,
      ...formData
    } as TradingStrategy;

    onAddStrategy(strategy);
    setIsCreating(false);
    toast.success('Strategy created successfully');
  };

  const handleUpdateStrategy = (strategy: TradingStrategy, updates: any) => {
    onUpdateStrategy(strategy.id, updates);
    setEditingStrategy(null);
    toast.success('Strategy updated successfully');
  };

  const StrategyCard = ({ strategy }: { strategy: TradingStrategy }) => (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-lg">{strategy.name}</CardTitle>
            <p className="text-sm text-slate-400">{strategy.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={strategy.enabled}
              onCheckedChange={(enabled) => onUpdateStrategy(strategy.id, { enabled })}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingStrategy(strategy)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveStrategy(strategy.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-400">Signal Type</p>
            <Badge variant="outline">{strategy.signalType}</Badge>
          </div>
          <div>
            <p className="text-sm text-slate-400">Symbols</p>
            <p className="text-sm text-white">{strategy.symbols.join(', ')}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Position Size</p>
            <p className="text-sm text-white">
              {strategy.positionSize.value}
              {strategy.positionSize.type === 'percentage' ? '%' : strategy.positionSize.type === 'fixed' ? ' USD' : '% risk'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Stop Loss</p>
            <p className="text-sm text-white">
              {strategy.stopLoss.enabled ? `${strategy.stopLoss.value}%` : 'Disabled'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StrategyForm = ({ 
    strategy, 
    onSave, 
    onCancel 
  }: { 
    strategy?: TradingStrategy; 
    onSave: (data: any) => void; 
    onCancel: () => void; 
  }) => {
    const [formData, setFormData] = useState(strategy || defaultStrategy);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Strategy Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter strategy name"
            />
          </div>
          <div>
            <Label htmlFor="signalType">Signal Type</Label>
            <Select
              value={formData.signalType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, signalType: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priceAction">Price Action</SelectItem>
                <SelectItem value="aiPrediction">AI Prediction</SelectItem>
                <SelectItem value="flowAnalysis">Flow Analysis</SelectItem>
                <SelectItem value="combined">Combined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter strategy description"
          />
        </div>

        <div>
          <Label htmlFor="symbols">Symbols (comma-separated)</Label>
          <Input
            id="symbols"
            value={formData.symbols?.join(', ')}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              symbols: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            }))}
            placeholder="BTC, ETH, ADA"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="positionType">Position Size Type</Label>
            <Select
              value={formData.positionSize?.type}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                positionSize: { ...prev.positionSize!, type: value as any }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed USD</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="risk_based">Risk Based</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="positionValue">Position Value</Label>
            <Input
              id="positionValue"
              type="number"
              value={formData.positionSize?.value}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                positionSize: { ...prev.positionSize!, value: parseFloat(e.target.value) }
              }))}
            />
          </div>
          <div>
            <Label htmlFor="maxRisk">Max Risk %</Label>
            <Input
              id="maxRisk"
              type="number"
              value={formData.positionSize?.maxRisk}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                positionSize: { ...prev.positionSize!, maxRisk: parseFloat(e.target.value) }
              }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Stop Loss (%)</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.stopLoss?.enabled}
                onCheckedChange={(enabled) => setFormData(prev => ({ 
                  ...prev, 
                  stopLoss: { ...prev.stopLoss!, enabled }
                }))}
              />
              <Input
                type="number"
                value={formData.stopLoss?.value}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  stopLoss: { ...prev.stopLoss!, value: parseFloat(e.target.value) }
                }))}
                placeholder="3"
                disabled={!formData.stopLoss?.enabled}
              />
            </div>
          </div>
          <div>
            <Label>Take Profit (%)</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.takeProfit?.enabled}
                onCheckedChange={(enabled) => setFormData(prev => ({
                  ...prev,
                  takeProfit: { ...prev.takeProfit!, enabled }
                }))}
              />
              <Input
                type="number"
                value={formData.takeProfit?.targets[0]?.priceTarget}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  takeProfit: {
                    ...prev.takeProfit!,
                    targets: [{ percentage: 100, priceTarget: parseFloat(e.target.value) }]
                  }
                }))}
                placeholder="8"
                disabled={!formData.takeProfit?.enabled}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Max Open Positions</Label>
            <Input
              type="number"
              value={formData.maxPositions}
              onChange={(e) => setFormData(prev => ({ ...prev, maxPositions: parseInt(e.target.value) }))}
              placeholder="3"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(formData)}>
            {strategy ? 'Update' : 'Create'} Strategy
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Trading Strategies</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Strategy</DialogTitle>
            </DialogHeader>
            <StrategyForm
              onSave={handleCreateStrategy}
              onCancel={() => setIsCreating(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {strategies.length === 0 ? (
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Strategies</h3>
              <p className="text-slate-400 mb-4">
                Create your first trading strategy to start automated trading
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Strategy
              </Button>
            </CardContent>
          </Card>
        ) : (
          strategies.map(strategy => (
            <StrategyCard key={strategy.id} strategy={strategy} />
          ))
        )}
      </div>

      {/* Edit Strategy Dialog */}
      <Dialog open={!!editingStrategy} onOpenChange={() => setEditingStrategy(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Strategy</DialogTitle>
          </DialogHeader>
          {editingStrategy && (
            <StrategyForm
              strategy={editingStrategy}
              onSave={(data) => handleUpdateStrategy(editingStrategy, data)}
              onCancel={() => setEditingStrategy(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
