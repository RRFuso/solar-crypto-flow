// Optimization Report Generator - Structured reports with projections and recommendations

import { ApiUsageTracker, ApiStats, ApiMetrics } from './api-usage-tracker';

export interface ProjectionScenario {
  users: number;
  requestsPerDay: number;
  costPerDay: number;
  costPerMonth: number;
  savingsPerMonth: number;
}

export interface OptimizationReport {
  generatedAt: Date;
  period: '24h' | '7d' | '30d';
  sessionDurationMinutes: number;
  
  // Overall metrics
  metrics: ApiStats;
  
  // Breakdown by API
  byApi: Record<string, ApiMetrics>;
  
  // Projections
  projections: {
    users100: ProjectionScenario;
    users1000: ProjectionScenario;
    users10000: ProjectionScenario;
  };
  
  // Recommendations
  recommendations: string[];
}

// Generate projection for a given user count
function projectScenario(
  stats: ApiStats,
  sessionMinutes: number,
  userCount: number
): ProjectionScenario {
  // Requests per minute per user
  const requestsPerMinute = sessionMinutes > 0 
    ? stats.totalRequests / sessionMinutes 
    : 0;
  
  // Scale to daily (1440 minutes per day)
  const requestsPerDay = Math.round(requestsPerMinute * 1440 * userCount);
  
  // Average cost per live request
  const avgCostPerLiveRequest = stats.liveRequests > 0 
    ? stats.totalCost / stats.liveRequests 
    : 0;
  
  // Estimate daily cost with cache
  const liveRatio = 1 - stats.cacheHitRate;
  const dailyLiveRequests = requestsPerDay * liveRatio;
  const costPerDay = dailyLiveRequests * avgCostPerLiveRequest;
  
  // Monthly projections
  const costPerMonth = costPerDay * 30;
  
  // Savings from cache
  const costWithoutCache = requestsPerDay * avgCostPerLiveRequest * 30;
  const savingsPerMonth = costWithoutCache - costPerMonth;

  return {
    users: userCount,
    requestsPerDay,
    costPerDay: Math.round(costPerDay * 10000) / 10000,
    costPerMonth: Math.round(costPerMonth * 100) / 100,
    savingsPerMonth: Math.round(savingsPerMonth * 100) / 100,
  };
}

// Generate automatic recommendations based on stats
function generateRecommendations(
  stats: ApiStats,
  byApi: Record<string, ApiMetrics>
): string[] {
  const recommendations: string[] = [];

  // Cache hit rate recommendations
  if (stats.cacheHitRate < 0.3) {
    recommendations.push(
      '🔴 Hit rate crítico (< 30%). Implemente caching agressivo com Redis para todas as APIs.'
    );
  } else if (stats.cacheHitRate < 0.6) {
    recommendations.push(
      '🟡 Hit rate baixo (< 60%). Considere aumentar TTL do cache para dados menos voláteis.'
    );
  } else if (stats.cacheHitRate >= 0.8) {
    recommendations.push(
      '🟢 Excelente hit rate (≥ 80%). O sistema de cache está funcionando bem.'
    );
  }

  // Live vs cached ratio
  if (stats.liveRequests > stats.cachedRequests * 2) {
    recommendations.push(
      '⚠️ Muitas requisições live. Revise estratégia de pré-cache e warm-up.'
    );
  }

  // API-specific recommendations
  for (const [api, metrics] of Object.entries(byApi)) {
    if (metrics.cacheHitRate < 0.5 && metrics.requests > 10) {
      recommendations.push(
        `📊 ${api.toUpperCase()}: Hit rate de ${Math.round(metrics.cacheHitRate * 100)}%. Aumente TTL ou implemente cache mais agressivo.`
      );
    }
    
    if (metrics.avgResponseTime > 1000 && metrics.requests > 5) {
      recommendations.push(
        `⏱️ ${api.toUpperCase()}: Tempo médio de ${Math.round(metrics.avgResponseTime)}ms. Considere cache ou otimização.`
      );
    }
  }

  // Cost recommendations
  if (stats.totalCost > 0.1) {
    recommendations.push(
      `💰 Custo atual: $${stats.totalCost.toFixed(4)}. Economia potencial: $${stats.savings.toFixed(4)} (${stats.savingsPercentage.toFixed(1)}%).`
    );
  }

  // WebSocket recommendation
  const hasWebSocket = byApi['websocket'];
  if (!hasWebSocket && stats.totalRequests > 100) {
    recommendations.push(
      '🔌 Considere WebSocket para dados em tempo real ao invés de polling.'
    );
  }

  // General optimizations
  if (stats.totalRequests > 500 && stats.cacheHitRate < 0.7) {
    recommendations.push(
      '🚀 Alto volume de requisições. Implemente batch requests e deduplicação.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Sistema otimizado. Continue monitorando métricas.');
  }

  return recommendations;
}

