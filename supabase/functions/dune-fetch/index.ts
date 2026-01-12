import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DUNE_API_KEY = Deno.env.get('DUNE_API_KEY');

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: text };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!DUNE_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing DUNE_API_KEY secret. Please set it in Supabase Edge Function secrets.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { executionId, queryId, parameters } = await req.json();

    if (executionId) {
      const { ok, status, data } = await getJson(
        `https://api.dune.com/api/v1/execution/${executionId}/results`,
        { headers: { 'x-dune-api-key': DUNE_API_KEY } }
      );
      if (!ok) {
        console.error('Dune results error', status, data);
        return new Response(JSON.stringify({ error: 'Failed to fetch execution results', status, data }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (queryId) {
      // Kick off execution
      const execInit = await getJson(
        `https://api.dune.com/api/v1/query/${queryId}/execute`,
        {
          method: 'POST',
          headers: { 'x-dune-api-key': DUNE_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parameters: (parameters || []).map((p: any) => ({ name: p.name, type: p.type ?? 'text', value: p.value })),
          }),
        }
      );

      if (!execInit.ok) {
        console.error('Dune execute error', execInit.status, execInit.data);
        return new Response(JSON.stringify({ error: 'Failed to execute query', details: execInit.data }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const executionId = execInit.data.execution_id || execInit.data.id || execInit.data.executionId;
      if (!executionId) {
        return new Response(JSON.stringify({ error: 'No execution_id returned by Dune', details: execInit.data }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Poll status until completed
      let attempts = 0;
      let state = 'QUERY_STATE_PENDING';
      while (attempts < 30) {
        const statusResp = await getJson(
          `https://api.dune.com/api/v1/execution/${executionId}/status`,
          { headers: { 'x-dune-api-key': DUNE_API_KEY } }
        );
        if (!statusResp.ok) {
          return new Response(JSON.stringify({ error: 'Failed to get execution status', details: statusResp.data }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        state = statusResp.data.state || statusResp.data.status || '';
        if (state === 'QUERY_STATE_COMPLETED' || state === 'COMPLETED') break;
        if (state === 'QUERY_STATE_FAILED' || state === 'FAILED' || state === 'CANCELLED') {
          return new Response(JSON.stringify({ error: 'Dune execution failed', details: statusResp.data }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        await new Promise((r) => setTimeout(r, 1000));
        attempts++;
      }

      const resultsResp = await getJson(
        `https://api.dune.com/api/v1/execution/${executionId}/results`,
        { headers: { 'x-dune-api-key': DUNE_API_KEY } }
      );
      if (!resultsResp.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch execution results', details: resultsResp.data }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(resultsResp.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Provide executionId or queryId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in dune-fetch function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
