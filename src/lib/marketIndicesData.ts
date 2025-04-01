
import { MarketIndex, IndexFlowData, IndexRotationResult } from '@/types/indices';

// Índices de mercado com seus símbolos
const marketIndices: MarketIndex[] = [
  { id: 'SP500', name: 'S&P 500', symbol: '^GSPC', color: '#4f46e5' },
  { id: 'NASDAQ', name: 'Nasdaq', symbol: '^IXIC', color: '#06b6d4' },
  { id: 'DOW', name: 'Dow Jones', symbol: '^DJI', color: '#10b981' },
  { id: 'RUSSELL', name: 'Russell 2000', symbol: '^RUT', color: '#f59e0b' },
  { id: 'GOLD', name: 'Ouro', symbol: 'GC=F', color: '#f7bd16' }
];

// Dados simulados para desenvolvimento
const mockHistoricalData = {
  'SP500': [9950, 10000, 10050, 10100, 10150, 10200, 10250],
  'NASDAQ': [14900, 15000, 15100, 15050, 15000, 15200, 15300],
  'DOW': [34800, 35000, 35100, 35050, 35000, 34900, 35100],
  'RUSSELL': [1990, 2000, 2010, 2020, 2000, 1980, 1970],
  'GOLD': [1890, 1900, 1910, 1920, 1930, 1940, 1950]
};

// Calcular variações percentuais
function calculatePercentageChanges(data: Record<string, number[]>): Record<string, number[]> {
  const percentageChanges: Record<string, number[]> = {};
  
  for (const [index, values] of Object.entries(data)) {
    percentageChanges[index] = [];
    for (let i = 1; i < values.length; i++) {
      const change = ((values[i] - values[i-1]) / values[i-1]) * 100;
      percentageChanges[index].push(Number(change.toFixed(2)));
    }
  }
  
  return percentageChanges;
}

// Detectar fluxos de capital entre índices
function detectCapitalFlows(percentageChanges: Record<string, number[]>): IndexFlowData[] {
  const flows: IndexFlowData[] = [];
  const indices = Object.keys(percentageChanges);
  const latestChanges: Record<string, number> = {};
  
  // Obter última variação percentual para cada índice
  indices.forEach(index => {
    const changes = percentageChanges[index];
    latestChanges[index] = changes[changes.length - 1];
  });
  
  // Ordenar índices por desempenho
  const sortedIndices = [...indices].sort((a, b) => latestChanges[b] - latestChanges[a]);
  
  // Criar fluxos dos piores para os melhores desempenhos
  for (let i = sortedIndices.length - 1; i > 0; i--) {
    const fromIndex = sortedIndices[i];
    const toIndex = sortedIndices[0]; // Melhor desempenho
    
    if (latestChanges[fromIndex] < 0 && latestChanges[toIndex] > 0) {
      flows.push({
        from: fromIndex,
        to: toIndex,
        value: Math.abs(latestChanges[fromIndex]) * 10, // Escala para visualização
        percentage: latestChanges[toIndex] - latestChanges[fromIndex]
      });
    }
  }
  
  // Se não houver desempenhos negativos, detectar fluxos entre positivos mais fracos e mais fortes
  if (flows.length === 0) {
    for (let i = sortedIndices.length - 1; i > 0; i--) {
      const fromIndex = sortedIndices[i];
      const toIndex = sortedIndices[0];
      
      if (latestChanges[toIndex] > latestChanges[fromIndex]) {
        flows.push({
          from: fromIndex,
          to: toIndex,
          value: (latestChanges[toIndex] - latestChanges[fromIndex]) * 5, // Escala para visualização
          percentage: latestChanges[toIndex] - latestChanges[fromIndex]
        });
      }
    }
  }
  
  return flows;
}

// Função principal para buscar e analisar dados de mercado
export async function fetchMarketRotationData(period: string = '7d'): Promise<IndexRotationResult> {
  // Em uma implementação real, isso buscaria dados de uma API
  // Por enquanto, usando dados simulados
  
  // Atualizar índices simulados com valores e variações recentes
  const updatedIndices = marketIndices.map(index => {
    const values = mockHistoricalData[index.id as keyof typeof mockHistoricalData];
    const latestValue = values[values.length - 1];
    const previousValue = values[values.length - 2];
    const change = ((latestValue - previousValue) / previousValue) * 100;
    
    // Adicionar aleatoriedade para dinamizar a visualização
    const randomFactor = (Math.random() * 4) - 2; // Entre -2% e +2%
    const adjustedChange = change + randomFactor;
    
    return {
      ...index,
      value: latestValue,
      change: Number(adjustedChange.toFixed(2)),
      marketCap: latestValue * 1000000, // Simulação de market cap
      volume: latestValue * 10000 * Math.random() // Simulação de volume
    };
  });
  
  // Calcular variações percentuais para análise
  const percentageChanges = calculatePercentageChanges(mockHistoricalData);
  
  // Detectar fluxos de capital
  const flows = detectCapitalFlows(percentageChanges);
  
  // Adicionar mais fluxos para enriquecer a visualização
  const topPerformer = updatedIndices.reduce((prev, curr) => 
    (curr.change || 0) > (prev.change || 0) ? curr : prev, updatedIndices[0]);
    
  const worstPerformer = updatedIndices.reduce((prev, curr) => 
    (curr.change || 0) < (prev.change || 0) ? curr : prev, updatedIndices[0]);
    
  // Adicionar fluxo direto do pior para o melhor desempenho
  if (topPerformer.id !== worstPerformer.id) {
    const flowAlreadyExists = flows.some(
      flow => flow.from === worstPerformer.id && flow.to === topPerformer.id
    );
    
    if (!flowAlreadyExists && (worstPerformer.change || 0) < 0 && (topPerformer.change || 0) > 0) {
      flows.push({
        from: worstPerformer.id,
        to: topPerformer.id,
        value: Math.abs((worstPerformer.change || 0) - (topPerformer.change || 0)) * 5,
        percentage: (topPerformer.change || 0) - (worstPerformer.change || 0)
      });
    }
  }
  
  // Detectar correlações negativas entre ativos
  updatedIndices.forEach((idx1, i) => {
    updatedIndices.forEach((idx2, j) => {
      if (i < j) {
        const change1 = idx1.change || 0;
        const change2 = idx2.change || 0;
        
        // Se um subiu e o outro caiu significativamente
        if ((change1 > 1 && change2 < -1) || (change1 < -1 && change2 > 1)) {
          const from = change1 < change2 ? idx1.id : idx2.id;
          const to = change1 < change2 ? idx2.id : idx1.id;
          
          const flowAlreadyExists = flows.some(
            flow => flow.from === from && flow.to === to
          );
          
          if (!flowAlreadyExists) {
            flows.push({
              from,
              to,
              value: Math.abs(change1 - change2) * 3,
              percentage: Math.abs(change1 - change2)
            });
          }
        }
      }
    });
  });
  
  return {
    indices: updatedIndices,
    flows,
    timestamp: new Date().toISOString(),
    period
  };
}
