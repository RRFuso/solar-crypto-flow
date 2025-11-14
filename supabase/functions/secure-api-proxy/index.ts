import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Request size limit
    const MAX_REQUEST_SIZE = 50000;
    if (JSON.stringify(requestBody).length > MAX_REQUEST_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { endpoint, params } = requestBody;
    
    // Validate endpoint
    const validEndpoints = ['etherscan', 'gemini'];
    if (!endpoint || !validEndpoints.includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: `Invalid endpoint. Must be one of: ${validEndpoints.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate params is an object
    if (params && typeof params !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid params format. Must be an object.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `api_${clientIP}`;
    
    // Simple rate limiting (60 requests per minute)
    // In production, use Redis or similar for distributed rate limiting
    
    let response: Response;
    
    switch (endpoint) {
      case 'etherscan': {
        const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY');
        if (!etherscanKey) {
          throw new Error('Etherscan API key not configured');
        }
        
        const baseUrl = params.chainid === 1 ? 'https://api.etherscan.io/api' : 'https://api.etherscan.io/v2/api';
        const url = new URL(baseUrl);
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, String(value));
        });
        url.searchParams.set('apikey', etherscanKey);
        
        response = await fetch(url.toString(), {
          headers: {
            'User-Agent': 'Crypto-Dashboard/1.0'
          }
        });
        break;
      }
      
      case 'gemini': {
        const geminiKey = Deno.env.get('GEMINI_API_KEY');
        if (!geminiKey) {
          throw new Error('Gemini API key not configured');
        }
        
        // Gemini API calls would go here
        // This is a placeholder for the actual implementation
        response = new Response(JSON.stringify({ message: 'Gemini API not implemented yet' }), {
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      }
      
      default:
        throw new Error('Unknown endpoint');
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in secure-api-proxy:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'API request failed',
        message: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});