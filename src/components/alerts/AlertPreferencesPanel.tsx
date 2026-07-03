import React, { useState } from 'react';
import { ArrowLeft, Bell, Mail, Smartphone, Send, Copy, ExternalLink, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  useSmartMoneyAlerts,
  AlertType,
  AlertSeverity,
  ALERT_TYPE_LABELS,
  SEVERITY_CONFIG,
} from '@/hooks/useSmartMoneyAlerts';

interface AlertPreferencesPanelProps {
  onClose: () => void;
}

// Configure with your bot username (without @). Falls back to a generic link.
const TELEGRAM_BOT_USERNAME = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined) ?? '';

const AlertPreferencesPanel: React.FC<AlertPreferencesPanelProps> = ({ onClose }) => {
  const { preferences, updatePreferences, isLoading, refetch } = useSmartMoneyAlerts();
  const [tgCode, setTgCode] = useState<string | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgExpiresAt, setTgExpiresAt] = useState<string | null>(null);

  const telegramLinked = Boolean((preferences as { telegram_chat_id?: string | null }).telegram_chat_id);

  const handleAlertTypeToggle = (type: AlertType, checked: boolean) => {
    const currentTypes = preferences.alert_types || [];
    const newTypes = checked ? [...currentTypes, type] : currentTypes.filter(t => t !== type);
    updatePreferences({ alert_types: newTypes });
  };

  const handleGenerateCode = async () => {
    setTgLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-link', {
        body: { action: 'generate' },
      });
      if (error) throw error;
      setTgCode(data.code);
      setTgExpiresAt(data.expires_at);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar código do Telegram');
    } finally {
      setTgLoading(false);
    }
  };

  const handleUnlink = async () => {
    setTgLoading(true);
    try {
      const { error } = await supabase.functions.invoke('telegram-link', {
        body: { action: 'unlink' },
      });
      if (error) throw error;
      toast.success('Telegram desvinculado');
      setTgCode(null);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao desvincular');
    } finally {
      setTgLoading(false);
    }
  };

  const alertTypes: AlertType[] = [
    'whale_movement', 'exchange_outflow', 'exchange_inflow',
    'accumulation', 'distribution', 'smart_money_buy', 'smart_money_sell',
  ];
  const severities: AlertSeverity[] = ['low', 'medium', 'high', 'critical'];

  const deepLink = tgCode && TELEGRAM_BOT_USERNAME
    ? `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${tgCode}`
    : null;

  return (
    <div className="py-4 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">Configurações de Alertas</h3>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <Label className="font-medium">Alertas Ativados</Label>
            <p className="text-xs text-muted-foreground">Receber notificações de smart money</p>
          </div>
        </div>
        <Switch
          checked={preferences.enabled}
          onCheckedChange={(checked) => updatePreferences({ enabled: checked })}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Severidade Mínima</Label>
        <Select
          value={preferences.min_severity}
          onValueChange={(value: AlertSeverity) => updatePreferences({ min_severity: value })}
        >
          <SelectTrigger className="bg-slate-800"><SelectValue /></SelectTrigger>
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
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Tipos de Alerta</Label>
        <div className="space-y-2">
          {alertTypes.map(type => (
            <div key={type} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
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

      {/* Telegram */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-sky-400" />
          <Label>Telegram</Label>
        </div>

        {telegramLinked ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <Check className="h-4 w-4" />
              Telegram vinculado
            </div>
            <p className="text-xs text-muted-foreground">
              Alertas que passem no filtro de severidade serão enviados pro seu Telegram.
            </p>
            <Button variant="outline" size="sm" onClick={handleUnlink} disabled={tgLoading}>
              {tgLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
              Desvincular
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
            <p className="text-xs text-muted-foreground">
              Receba alertas direto no Telegram, mesmo com o app fechado.
            </p>

            {!tgCode ? (
              <Button onClick={handleGenerateCode} disabled={tgLoading} size="sm">
                {tgLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Send className="h-3 w-3 mr-2" />}
                Gerar código de vinculação
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-center text-2xl font-mono tracking-widest bg-slate-900 py-2 rounded border border-slate-700">
                    {tgCode}
                  </code>
                  <Button variant="ghost" size="icon" onClick={() => {
                    navigator.clipboard.writeText(tgCode);
                    toast.success('Código copiado');
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Expira em 10 minutos. Envie esse código pro bot no Telegram
                  {tgExpiresAt ? '' : ''}.
                </p>
                {deepLink ? (
                  <Button asChild size="sm" className="w-full">
                    <a href={deepLink} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Abrir bot no Telegram
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-amber-400">
                    Configure <code>VITE_TELEGRAM_BOT_USERNAME</code> no <code>.env</code> para
                    habilitar o link direto. Enquanto isso, envie o código manualmente pro seu bot.
                  </p>
                )}
                <Button variant="ghost" size="sm" onClick={() => { setTgCode(null); refetch(); }}>
                  Já vinculei — atualizar status
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Canais de Notificação</Label>

        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm">Notificações Push (toast no app)</span>
          </div>
          <Switch
            checked={preferences.push_notifications}
            onCheckedChange={(checked) => updatePreferences({ push_notifications: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg opacity-60">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Email (em breve)</span>
          </div>
          <Switch
            checked={preferences.email_notifications}
            onCheckedChange={(checked) => updatePreferences({ email_notifications: checked })}
          />
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
        <div>
          <Label className="font-medium">Apenas Watchlist</Label>
          <p className="text-xs text-muted-foreground">Alertas apenas para ativos na sua lista</p>
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
