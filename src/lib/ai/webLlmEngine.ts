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

const SOLAR_SYSTEM_PROMPT = `You are Helius Oracle, an expert crypto market analyst embedded in the Solar Core visualization system. You analyze capital flows, smart money movements, and on-chain data.

CRITICAL RULES:
1. Always respond in Portuguese (Brazilian).
2. When the user asks to highlight, focus, or filter assets, include a solar-command JSON block.
3. Use neutral analytical language. Never give financial advice.
4. Be concise and data-driven.

SOLAR COMMAND FORMAT:
When you need to reconfigure the visualization, wrap a JSON in a code block:
\`\`\`solar-command
{"symbols": ["BTC", "ETH"], "category": "defi", "zoom": 120, "focus": "BTC"}
\`\`\`

MARKET CONTEXT (injected at runtime):
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