// Generate full optimization report
export function generateOptimizationReport(
  period: '24h' | '7d' | '30d' = '24h'
): OptimizationReport {
  const tracker = ApiUsageTracker;
  const stats = tracker.getStats(period);
  const byApi = tracker.getStatsByApi(period);
  const sessionMinutes = tracker.getSessionDuration();

  const report: OptimizationReport = {
    generatedAt: new Date(),
    period,
    sessionDurationMinutes: Math.round(sessionMinutes),
    metrics: stats,
    byApi,
    projections: {
      users100: projectScenario(stats, sessionMinutes, 100),
      users1000: projectScenario(stats, sessionMinutes, 1000),
      users10000: projectScenario(stats, sessionMinutes, 10000),
    },
    recommendations: generateRecommendations(stats, byApi),
  };

  return report;
}

// Export to JSON
export function exportReportToJSON(report: OptimizationReport): string {
  return JSON.stringify(report, null, 2);
}

// Export to CSV
export function exportReportToCSV(report: OptimizationReport): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Optimization Report');
  lines.push(`Generated At,${report.generatedAt.toISOString()}`);
  lines.push(`Period,${report.period}`);
  lines.push(`Session Duration (min),${report.sessionDurationMinutes}`);
  lines.push('');
  
  // Overall Metrics
  lines.push('Overall Metrics');
  lines.push('Metric,Value');
  lines.push(`Total Requests,${report.metrics.totalRequests}`);
  lines.push(`Cached Requests,${report.metrics.cachedRequests}`);
  lines.push(`Live Requests,${report.metrics.liveRequests}`);
  lines.push(`Cache Hit Rate,${(report.metrics.cacheHitRate * 100).toFixed(2)}%`);
  lines.push(`Total Cost,$${report.metrics.totalCost.toFixed(4)}`);
  lines.push(`Est. Cost Without Cache,$${report.metrics.estimatedCostWithoutCache.toFixed(4)}`);
  lines.push(`Savings,$${report.metrics.savings.toFixed(4)}`);
  lines.push(`Savings Percentage,${report.metrics.savingsPercentage.toFixed(2)}%`);
  lines.push('');
  
  // By API
  lines.push('By API');
  lines.push('API,Requests,Cached,Live,Hit Rate,Cost,Avg Response Time');
  for (const [api, metrics] of Object.entries(report.byApi)) {
    lines.push(
      `${api},${metrics.requests},${metrics.cached},${metrics.live},${(metrics.cacheHitRate * 100).toFixed(2)}%,$${metrics.cost.toFixed(4)},${metrics.avgResponseTime.toFixed(0)}ms`
    );
  }
  lines.push('');
  
  // Projections
  lines.push('Projections');
  lines.push('Users,Requests/Day,Cost/Day,Cost/Month,Savings/Month');
  const projections = [
    report.projections.users100,
    report.projections.users1000,
    report.projections.users10000,
  ];
  for (const p of projections) {
    lines.push(
      `${p.users},${p.requestsPerDay},$${p.costPerDay},$${p.costPerMonth},$${p.savingsPerMonth}`
    );
  }
  lines.push('');
  
  // Recommendations
  lines.push('Recommendations');
  for (const rec of report.recommendations) {
    lines.push(`"${rec}"`);
  }

  return lines.join('\n');
}

