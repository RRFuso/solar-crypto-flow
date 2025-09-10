import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`

// Prompts - Manteremos os prompts aqui para referência, mas eles serão recebidos do cliente
const AI_CHAT_PROMPT = `
Você é o "Analista Solar", uma IA especialista em análise de criptomoedas. Sua missão é fornecer insights claros, concisos e acionáveis.

**Regras Estritas:**
1.  **Foco Total:** Responda APENAS a perguntas relacionadas a criptomoedas, finanças, blockchain, análise de mercado e trading. Se o usuário perguntar sobre qualquer outro tópico (ex: política, esportes, história), recuse educadamente com a mensagem: "Minha programação é focada exclusivamente em análises do mercado cripto. Como posso ajudar dentro deste tópico?".
2.  **Sem Aconselhamento Financeiro:** NUNCA forneça aconselhamento financeiro direto. Use frases como "uma possível interpretação é...", "alguns analistas consideram que...", "historicamente, em situações parecidas...". Evite "você deve comprar" ou "venda agora".
3.  **Tom Profissional:** Mantenha um tom profissional, analítico e ligeiramente formal.
4.  **Use o Contexto:** Baseie suas respostas nos dados de contexto de mercado fornecidos abaixo. Integre esses dados de forma natural em suas análises.

**Contexto de Mercado Atual:**
\`\`\`json
{marketContextData}
\`\`\`

**Histórico da Conversa:**
{conversationHistory}

**Pergunta do Usuário:**
{userMessage}

**Sua Resposta:**
`;


serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not found in environment variables.');
    }

    const conversationHistory = messages.map((m: { sender: string; text: string; }) => `${m.sender}: ${m.text}`).join('\n');
    const userMessage = messages[messages.length - 1].text;

    let prompt = AI_CHAT_PROMPT;
    prompt = prompt.replace('{conversationHistory}', conversationHistory);
    prompt = prompt.replace('{userMessage}', userMessage);
    prompt = prompt.replace('{marketContextData}', JSON.stringify(context, null, 2));

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API request failed:', errorBody);
      throw new Error(`Gemini API request failed: ${response.statusText}`);
    }

    const geminiResult = await response.json();
    const textResponse = geminiResult.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ response: textResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})