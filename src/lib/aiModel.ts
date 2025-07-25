import { createClient } from '@supabase/supabase-js';
import { CryptoFeatures } from "./featureExtractor";

// Inicialize o cliente Supabase com as credenciais do seu projeto
// É seguro expor essas chaves no frontend, pois o Supabase usa Row Level Security.
const supabaseUrl = 'https://bahshstcztvqmxiubslx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaHNoc3RjenR2cW14aXVic2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDk3OTAsImV4cCI6MjA2MzkyNTc5MH0.b1S3ABBoaqa6P63piIF_jJXtf9TAgKv37wf50Q4yBvA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Prediction {
  symbol: string;
  name?: string;
  bullish: boolean;
  confidence: number;
  factors: string[];
  timestamp: number;
  price?: string;
  explosivePotential?: 'High' | 'Medium' | 'Low' | 'None';
  isBreakout?: boolean;
  isExpansion?: boolean;
  isAccelerating?: boolean;
}

// Cache de previsões
const predictionCache = new Map<string, { prediction: Prediction; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

export function getCachedPrediction(symbol: string): Prediction | null {
  const cached = predictionCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.prediction;
  }
  return null;
}

export function storePrediction(prediction: Prediction): void {
  predictionCache.set(prediction.symbol, {
    prediction,
    timestamp: Date.now(),
  });
}

// Nova função para buscar a previsão da IA no backend
export async function getAIPrediction(crypto: CryptoFeatures): Promise<Prediction> {
  const cached = getCachedPrediction(crypto.symbol);
  if (cached) {
    return cached;
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-ai-signal', {
      body: { cryptoId: crypto.id },
    });

    if (error) {
      throw error;
    }

    // A resposta da função de backend
    const { signal, confidence } = data;

    const prediction: Prediction = {
      symbol: crypto.symbol,
      name: crypto.id,
      bullish: signal === 'buy',
      confidence: confidence,
      factors: [signal], // Fator simplificado por enquanto
      timestamp: Date.now(),
      price: crypto.price.toString(),
      // Os campos abaixo podem ser preenchidos com lógica adicional se necessário
      explosivePotential: 'None',
      isBreakout: false,
      isExpansion: false,
      isAccelerating: false,
    };

    storePrediction(prediction);
    return prediction;

  } catch (error) {
    console.error('Error fetching AI prediction:', error);
    // Retorna uma predição neutra em caso de erro
    return {
      symbol: crypto.symbol,
      name: crypto.id,
      bullish: false,
      confidence: 0.5,
      factors: ['Error'],
      timestamp: Date.now(),
      price: crypto.price.toString(),
      explosivePotential: 'None',
      isBreakout: false,
      isExpansion: false,
      isAccelerating: false,
    };
  }
}