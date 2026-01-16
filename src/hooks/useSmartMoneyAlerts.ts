import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTierAccess } from './useTierAccess';
import { toast } from 'sonner';

export type AlertType = 
  | 'whale_movement' 
  | 'exchange_outflow' 
  | 'exchange_inflow' 
  | 'accumulation' 
  | 'distribution' 
  | 'smart_money_buy' 
  | 'smart_money_sell';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SmartMoneyAlert {
  id: string;
  user_id: string;
  symbol: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface AlertPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  min_severity: AlertSeverity;
  alert_types: AlertType[];
  watchlist_only: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES: Omit<AlertPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  enabled: true,
  min_severity: 'medium',
  alert_types: ['whale_movement', 'exchange_outflow', 'smart_money_buy'],
  watchlist_only: false,
  email_notifications: false,
  push_notifications: true,
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  whale_movement: 'Movimento de Baleia',
  exchange_outflow: 'Saída de Exchange',
  exchange_inflow: 'Entrada em Exchange',
  accumulation: 'Acumulação',
  distribution: 'Distribuição',
  smart_money_buy: 'Compra Smart Money',
  smart_money_sell: 'Venda Smart Money',
};

export const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Baixo', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  medium: { label: 'Médio', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  high: { label: 'Alto', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  critical: { label: 'Crítico', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

export function useSmartMoneyAlerts() {
  const { user } = useAuth();
  const { currentTier, hasAlertAccess } = useTierAccess();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['smart-money-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id || !hasAlertAccess) return [];
      
      const { data, error } = await supabase
        .from('smart_money_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SmartMoneyAlert[];
    },
    enabled: !!user?.id && hasAlertAccess,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch preferences
  const { data: preferences, isLoading: preferencesLoading, refetch: refetchPreferences } = useQuery({
    queryKey: ['alert-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_alert_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AlertPreferences | null;
    },
    enabled: !!user?.id && hasAlertAccess,
  });

  // Update unread count
  useEffect(() => {
    const count = alerts.filter(a => !a.is_read).length;
    setUnreadCount(count);
  }, [alerts]);

  // Mark alert as read
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('smart_money_alerts')
        .update({ is_read: true })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-money-alerts'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('smart_money_alerts')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-money-alerts'] });
      toast.success('Todos os alertas marcados como lidos');
    },
  });

  // Delete alert
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('smart_money_alerts')
        .delete()
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-money-alerts'] });
      toast.success('Alerta removido');
    },
  });

  // Update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<AlertPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: existing } = await supabase
        .from('user_alert_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_alert_preferences')
          .update(newPreferences)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_alert_preferences')
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFERENCES,
            ...newPreferences,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-preferences'] });
      toast.success('Preferências atualizadas');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar preferências');
      console.error('Error updating preferences:', error);
    },
  });

  // Subscribe to real-time alerts
  useEffect(() => {
    if (!user?.id || !hasAlertAccess) return;

    const channel = supabase
      .channel('smart-money-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'smart_money_alerts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newAlert = payload.new as SmartMoneyAlert;
          queryClient.invalidateQueries({ queryKey: ['smart-money-alerts'] });
          
          // Show toast notification
          toast(newAlert.title, {
            description: newAlert.message,
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, hasAlertAccess, queryClient]);

  const getFilteredAlerts = useCallback((filter?: {
    severity?: AlertSeverity;
    type?: AlertType;
    symbol?: string;
    unreadOnly?: boolean;
  }) => {
    let filtered = [...alerts];
    
    if (filter?.severity) {
      const severityOrder = ['low', 'medium', 'high', 'critical'];
      const minIndex = severityOrder.indexOf(filter.severity);
      filtered = filtered.filter(a => severityOrder.indexOf(a.severity) >= minIndex);
    }
    
    if (filter?.type) {
      filtered = filtered.filter(a => a.alert_type === filter.type);
    }
    
    if (filter?.symbol) {
      filtered = filtered.filter(a => a.symbol.toLowerCase() === filter.symbol?.toLowerCase());
    }
    
    if (filter?.unreadOnly) {
      filtered = filtered.filter(a => !a.is_read);
    }
    
    return filtered;
  }, [alerts]);

  return {
    alerts,
    preferences: preferences || DEFAULT_PREFERENCES,
    unreadCount,
    isLoading: alertsLoading || preferencesLoading,
    hasAccess: hasAlertAccess,
    currentTier,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteAlert: deleteAlertMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutate,
    getFilteredAlerts,
    refetch: () => {
      refetchAlerts();
      refetchPreferences();
    },
  };
}
