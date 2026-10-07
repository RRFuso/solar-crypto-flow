import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveCaller, isInternalOrAdmin, deny } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    { const caller = await resolveCaller(req); if (!isInternalOrAdmin(caller)) return deny(caller, corsHeaders); }
    console.log('[CRON] Starting smart money flow update...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Call the smart-money-tracker function to update flows
    const { data, error } = await supabase.functions.invoke('smart-money-tracker', {
      body: {
        action: 'update_flows',
        timeframe: '1h',
      },
    });

    if (error) {
      console.error('[CRON] Error updating flows:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[CRON] Smart money flows updated successfully:', data);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Smart money flows updated',
        timestamp: new Date().toISOString(),
        data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[CRON] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
