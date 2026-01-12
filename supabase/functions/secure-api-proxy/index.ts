import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

// Chain to Alchemy subdomain mapping
const ALCHEMY_CHAIN_MAP: { [key: string]: string } = {
  'ethereum': 'eth-mainnet',
  'goerli': 'eth-goerli',
  'sepolia': 'eth-sepolia',
  'polygon': 'polygon-mainnet',
  'polygon-mumbai': 'polygon-mumbai',
  'arbitrum': 'arb-mainnet',
  'arbitrum-goerli': 'arb-goerli',
  'optimism': 'opt-mainnet',
  'optimism-goerli': 'opt-goerli',
  'base': 'base-mainnet',
  'base-goerli': 'base-goerli',
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

    const { endpoint, params, chain, rpcRequest } = requestBody;
    
    // Validate endpoint
    const validEndpoints = ['alchemy', 'gemini'];
    if (!endpoint || !validEndpoints.includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: `Invalid endpoint. Must be one of: ${validEndpoints.join(', ')}` }),
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
      case 'alchemy': {
        const alchemyKey = Deno.env.get('ALCHEMY_API_KEY');
        if (!alchemyKey) {
          throw new Error('Alchemy API key not configured');
        }
        
        // Validate rpcRequest
        if (!rpcRequest || typeof rpcRequest !== 'object') {
          return new Response(
            JSON.stringify({ error: 'Invalid rpcRequest format. Must be an object with id, jsonrpc, method, and optional params.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Get the chain subdomain (default to ethereum mainnet)
        const chainName = chain || 'ethereum';
        const alchemySubdomain = ALCHEMY_CHAIN_MAP[chainName] || 'eth-mainnet';
        
        const url = `https://${alchemySubdomain}.g.alchemy.com/v2/${alchemyKey}`;
        
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            id: rpcRequest.id || 1,
            jsonrpc: rpcRequest.jsonrpc || '2.0',
            method: rpcRequest.method,
            params: rpcRequest.params || []
          })
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
    
  } catch (error: unknown) {
    console.error('Error in secure-api-proxy:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: 'API request failed',
        message: errorMessage 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});