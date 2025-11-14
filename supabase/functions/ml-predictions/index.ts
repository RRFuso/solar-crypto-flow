import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { symbol, timeframe = '4h', predictionHorizon = '24h' } = requestBody;
    
    // Input validation
    if (!symbol || typeof symbol !== 'string' || !/^[A-Z0-9]{1,10}$/.test(symbol)) {
      return new Response(
        JSON.stringify({ error: 'Invalid symbol format. Must be 1-10 uppercase alphanumeric characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validTimeframes = ['1h', '4h', '1d', '1w'];
    if (!validTimeframes.includes(timeframe)) {
      return new Response(
        JSON.stringify({ error: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validHorizons = ['1h', '4h', '12h', '24h', '7d', '30d'];
    if (!validHorizons.includes(predictionHorizon)) {
      return new Response(
        JSON.stringify({ error: `Invalid prediction horizon. Must be one of: ${validHorizons.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Request size limit
    const MAX_REQUEST_SIZE = 10000;
    if (JSON.stringify(requestBody).length > MAX_REQUEST_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Generating ML prediction for ${symbol}, timeframe: ${timeframe}, horizon: ${predictionHorizon}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if we have recent prediction (< 10 minutes old)
    const { data: cachedPrediction } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('symbol', symbol)
      .eq('prediction_horizon', predictionHorizon)
      .gte('predicted_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order('predicted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedPrediction) {
      console.log(`Using cached prediction for ${symbol}`);
      return new Response(JSON.stringify(cachedPrediction), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch historical price data
    const { data: priceHistory } = await supabase
      .from('crypto_price_history')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (!priceHistory || priceHistory.length === 0) {
      throw new Error(`No price history found for ${symbol}`);
    }

    // Fetch current signals
    const { data: signals } = await supabase
      .from('crypto_price_action_signals')
      .select('*')
      .eq('symbol', symbol)
      .maybeSingle();

    // Fetch sentiment data
    const { data: sentiment } = await supabase
      .from('sentiment_data')
      .select('*')
      .eq('symbol', symbol)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Prepare data for AI analysis
    const recentPrices = priceHistory.slice(0, 20).map(p => ({
      timestamp: p.timestamp,
      close: p.close,
      volume: p.volume,
      high: p.high,
      low: p.low
    }));

    const prompt = `You are an advanced cryptocurrency prediction model. Analyze the following data for ${symbol} and generate a prediction for the next ${predictionHorizon}.

Historical Data (last 20 periods, ${timeframe} timeframe):
${JSON.stringify(recentPrices, null, 2)}

Current Technical Signals:
${JSON.stringify(signals || {}, null, 2)}

Market Sentiment:
${JSON.stringify(sentiment || {}, null, 2)}

Generate a comprehensive prediction including:
1. Prediction type (price/volatility/breakout/reversal)
2. Predicted value (price target or percentage change)
3. Confidence level (0 to 1)
4. Risk score (0 to 1, where 1 is highest risk)
5. Supporting factors (array of reasons)
6. Key features used in prediction

Use advanced technical analysis, market patterns, sentiment, and on-chain data correlations.

Response format (JSON only):
{
  "prediction_type": "price|volatility|breakout|reversal",
  "predicted_value": <number>,
  "confidence": <0 to 1>,
  "risk_score": <0 to 1>,
  "supporting_factors": ["factor1", "factor2", "factor3"],
  "features": {
    "trend_strength": <number>,
    "momentum": <number>,
    "volatility_index": <number>,
    "sentiment_alignment": <number>
  }
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert cryptocurrency prediction model with deep knowledge of technical analysis, market psychology, and on-chain metrics. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI API error for ${symbol}:`, aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse AI response
    let prediction;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prediction = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error(`Error parsing AI response for ${symbol}:`, parseError, content);
      throw new Error('Failed to parse AI prediction');
    }

    // Calculate valid_until based on prediction_horizon
    const validUntil = new Date();
    if (predictionHorizon === '1h') validUntil.setHours(validUntil.getHours() + 1);
    else if (predictionHorizon === '4h') validUntil.setHours(validUntil.getHours() + 4);
    else if (predictionHorizon === '24h') validUntil.setHours(validUntil.getHours() + 24);
    else if (predictionHorizon === '7d') validUntil.setDate(validUntil.getDate() + 7);
    else if (predictionHorizon === '30d') validUntil.setDate(validUntil.getDate() + 30);

    // Store prediction in database
    const predictionData = {
      symbol,
      timeframe,
      prediction_type: prediction.prediction_type,
      predicted_value: prediction.predicted_value,
      confidence: prediction.confidence,
      prediction_horizon: predictionHorizon,
      features: prediction.features,
      model_version: 'gemini-2.5-flash-v1',
      risk_score: prediction.risk_score,
      supporting_factors: prediction.supporting_factors,
      predicted_at: new Date().toISOString(),
      valid_until: validUntil.toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from('ai_predictions')
      .insert(predictionData)
      .select()
      .single();

    if (insertError) {
      console.error(`Error storing prediction for ${symbol}:`, insertError);
      throw insertError;
    }

    console.log(`Prediction stored successfully for ${symbol}`);
    return new Response(JSON.stringify(inserted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ml-predictions function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});