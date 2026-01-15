import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product ID to plan mapping - update these with your actual Stripe product IDs
const PRODUCT_TO_PLAN: Record<string, 'pro' | 'premium'> = {
  'prod_TAWbWItNwiXKDF': 'pro',
  'prod_TAWbSzcetW1egF': 'premium',
  'prod_pro': 'pro',           // Fallback
  'prod_premium': 'premium',   // Fallback
};

// Tier limits for API response
const TIER_LIMITS = {
  free: {
    maxFlows: 30,
    smartMoneyDelayMs: 30 * 60 * 1000, // 30 minutes
    maxWatchlistItems: 5,
    hasAIAnalyst: false,
    hasAlerts: false,
    hasHistoricalData: false,
  },
  pro: {
    maxFlows: 500,
    smartMoneyDelayMs: 5 * 60 * 1000, // 5 minutes
    maxWatchlistItems: 50,
    hasAIAnalyst: true,
    hasAlerts: true,
    hasHistoricalData: true,
  },
  premium: {
    maxFlows: 2000,
    smartMoneyDelayMs: 0, // Real-time
    maxWatchlistItems: 200,
    hasAIAnalyst: true,
    hasAlerts: true,
    hasHistoricalData: true,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    const isAdmin = !!roleData;
    logStep("Admin check", { isAdmin });

    // If admin, return premium access
    if (isAdmin) {
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: 'admin',
        subscription_end: null,
        plan: 'premium',
        limits: TIER_LIMITS.premium,
        isAdmin: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: 'free',
        limits: TIER_LIMITS.free,
        isAdmin: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let plan: 'free' | 'pro' | 'premium' = 'free';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      productId = String(subscription.items.data[0].price.product);
      
      // Determine plan based on product ID
      plan = PRODUCT_TO_PLAN[productId] || 'free';
      
      logStep("Determined subscription plan", { productId, plan });
    } else {
      logStep("No active subscription found");
    }

    const limits = TIER_LIMITS[plan];

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      plan,
      limits,
      isAdmin: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage, 
      subscribed: false, 
      plan: 'free',
      limits: TIER_LIMITS.free,
      isAdmin: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
