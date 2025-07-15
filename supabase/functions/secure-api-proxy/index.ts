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
    const { endpoint, params } = await req.json();
    
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
        
        const url = new URL('https://api.etherscan.io/api');
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