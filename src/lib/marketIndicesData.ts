
import { MarketIndex, IndexFlowData, IndexRotationResult } from '@/types/indices';

// Índices de mercado com seus símbolos
const marketIndices: MarketIndex[] = [
  { id: 'SP500', name: 'S&P 500', symbol: '^GSPC', color: '#4f46e5' },
  { id: 'NASDAQ', name: 'Nasdaq', symbol: '^IXIC', color: '#06b6d4' },
  { id: 'DOW', name: 'Dow Jones', symbol: '^DJI', color: '#10b981' },
  { id: 'RUSSELL', name: 'Russell 2000', symbol: '^RUT', color: '#f59e0b' },
  { id: 'GOLD', name: 'Ouro', symbol: 'GC=F', color: '#f7bd16' }
];

// URL base para a API Alpha Vantage
const ALPHA_VANTAGE_API_URL = 'https://www.alphavantage.co/query';
const ALPHA_VANTAGE_API_KEY = 'demo'; // Use uma chave de API real em produção

// Função para obter dados de um índice específico
async function fetchIndexData(symbol: string, period: string = '7d'): Promise<any> {
  try {
    let interval = 'daily'; // padrão
    let outputSize = 'compact'; // últimos 100 pontos de dados
    
    // Ajustar intervalo com base no período solicitado
    if (period === '1d') {
      interval = 'intraday';
      outputSize = 'full';
    } else if (period === '7d') {
      outputSize = 'compact'; // últimos 100 pontos
    } else if (period === '30d' || period === '90d') {
      outputSize = 'full'; // dados completos
    }
    
    const functionName = interval === 'intraday' ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY';
    const intervalParam = interval === 'intraday' ? '&interval=60min' : '';
    
    const url = `${ALPHA_VANTAGE_API_URL}?function=${functionName}&symbol=${symbol}${intervalParam}&outputsize=${outputSize}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao buscar dados para ${symbol}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erro ao buscar dados para ${symbol}:`, error);
    return null;
  }
}

// Processar dados brutos da API para o formato necessário
function processRawData(data: any, symbol: string, period: string): { values: number[], changes: number[] } {
  if (!data) return { values: [], changes: [] };
  
  let timeSeries = data['Time Series (Daily)'];
  if (period === '1d') {
    timeSeries = data['Time Series (60min)'];
  }
  
  if (!timeSeries) {
    console.error('Formato de dados inválido:', data);
    return { values: [], changes: [] };
  }
  
  // Ordenar por data (mais recente primeiro)
  const dates = Object.keys(timeSeries).sort().reverse();
  
  // Limitar o número de pontos de dados com base no período
  const dataPointsLimit = period === '1d' ? 24 : 
                         period === '7d' ? 7 : 
                         period === '30d' ? 30 : 90;
  
  const limitedDates = dates.slice(0, dataPointsLimit);
  
  // Extrair valores de fechamento
  const values = limitedDates.map(date => {
    // Formato pode variar entre intraday e daily
    return parseFloat(timeSeries[date]['4. close'] || timeSeries[date]['close']);
  });
  
  // Calcular mudanças percentuais
  const changes = [];
  for (let i = 1; i < values.length; i++) {
    const change = ((values[i] - values[i-1]) / values[i-1]) * 100;
    changes.push(Number(change.toFixed(2)));
  }
  
  return { values, changes };
}

