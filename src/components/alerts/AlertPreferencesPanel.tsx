import React from 'react';
import { ArrowLeft, Bell, Mail, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  useSmartMoneyAlerts, 
  AlertType, 
  AlertSeverity,
  ALERT_TYPE_LABELS,
  SEVERITY_CONFIG 
} from '@/hooks/useSmartMoneyAlerts';

interface AlertPreferencesPanelProps {
  onClose: () => void;
}

const AlertPreferencesPanel: React.FC<AlertPreferencesPanelProps> = ({ onClose }) => {
  const { preferences, updatePreferences, isLoading } = useSmartMoneyAlerts();

  const handleAlertTypeToggle = (type: AlertType, checked: boolean) => {
    const currentTypes = preferences.alert_types || [];
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    
    updatePreferences({ alert_types: newTypes });
  };

  const alertTypes: AlertType[] = [
    'whale_movement',
    'exchange_outflow',
    'exchange_inflow',
    'accumulation',
    'distribution',
    'smart_money_buy',
    'smart_money_sell',
  ];

  const severities: AlertSeverity[] = ['low', 'medium', 'high', 'critical'];

  return (
    <div className="py-4 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">Configurações de Alertas</h3>
      </div>

      {/* Master toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <Label className="font-medium">Alertas Ativados</Label>
            <p className="text-xs text-muted-foreground">
              Receber notificações de smart money
            </p>
          </div>
        </div>
        <Switch
          checked={preferences.enabled}
          onCheckedChange={(checked) => updatePreferences({ enabled: checked })}
        />
      </div>

      <Separator />

      {/* Severity filter */}
      <div className="space-y-3">
        <Label>Severidade Mínima</Label>
        <Select
          value={preferences.min_severity}
          onValueChange={(value: AlertSeverity) => updatePreferences({ min_severity: value })}
        >
          <SelectTrigger className="bg-slate-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {severities.map(severity => (
              <SelectItem key={severity} value={severity}>
                <span className={SEVERITY_CONFIG[severity].color}>
                  {SEVERITY_CONFIG[severity].label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Receba apenas alertas com esta severidade ou maior
        </p>
      </div>

      <Separator />

      {/* Alert types */}
      <div className="space-y-3">
        <Label>Tipos de Alerta</Label>
        <div className="space-y-2">
          {alertTypes.map(type => (
            <div 
              key={type} 
              className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <Checkbox
                id={type}
                checked={preferences.alert_types?.includes(type) ?? false}
                onCheckedChange={(checked) => handleAlertTypeToggle(type, checked as boolean)}
              />
              <Label htmlFor={type} className="flex-1 cursor-pointer">
                {ALERT_TYPE_LABELS[type]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Notification channels */}
      <div className="space-y-3">
        <Label>Canais de Notificação</Label>
        
        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm">Notificações Push</span>
          </div>
          <Switch
            checked={preferences.push_notifications}
            onCheckedChange={(checked) => updatePreferences({ push_notifications: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Email (Resumo Diário)</span>
          </div>
          <Switch
            checked={preferences.email_notifications}
            onCheckedChange={(checked) => updatePreferences({ email_notifications: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Watchlist filter */}
      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
        <div>
          <Label className="font-medium">Apenas Watchlist</Label>
          <p className="text-xs text-muted-foreground">
            Alertas apenas para ativos na sua lista
          </p>
        </div>
        <Switch
          checked={preferences.watchlist_only}
          onCheckedChange={(checked) => updatePreferences({ watchlist_only: checked })}
        />
      </div>
    </div>
  );
};

export default AlertPreferencesPanel;