// Export to Markdown
export function exportReportToMarkdown(report: OptimizationReport): string {
  const lines: string[] = [];
  
  lines.push('# Relatório de Otimização de API');
  lines.push('');
  lines.push(`**Gerado em:** ${report.generatedAt.toLocaleString('pt-BR')}`);
  lines.push(`**Período:** ${report.period}`);
  lines.push(`**Duração da Sessão:** ${report.sessionDurationMinutes} minutos`);
  lines.push('');
  
  // Overall Metrics
  lines.push('## Métricas Gerais');
  lines.push('');
  lines.push('| Métrica | Valor |');
  lines.push('|---------|-------|');
  lines.push(`| Total de Requisições | ${report.metrics.totalRequests} |`);
  lines.push(`| Requisições em Cache | ${report.metrics.cachedRequests} |`);
  lines.push(`| Requisições Live | ${report.metrics.liveRequests} |`);
  lines.push(`| Cache Hit Rate | ${(report.metrics.cacheHitRate * 100).toFixed(2)}% |`);
  lines.push(`| Custo Total | $${report.metrics.totalCost.toFixed(4)} |`);
  lines.push(`| Custo Estimado (sem cache) | $${report.metrics.estimatedCostWithoutCache.toFixed(4)} |`);
  lines.push(`| Economia | $${report.metrics.savings.toFixed(4)} |`);
  lines.push(`| Economia (%) | ${report.metrics.savingsPercentage.toFixed(2)}% |`);
  lines.push('');
  
  // By API
  lines.push('## Por API');
  lines.push('');
  lines.push('| API | Requests | Cached | Live | Hit Rate | Custo | Tempo Médio |');
  lines.push('|-----|----------|--------|------|----------|-------|-------------|');
  for (const [api, metrics] of Object.entries(report.byApi)) {
    lines.push(
      `| ${api} | ${metrics.requests} | ${metrics.cached} | ${metrics.live} | ${(metrics.cacheHitRate * 100).toFixed(1)}% | $${metrics.cost.toFixed(4)} | ${metrics.avgResponseTime.toFixed(0)}ms |`
    );
  }
  lines.push('');
  
  // Projections
  lines.push('## Projeções de Escala');
  lines.push('');
  lines.push('| Usuários | Req/Dia | Custo/Dia | Custo/Mês | Economia/Mês |');
  lines.push('|----------|---------|-----------|-----------|--------------|');
  const projections = [
    report.projections.users100,
    report.projections.users1000,
    report.projections.users10000,
  ];
  for (const p of projections) {
    lines.push(
      `| ${p.users.toLocaleString()} | ${p.requestsPerDay.toLocaleString()} | $${p.costPerDay.toFixed(2)} | $${p.costPerMonth.toFixed(2)} | $${p.savingsPerMonth.toFixed(2)} |`
    );
  }
  lines.push('');
  
  // Recommendations
  lines.push('## Recomendações');
  lines.push('');
  for (const rec of report.recommendations) {
    lines.push(`- ${rec}`);
  }

  return lines.join('\n');
}

// Download report as file
export function downloadReport(
  report: OptimizationReport,
  format: 'json' | 'csv' | 'md'
): void {
  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'json':
      content = exportReportToJSON(report);
      mimeType = 'application/json';
      extension = 'json';
      break;
    case 'csv':
      content = exportReportToCSV(report);
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    case 'md':
      content = exportReportToMarkdown(report);
      mimeType = 'text/markdown';
      extension = 'md';
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `optimization-report-${report.period}-${Date.now()}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
