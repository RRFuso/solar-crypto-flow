import { CreateWebWorkerMLCEngine, type MLCEngineInterface, type ChatCompletionMessageParam } from '@mlc-ai/web-llm';

// Adaptive model selection based on device memory
function selectModel(): string {
  const mem = (navigator as any).deviceMemory;
  if (mem && mem <= 8) {
    console.log('[WebLLM] Low memory detected, using lightweight model');
    return 'gemma-2b-it-q4f16_1-MLC';
  }
  return 'Llama-3.1-8B-Instruct-q4f16_1-MLC';
}

export type WebLLMStatus = 'idle' | 'loading' | 'ready' | 'error' | 'offline';

export interface WebLLMProgress {
  status: WebLLMStatus;
  progress: number;
  text: string;
}

type ProgressCallback = (progress: WebLLMProgress) => void;

let engineInstance: MLCEngineInterface | null = null;
let engineStatus: WebLLMStatus = 'idle';
let initPromise: Promise<MLCEngineInterface | null> | null = null;
let activeModelId: string | null = null;

function checkWebGPUSupport(): boolean {
  return 'gpu' in navigator;
}

export async function getWebLLMEngine(onProgress?: ProgressCallback): Promise<MLCEngineInterface | null> {
  if (engineInstance && engineStatus === 'ready') return engineInstance;
  if (initPromise) return initPromise;

  if (!checkWebGPUSupport()) {
    engineStatus = 'offline';
    onProgress?.({ status: 'offline', progress: 0, text: 'WebGPU não suportado neste navegador' });
    return null;
  }

  engineStatus = 'loading';
  onProgress?.({ status: 'loading', progress: 0, text: 'Inicializando IA Local no Worker...' });

  const modelId = selectModel();
  activeModelId = modelId;

  initPromise = (async () => {
    try {
      const worker = new Worker(
        new URL('../../workers/webLlmWorker.ts', import.meta.url),
        { type: 'module' }
      );

      const engine = await CreateWebWorkerMLCEngine(worker, modelId, {
        initProgressCallback: (report) => {
          const pct = Math.round(report.progress * 100);
          onProgress?.({
            status: 'loading',
            progress: pct,
            text: report.text || `Carregando ${modelId}... ${pct}%`,
          });
        },
      });

      engineInstance = engine;
      engineStatus = 'ready';
      onProgress?.({ status: 'ready', progress: 100, text: `IA Local pronta (${modelId})` });
      return engine;
    } catch (err) {
      console.error('[WebLLM] Init failed:', err);
      engineStatus = 'error';
      initPromise = null;
      onProgress?.({ status: 'error', progress: 0, text: 'Falha ao carregar IA Local' });
      return null;
    }
  })();

  return initPromise;
}

export function getWebLLMStatus(): WebLLMStatus {
  return engineStatus;
}

export function getActiveModelId(): string | null {
  return activeModelId;
}

export async function unloadWebLLM(): Promise<void> {
  if (engineInstance) {
    try {
      await engineInstance.unload();
    } catch { /* ignore */ }
    engineInstance = null;
    engineStatus = 'idle';
    initPromise = null;
    activeModelId = null;
  }
}

const SOLAR_SYSTEM_PROMPT = `Você é o Helius Oracle, analista cripto especialista embutido no Solar Core. Analisa fluxos de capital, smart money e dados on-chain.

REGRAS CRÍTICAS (obrigatórias):
1. Responda SEMPRE em Português (Brasil).
2. NUNCA devolva apenas JSON cru. A resposta deve sempre conter texto analítico em linguagem natural ANTES de qualquer bloco de comando.
2b. Separe sempre em três partes curtas: "Fatos" (só números presentes no contexto, com fonte/idade quando houver), "Interpretação" (sua leitura, marcada como hipótese) e "Incerteza" (dados ausentes, desatualizados ou estimados). Nunca invente números; se um dado não está no contexto, diga que está indisponível. Gaps "CME" do app são estimativas via Binance spot, não dados oficiais da CME. Use termos neutros (Sinal de Tendência), nunca recomende comprar ou vender.
3. Estrutura obrigatória da resposta:
   a) Um parágrafo curto interpretando o pedido do usuário (1-2 frases).
   b) Bullet points com a análise dos ativos/categorias relevantes (sentimento, fluxo, sinais on-chain) — interprete os dados, não os despeje.
   c) Uma conclusão com observação neutra (sem aconselhamento financeiro).
   d) Opcionalmente, um único bloco \`\`\`solar-command\`\`\` ao final, se for necessário reconfigurar a visualização.
4. NUNCA escreva placeholders genéricos do tipo "this value should be replaced" ou comentários "//" dentro do JSON. JSON deve ser válido e estrito.
5. Use terminologia neutra. Não dê conselho financeiro.
6. Seja conciso, direto e baseado em dados.

FORMATO DO SOLAR COMMAND (apenas quando reconfigurar a visualização):
\`\`\`solar-command
{"symbols":["BTC","ETH"],"category":"defi","zoom":120,"focus":"BTC"}
\`\`\`
Campos válidos: symbols (string[]), category (string), zoom (number), focus (string symbol), smartMoneyThreshold (number), particleColor (string hex). Nada além disso. Sem comentários, sem campos inventados como "maxSupply" ou "changePercentage".

EXEMPLO DE BOA RESPOSTA:
"Identifiquei os ativos com maior potencial de movimento explosivo no momento.

- **BTC**: fluxo de smart money positivo nas últimas 4h, acumulação detectada.
- **ETH**: aumento de volume on-chain de 18%, sentimento bullish.

Observação: indicadores informativos, sem garantia de movimento futuro.

\`\`\`solar-command
{"symbols":["BTC","ETH"],"zoom":140,"focus":"BTC"}
\`\`\`"

CONTEXTO DE MERCADO (injetado em tempo real):
{context}`;

export async function chatWithLocalAI(
  messages: ChatCompletionMessageParam[],
  marketContext: string
): Promise<string | null> {
  if (!engineInstance || engineStatus !== 'ready') return null;

  try {
    const systemPrompt = SOLAR_SYSTEM_PROMPT.replace('{context}', marketContext);

    const reply = await engineInstance.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    return reply.choices[0]?.message?.content || null;
  } catch (err) {
    console.error('[WebLLM] Chat error:', err);
    return null;
  }
}
