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
    
    // Request size limit
    const MAX_REQUEST_SIZE = 10000;
    if (JSON.stringify(requestBody).length > MAX_REQUEST_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { symbols } = requestBody;
    
    // Validate symbols array
    if (!symbols || !Array.isArray(symbols)) {
      return new Response(
        JSON.stringify({ error: 'Symbols must be provided as an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each symbol
    if (symbols.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Maximum 50 symbols allowed per request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const symbol of symbols) {
      if (!symbol || typeof symbol !== 'string' || !/^[A-Z0-9]{1,10}$/.test(symbol)) {
        return new Response(
          JSON.stringify({ error: `Invalid symbol format: ${symbol}. Must be 1-10 uppercase alphanumeric characters.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log('Analyzing sentiment for symbols:', symbols);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];

    for (const symbol of symbols) {
      // Check if we have recent sentiment data (< 5 minutes old)
      const { data: cachedData } = await supabase
        .from('sentiment_data')
        .select('*')
        .eq('symbol', symbol)
        .gte('analyzed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single();

      if (cachedData) {
        console.log(`Using cached sentiment for ${symbol}`);
        results.push(cachedData);
        continue;
      }

      // Perform sentiment analysis using Lovable AI
      const prompt = `Analyze the current market sentiment for cryptocurrency ${symbol}. 
      Consider recent news, social media trends, and market movements.
      
      Provide a comprehensive sentiment analysis including:
      1. Overall sentiment (positive/neutral/negative)
      2. Sentiment score (-1 to 1, where -1 is very bearish and 1 is very bullish)
      3. Confidence level (0 to 1)
      4. Key topics or factors influencing sentiment
      5. Volume of mentions (estimated 1-100)
      
      Response format:
      {
        "sentiment_label": "positive|neutral|negative",
        "sentiment_score": <number between -1 and 1>,
        "confidence": <number between 0 and 1>,
        "key_topics": ["topic1", "topic2", "topic3"],
        "volume": <number between 1 and 100>
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
            { role: 'system', content: 'You are a crypto market sentiment analyst. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
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
      let analysis;
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error(`Error parsing AI response for ${symbol}:`, parseError, content);
        // Fallback to neutral sentiment
        analysis = {
          sentiment_label: 'neutral',
          sentiment_score: 0,
          confidence: 0.5,
          key_topics: ['analysis_error'],
          volume: 50
        };
      }

      // Store in database
      const sentimentData = {
        symbol,
        source: 'mixed',
        sentiment_score: analysis.sentiment_score,
        sentiment_label: analysis.sentiment_label,
        volume: analysis.volume,
        confidence: analysis.confidence,
        key_topics: analysis.key_topics,
        analyzed_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('sentiment_data')
        .insert(sentimentData);

      if (insertError) {
        console.error(`Error storing sentiment for ${symbol}:`, insertError);
      }

      results.push(sentimentData);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sentiment-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});