// Detectar fluxos de capital entre índices
function detectCapitalFlows(indicesData: Record<string, { values: number[], changes: number[] }>): IndexFlowData[] {
  const flows: IndexFlowData[] = [];
  const indices = Object.keys(indicesData);
  const latestChanges: Record<string, number> = {};
  
  // Obter última variação percentual para cada índice
  indices.forEach(index => {
    const changes = indicesData[index].changes;
    latestChanges[index] = changes.length > 0 ? changes[changes.length - 1] : 0;
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
  
  // Garantir que temos pelo menos alguns fluxos para visualização
  if (flows.length === 0 && indices.length >= 2) {
    // Criar pelo menos um fluxo entre o pior e o melhor desempenho
    flows.push({
      from: sortedIndices[sortedIndices.length - 1],
      to: sortedIndices[0],
      value: 10, // Valor default
      percentage: latestChanges[sortedIndices[0]] - latestChanges[sortedIndices[sortedIndices.length - 1]]
    });
  }
  
  return flows;
}

// Função principal para buscar e analisar dados de mercado
export async function fetchMarketRotationData(period: string = '7d'): Promise<IndexRotationResult> {
  try {
    // Armazenar dados processados para cada índice
    const indicesData: Record<string, { values: number[], changes: number[] }> = {};
    
    // Buscar dados para cada índice
    for (const index of marketIndices) {
      const rawData = await fetchIndexData(index.symbol, period);
      indicesData[index.id] = processRawData(rawData, index.symbol, period);
    }
    
    // Se houver falha na API, use dados simulados para fins de teste
    const useSimulatedData = Object.values(indicesData).some(data => data.values.length === 0);
    
    if (useSimulatedData) {
      console.warn("Usando dados simulados devido a falhas na API ou limites de requisição");
      return generateSimulatedData(period);
    }
    
    // Atualizar índices com valores e variações reais
    const updatedIndices = marketIndices.map(index => {
      const indexData = indicesData[index.id];
      const values = indexData.values;
      
      if (values.length === 0) return { ...index };
      
      const latestValue = values[0];
      const previousValue = values[1] || latestValue * 0.99; // Fallback se não houver valor anterior
      const change = ((latestValue - previousValue) / previousValue) * 100;
      
      return {
        ...index,
        value: latestValue,
        change: Number(change.toFixed(2)),
        marketCap: latestValue * 1000000, // Simulação de market cap
        volume: latestValue * 10000 * Math.random() // Simulação de volume
      };
    });
    
    // Detectar fluxos de capital
    const flows = detectCapitalFlows(indicesData);
    
    return {
      indices: updatedIndices,
      flows,
      timestamp: new Date().toISOString(),
      period
    };
    
  } catch (error) {
    console.error("Erro ao buscar dados de rotação do mercado:", error);
    // Em caso de erro, retornar dados simulados como fallback
    return generateSimulatedData(period);
  }
}

// Função para gerar dados simulados (mantida como fallback)
function generateSimulatedData(period: string): IndexRotationResult {
  // Dados históricos simulados
  const mockHistoricalData = {
    'SP500': [9950, 10000, 10050, 10100, 10150, 10200, 10250],
    'NASDAQ': [14900, 15000, 15100, 15050, 15000, 15200, 15300],
    'DOW': [34800, 35000, 35100, 35050, 35000, 34900, 35100],
    'RUSSELL': [1990, 2000, 2010, 2020, 2000, 1980, 1970],
    'GOLD': [1890, 1900, 1910, 1920, 1930, 1940, 1950]
  };

  // Calcular variações percentuais
  const percentageChanges: Record<string, number[]> = {};
  for (const [index, values] of Object.entries(mockHistoricalData)) {
    percentageChanges[index] = [];
    for (let i = 1; i < values.length; i++) {
      const change = ((values[i] - values[i-1]) / values[i-1]) * 100;
      percentageChanges[index].push(Number(change.toFixed(2)));
    }
  }
  
  // Atualizar índices simulados com valores e variações
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
  
  // Calcular flows simulados
  const flows: IndexFlowData[] = [];
  const topPerformer = updatedIndices.reduce((prev, curr) => 
    (curr.change || 0) > (prev.change || 0) ? curr : prev, updatedIndices[0]);
    
  const worstPerformer = updatedIndices.reduce((prev, curr) => 
    (curr.change || 0) < (prev.change || 0) ? curr : prev, updatedIndices[0]);
    
  // Adicionar fluxo direto do pior para o melhor desempenho
  if (topPerformer.id !== worstPerformer.id) {
    flows.push({
      from: worstPerformer.id,
      to: topPerformer.id,
      value: Math.abs((worstPerformer.change || 0) - (topPerformer.change || 0)) * 5,
      percentage: (topPerformer.change || 0) - (worstPerformer.change || 0)
    });
  }
  
  // Detectar correlações negativas entre ativos
  updatedIndices.forEach((idx1, i) => {
    updatedIndices.forEach((idx2, j) => {
      if (i < j) {
        const change1 = idx1.change || 0;
        const change2 = idx2.change || 0;
        
        // Se um subiu e o outro caiu significativamente
        if ((change1 > 1 && change2 < -1) || (change1 < -1 && change2 > 1)) {
          flows.push({
            from: change1 < change2 ? idx1.id : idx2.id,
            to: change1 < change2 ? idx2.id : idx1.id,
            value: Math.abs(change1 - change2) * 3,
            percentage: Math.abs(change1 - change2)
          });
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
