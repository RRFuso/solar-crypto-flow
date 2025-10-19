import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ open, onOpenChange }) => {
  const { profile, isLoading, updateProfile, isUpdating } = useUserProfile();
  
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [investmentHorizon, setInvestmentHorizon] = useState<'short' | 'medium' | 'long'>('medium');
  const [maxPositionSize, setMaxPositionSize] = useState([10]);
  const [stopLoss, setStopLoss] = useState([5]);
  const [takeProfit, setTakeProfit] = useState([15]);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState<'all' | 'important' | 'critical'>('important');

  useEffect(() => {
    if (profile) {
      setRiskProfile(profile.risk_profile);
      setInvestmentHorizon(profile.investment_horizon);
      setMaxPositionSize([profile.max_position_size]);
      setStopLoss([profile.stop_loss_percentage]);
      setTakeProfit([profile.take_profit_percentage]);
      setEnableNotifications(profile.enable_notifications);
      setNotificationFrequency(profile.notification_frequency);
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile({
      risk_profile: riskProfile,
      investment_horizon: investmentHorizon,
      max_position_size: maxPositionSize[0],
      stop_loss_percentage: stopLoss[0],
      take_profit_percentage: takeProfit[0],
      enable_notifications: enableNotifications,
      notification_frequency: notificationFrequency,
    });
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Configurar Perfil de Investimento</DialogTitle>
          <DialogDescription className="text-gray-400">
            Personalize a IA com base no seu perfil de risco e objetivos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Risk Profile */}
          <div className="space-y-2">
            <Label>Perfil de Risco</Label>
            <Select value={riskProfile} onValueChange={(v: any) => setRiskProfile(v)}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="conservative">Conservador - Menor risco, retornos estáveis</SelectItem>
                <SelectItem value="moderate">Moderado - Equilíbrio risco/retorno</SelectItem>
                <SelectItem value="aggressive">Agressivo - Alto risco, alto retorno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Investment Horizon */}
          <div className="space-y-2">
            <Label>Horizonte de Investimento</Label>
            <Select value={investmentHorizon} onValueChange={(v: any) => setInvestmentHorizon(v)}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="short">Curto Prazo - Day trading, swing trading</SelectItem>
                <SelectItem value="medium">Médio Prazo - Semanas a meses</SelectItem>
                <SelectItem value="long">Longo Prazo - Hold de longo prazo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Position Size */}
          <div className="space-y-2">
            <Label>Tamanho Máximo de Posição (%): {maxPositionSize[0]}%</Label>
            <Slider
              value={maxPositionSize}
              onValueChange={setMaxPositionSize}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-400">Percentual máximo do portfólio por posição</p>
          </div>

          {/* Stop Loss */}
          <div className="space-y-2">
            <Label>Stop Loss Padrão (%): {stopLoss[0]}%</Label>
            <Slider
              value={stopLoss}
              onValueChange={setStopLoss}
              min={1}
              max={30}
              step={0.5}
              className="w-full"
            />
            <p className="text-xs text-gray-400">Perda máxima aceitável por operação</p>
          </div>

          {/* Take Profit */}
          <div className="space-y-2">
            <Label>Take Profit Padrão (%): {takeProfit[0]}%</Label>
            <Slider
              value={takeProfit}
              onValueChange={setTakeProfit}
              min={5}
              max={100}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-400">Objetivo de ganho por operação</p>
          </div>

          {/* Notifications */}
          <div className="space-y-4 border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações Inteligentes</Label>
                <p className="text-xs text-gray-400">Receba alertas personalizados</p>
              </div>
              <Switch
                checked={enableNotifications}
                onCheckedChange={setEnableNotifications}
              />
            </div>

            {enableNotifications && (
              <div className="space-y-2">
                <Label>Frequência de Notificações</Label>
                <Select value={notificationFrequency} onValueChange={(v: any) => setNotificationFrequency(v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">Todas - Receber todos os alertas</SelectItem>
                    <SelectItem value="important">Importantes - Apenas sinais relevantes</SelectItem>
                    <SelectItem value="critical">Críticos - Apenas oportunidades de alto impacto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isUpdating}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-black"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Perfil'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};