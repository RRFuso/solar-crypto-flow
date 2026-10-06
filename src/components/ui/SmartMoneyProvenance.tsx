import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getFlowProvenance, normalizeConfidence } from '@/hooks/useSmartMoneyFlows';

const STATUS_LABEL = {
  valid: { text: 'Atual', cls: 'text-green-400' },
  stale: { text: 'Desatualizado', cls: 'text-yellow-400' },
  no_data: { text: 'Sem dados', cls: 'text-slate-400' },
} as const;

function formatAge(ms: number | null): string {
  if (ms === null) return '—';
  const min = Math.round(ms / 60000);
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `há ${h} h` : `há ${Math.round(h / 24)} dias`;
}

/** Shows status, age, source and coverage of the smart-money flow for one symbol. */
export const SmartMoneyProvenance: React.FC<{ symbol: string }> = ({ symbol }) => {
  const sym = symbol.toUpperCase();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sm-provenance', sym],
    staleTime: 90_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smart_money_flow_cache')
        .select('last_updated, dominant_direction, confidence_score, confidence_factors, whale_tx_count')
        .eq('token_symbol', sym)
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return null;

  const prov = getFlowProvenance(isError ? null : data?.last_updated);
  const status = STATUS_LABEL[prov.status];
  const factors = (data?.confidence_factors ?? {}) as Record<string, number>;
  const coverage = factors.historicalPriceCoverage;
  const direction = data?.dominant_direction === 'bullish'
    ? 'Saída líquida de exchanges'
    : data?.dominant_direction === 'bearish'
      ? 'Entrada líquida em exchanges'
      : 'Sem direção clara';

  return (
    <div className="border-t border-slate-700 pt-2 mt-2 text-xs space-y-1">
      <h4 className="font-bold text-slate-300">Fluxo de carteiras rastreadas</h4>
      <div className="flex justify-between">
        <span className="text-slate-400">Status:</span>
        <span className={`font-semibold ${status.cls}`}>{isError ? 'Erro na fonte' : status.text}</span>
      </div>
      {prov.status !== 'no_data' && (
        <>
          <div className="flex justify-between">
            <span className="text-slate-400">Observado:</span>
            <span className="font-mono">{formatAge(prov.ageMs)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Leitura:</span>
            <span>{direction}</span>
          </div>
          {prov.status === 'valid' && (
            <div className="flex justify-between">
              <span className="text-slate-400">Confiança (heurística):</span>
              <span className="font-mono">{normalizeConfidence(data?.confidence_score)}%</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Preço da hora do evento:</span>
            <span className="font-mono">{typeof coverage === 'number' ? `${coverage}% das transações` : 'não informado'}</span>
          </div>
        </>
      )}
      <p className="text-[10px] text-slate-500 leading-snug">
        Fonte: rastreador on-chain (Alchemy/Etherscan/BscScan/Solscan). Movimento de exchange é indício, não prova de compra ou venda.
      </p>
    </div>
  );
};
