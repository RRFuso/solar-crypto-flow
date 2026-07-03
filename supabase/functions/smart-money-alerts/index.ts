import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertConfig {
  type: 'whale_movement' | 'exchange_outflow' | 'exchange_inflow' | 'accumulation' | 'distribution' | 'smart_money_buy' | 'smart_money_sell';
  severity: 'low' | 'medium' | 'high' | 'critical';
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

const ALERT_CONFIGS: AlertConfig[] = [
  {
    type: 'whale_movement',
    severity: 'medium',
    thresholds: { low: 100000, medium: 500000, high: 1000000, critical: 5000000 },
  },
  {
    type: 'exchange_outflow',
    severity: 'medium',
    thresholds: { low: 50000, medium: 200000, high: 500000, critical: 2000000 },
  },
  {
    type: 'exchange_inflow',
    severity: 'medium',
    thresholds: { low: 50000, medium: 200000, high: 500000, critical: 2000000 },
  },
  {
    type: 'smart_money_buy',
    severity: 'high',
    thresholds: { low: 0.6, medium: 0.7, high: 0.8, critical: 0.9 }, // confidence thresholds
  },
  {
    type: 'smart_money_sell',
    severity: 'high',
    thresholds: { low: 0.6, medium: 0.7, high: 0.8, critical: 0.9 },
  },
];

function determineSeverity(value: number, thresholds: AlertConfig['thresholds']): 'low' | 'medium' | 'high' | 'critical' {
  if (value >= thresholds.critical) return 'critical';
  if (value >= thresholds.high) return 'high';
  if (value >= thresholds.medium) return 'medium';
  return 'low';
}

function formatUSD(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();
    console.log(`[smart-money-alerts] Action: ${action}`);

    if (action === 'check_and_create_alerts') {
      // Fetch latest smart money flow data
      const { data: flowData, error: flowError } = await supabase
        .from('smart_money_flow_cache')
        .select('*')
        .gte('last_updated', new Date(Date.now() - 15 * 60 * 1000).toISOString());

      if (flowError) throw flowError;

      // Fetch all Pro/Premium users with alerts enabled
      const { data: eligibleUsers, error: userError } = await supabase
        .from('user_alert_preferences')
        .select('user_id, min_severity, alert_types, watchlist_only')
        .eq('enabled', true);

      if (userError) throw userError;

      console.log(`[smart-money-alerts] Found ${flowData?.length || 0} flow records and ${eligibleUsers?.length || 0} eligible users`);

      const alertsToCreate: Array<{
        user_id: string;
        symbol: string;
        alert_type: string;
        severity: string;
        title: string;
        message: string;
        metadata: Record<string, unknown>;
      }> = [];

      // Analyze each flow record for alert conditions
      for (const flow of flowData || []) {
        const symbol = flow.token_symbol;
        const netFlow = Math.abs(flow.net_flow_usd || 0);
        const confidence = flow.confidence_score || 0;
        const direction = flow.dominant_direction;

        // Check for significant flows
        if (netFlow > 100000 || confidence > 0.6) {
          for (const user of eligibleUsers || []) {
            const userAlertTypes = user.alert_types || [];
            const minSeverity = user.min_severity || 'medium';
            const severityOrder = ['low', 'medium', 'high', 'critical'];
            const minSeverityIndex = severityOrder.indexOf(minSeverity);

            // Determine alert type and severity
            let alertType: string | null = null;
            let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
            let title = '';
            let message = '';

            // Exchange flow alerts
            if (flow.total_outflow_usd > 200000 && userAlertTypes.includes('exchange_outflow')) {
              alertType = 'exchange_outflow';
              severity = determineSeverity(flow.total_outflow_usd, ALERT_CONFIGS[1].thresholds);
              title = `🟢 Saída de ${symbol} das Exchanges`;
              message = `Detectada saída de ${formatUSD(flow.total_outflow_usd)} em ${symbol} das exchanges. Isso pode indicar acumulação.`;
            } else if (flow.total_inflow_usd > 200000 && userAlertTypes.includes('exchange_inflow')) {
              alertType = 'exchange_inflow';
              severity = determineSeverity(flow.total_inflow_usd, ALERT_CONFIGS[2].thresholds);
              title = `🔴 Entrada de ${symbol} nas Exchanges`;
              message = `Detectada entrada de ${formatUSD(flow.total_inflow_usd)} em ${symbol} nas exchanges. Pode indicar pressão de venda.`;
            }

            // Smart money direction alerts
            if (confidence >= 0.6) {
              if (direction === 'inflow' && userAlertTypes.includes('smart_money_buy')) {
                alertType = 'smart_money_buy';
                severity = determineSeverity(confidence, ALERT_CONFIGS[3].thresholds);
                title = `💎 Smart Money comprando ${symbol}`;
                message = `Carteiras de smart money estão acumulando ${symbol} com confiança de ${(confidence * 100).toFixed(0)}%. Volume: ${formatUSD(netFlow)}`;
              } else if (direction === 'outflow' && userAlertTypes.includes('smart_money_sell')) {
                alertType = 'smart_money_sell';
                severity = determineSeverity(confidence, ALERT_CONFIGS[4].thresholds);
                title = `⚠️ Smart Money vendendo ${symbol}`;
                message = `Carteiras de smart money estão distribuindo ${symbol} com confiança de ${(confidence * 100).toFixed(0)}%. Volume: ${formatUSD(netFlow)}`;
              }
            }

            // Whale movement alerts
            if (flow.whale_transactions_value > 500000 && userAlertTypes.includes('whale_movement')) {
              alertType = 'whale_movement';
              severity = determineSeverity(flow.whale_transactions_value, ALERT_CONFIGS[0].thresholds);
              title = `🐋 Movimento de Baleia em ${symbol}`;
              message = `Detectada transação de baleia de ${formatUSD(flow.whale_transactions_value)} em ${symbol}. ${flow.whale_tx_count} transações de alto valor.`;
            }

            // Check severity threshold
            if (alertType && severityOrder.indexOf(severity) >= minSeverityIndex) {
              // Check for duplicate alerts (same user, symbol, type in last hour)
              const existingAlert = alertsToCreate.find(
                a => a.user_id === user.user_id && 
                     a.symbol === symbol && 
                     a.alert_type === alertType
              );

              if (!existingAlert) {
                alertsToCreate.push({
                  user_id: user.user_id,
                  symbol,
                  alert_type: alertType,
                  severity,
                  title,
                  message,
                  metadata: {
                    net_flow: flow.net_flow_usd,
                    confidence: flow.confidence_score,
                    direction: flow.dominant_direction,
                    whale_count: flow.whale_tx_count,
                    factors: flow.confidence_factors,
                  },
                });
              }
            }
          }
        }
      }

      // Insert alerts in batch
      if (alertsToCreate.length > 0) {
        // Check for recent duplicates in DB
        const { data: recentAlerts } = await supabase
          .from('smart_money_alerts')
          .select('user_id, symbol, alert_type')
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

        const recentSet = new Set(
          (recentAlerts || []).map(a => `${a.user_id}:${a.symbol}:${a.alert_type}`)
        );

        const newAlerts = alertsToCreate.filter(
          a => !recentSet.has(`${a.user_id}:${a.symbol}:${a.alert_type}`)
        );

        if (newAlerts.length > 0) {
          const { error: insertError } = await supabase
            .from('smart_money_alerts')
            .insert(newAlerts);

          if (insertError) throw insertError;
          console.log(`[smart-money-alerts] Created ${newAlerts.length} new alerts`);

          // Fan-out to Telegram for users who have linked their chat
          const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
          if (telegramToken) {
            const userIds = Array.from(new Set(newAlerts.map(a => a.user_id)));
            const { data: prefs } = await supabase
              .from('user_alert_preferences')
              .select('user_id, telegram_chat_id')
              .in('user_id', userIds)
              .not('telegram_chat_id', 'is', null);

            const chatMap = new Map<string, string>();
            for (const p of prefs ?? []) {
              if (p.telegram_chat_id) chatMap.set(p.user_id, p.telegram_chat_id);
            }

            const escapeHtml = (s: string) => s
              .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            const sends = newAlerts
              .map(a => {
                const chatId = chatMap.get(a.user_id);
                if (!chatId) return null;
                const text = `<b>${escapeHtml(a.title)}</b>\n\n${escapeHtml(a.message)}`;
                return fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
                });
              })
              .filter((p): p is Promise<Response> => p !== null);

            const results = await Promise.allSettled(sends);
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`[smart-money-alerts] Telegram sent: ${results.length - failed}/${results.length}`);
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          alertsCreated: alertsToCreate.length,
          flowRecordsProcessed: flowData?.length || 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_user_alerts') {
      const { user_id, limit = 50, unread_only = false } = data;

      let query = supabase
        .from('smart_money_alerts')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unread_only) {
        query = query.eq('is_read', false);
      }

      const { data: alerts, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, alerts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'cleanup_old_alerts') {
      // Delete alerts older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('smart_money_alerts')
        .delete()
        .lt('created_at', thirtyDaysAgo);

      if (error) throw error;

      console.log('[smart-money-alerts] Cleaned up old alerts');
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[smart-money-alerts] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
