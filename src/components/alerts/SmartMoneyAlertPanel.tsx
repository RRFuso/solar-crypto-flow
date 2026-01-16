import React, { useState } from 'react';
import { Bell, BellOff, Check, CheckCheck, Trash2, Filter, Settings, X, TrendingUp, TrendingDown, Waves, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  useSmartMoneyAlerts, 
  SmartMoneyAlert, 
  AlertType, 
  AlertSeverity,
  ALERT_TYPE_LABELS,
  SEVERITY_CONFIG 
} from '@/hooks/useSmartMoneyAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AlertPreferencesPanel from './AlertPreferencesPanel';
import { FeatureGate } from '@/components/subscription/FeatureGate';

const ALERT_ICONS: Record<AlertType, React.ReactNode> = {
  whale_movement: <Waves className="h-4 w-4" />,
  exchange_outflow: <TrendingUp className="h-4 w-4" />,
  exchange_inflow: <TrendingDown className="h-4 w-4" />,
  accumulation: <TrendingUp className="h-4 w-4" />,
  distribution: <TrendingDown className="h-4 w-4" />,
  smart_money_buy: <TrendingUp className="h-4 w-4" />,
  smart_money_sell: <TrendingDown className="h-4 w-4" />,
};

interface AlertItemProps {
  alert: SmartMoneyAlert;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onMarkAsRead, onDelete }) => {
  const severityConfig = SEVERITY_CONFIG[alert.severity];
  
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-all",
        alert.is_read 
          ? "bg-slate-900/30 border-slate-700/50" 
          : "bg-slate-800/50 border-slate-600/50 shadow-lg"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          severityConfig.bgColor
        )}>
          {ALERT_ICONS[alert.alert_type]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {alert.symbol}
            </Badge>
            <Badge className={cn("text-xs", severityConfig.bgColor, severityConfig.color)}>
              {severityConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          
          <h4 className={cn(
            "font-medium text-sm mb-1",
            !alert.is_read && "text-white"
          )}>
            {alert.title}
          </h4>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {alert.message}
          </p>
        </div>
        
        <div className="flex flex-col gap-1">
          {!alert.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMarkAsRead(alert.id)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(alert.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const SmartMoneyAlertPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);
  
  const {
    alerts,
    unreadCount,
    isLoading,
    hasAccess,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    getFilteredAlerts,
  } = useSmartMoneyAlerts();

  const filteredAlerts = activeTab === 'unread' 
    ? getFilteredAlerts({ unreadOnly: true })
    : alerts;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md bg-slate-900 border-slate-700">
        <SheetHeader className="border-b border-slate-700 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas Smart Money
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreferences(!showPreferences)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <FeatureGate 
          feature="alerts" 
          fallback={
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Alertas Premium</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Receba alertas em tempo real sobre movimentos de smart money e baleias.
              </p>
            </div>
          }
        >
          {showPreferences ? (
            <AlertPreferencesPanel onClose={() => setShowPreferences(false)} />
          ) : (
            <div className="mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="bg-slate-800">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="unread">
                      Não lidos
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1">
                          {unreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsRead()}
                      className="text-xs"
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      Marcar todos
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[calc(100vh-200px)]">
                  <TabsContent value="all" className="mt-0 space-y-2">
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-24 bg-slate-800/50 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : filteredAlerts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Nenhum alerta ainda</p>
                        <p className="text-xs mt-1">
                          Alertas aparecerão aqui quando detectarmos movimentos significativos
                        </p>
                      </div>
                    ) : (
                      filteredAlerts.map(alert => (
                        <AlertItem
                          key={alert.id}
                          alert={alert}
                          onMarkAsRead={markAsRead}
                          onDelete={deleteAlert}
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="unread" className="mt-0 space-y-2">
                    {filteredAlerts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Tudo lido!</p>
                        <p className="text-xs mt-1">
                          Você está em dia com todos os alertas
                        </p>
                      </div>
                    ) : (
                      filteredAlerts.map(alert => (
                        <AlertItem
                          key={alert.id}
                          alert={alert}
                          onMarkAsRead={markAsRead}
                          onDelete={deleteAlert}
                        />
                      ))
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </FeatureGate>
      </SheetContent>
    </Sheet>
  );
};

export default SmartMoneyAlertPanel;
