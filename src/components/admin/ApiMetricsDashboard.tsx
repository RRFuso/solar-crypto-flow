
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useUserRole } from '@/hooks/useUserRole';
import { ApiUsageTracker, ApiStats, ApiMetrics } from '@/services/api-usage-tracker';
import { generateOptimizationReport, exportReportToMarkdown, exportReportToCSV, OptimizationReport } from '@/services/optimization-report';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { 
  Activity, Database, DollarSign, TrendingUp, Download, 
  RefreshCw, Clock, Zap, AlertTriangle, CheckCircle, Shield
} from 'lucide-react';

type Period = '24h' | '7d' | '30d';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ApiMetricsDashboardProps {
  className?: string;
}

const ApiMetricsDashboard: React.FC<ApiMetricsDashboardProps> = ({ className }) => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [period, setPeriod] = useState<Period>('24h');
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [byApi, setByApi] = useState<Record<string, ApiMetrics>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh data every 5 seconds
  useEffect(() => {
    const updateStats = () => {
      setStats(ApiUsageTracker.getStats(period));
      setByApi(ApiUsageTracker.getStatsByApi(period));
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [period, refreshKey]);

  const chartData = useMemo(() => {
    return Object.entries(byApi).map(([api, metrics]) => ({
      name: api.toUpperCase(),
      requests: metrics.requests,
      cached: metrics.cached,
      live: metrics.live,
      cost: metrics.cost,
      hitRate: Math.round(metrics.cacheHitRate * 100),
    }));
  }, [byApi]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Cached', value: stats.cachedRequests, color: '#22c55e' },
      { name: 'Live', value: stats.liveRequests, color: '#ef4444' },
    ];
  }, [stats]);

  const handleExportMarkdown = () => {
    const reportData = generateOptimizationReport(period);
    const markdown = exportReportToMarkdown(reportData);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-metrics-${period}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const reportData = generateOptimizationReport(period);
    const csv = exportReportToCSV(reportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-metrics-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (confirm('Limpar todos os logs de API? Esta ação não pode ser desfeita.')) {
      ApiUsageTracker.clearLogs();
      setRefreshKey((k) => k + 1);
    }
  };

  // Admin-only access
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
          <Shield className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Acesso restrito a administradores.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const sessionMinutes = ApiUsageTracker.getSessionDuration();
  const report = generateOptimizationReport(period);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            API Metrics Dashboard
          </h2>
          <p className="text-muted-foreground text-sm">
            Monitoramento em tempo real do consumo de APIs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalRequests.toLocaleString()}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold text-foreground">{(stats.cacheHitRate * 100).toFixed(1)}%</p>
              </div>
              <Zap className="w-8 h-8 text-green-500/50" />
            </div>
            <Progress value={stats.cacheHitRate * 100} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Custo Total</p>
                <p className="text-2xl font-bold text-foreground">${stats.totalCost.toFixed(4)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Economia</p>
                <p className="text-2xl font-bold text-foreground">${stats.savings.toFixed(4)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500/50" />
            </div>
            <p className="text-xs text-emerald-500 mt-1">
              {stats.savingsPercentage.toFixed(0)}% economizado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by API */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Requests por API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="cached" name="Cached" fill="#22c55e" stackId="a" />
                  <Bar dataKey="live" name="Live" fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cache Distribution Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição de Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">
                  Cached: {stats.cachedRequests.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">
                  Live: {stats.liveRequests.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Hit Rate by API */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cache Hit Rate por API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} unit="%" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                  formatter={(value: number) => [`${value}%`, 'Hit Rate']}
                />
                <Area 
                  type="monotone" 
                  dataKey="hitRate" 
                  stroke="#22c55e" 
                  fill="url(#colorHitRate)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorHitRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Projections */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Projeções de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(report.projections).map(([key, scenario]) => (
              <div key={key} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{scenario.users} usuários</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requests/dia:</span>
                    <span className="font-medium">{scenario.requestsPerDay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo/mês:</span>
                    <span className="font-medium">${scenario.costPerMonth.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-500">
                    <span>Economia/mês:</span>
                    <span className="font-medium">${scenario.savingsPerMonth.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
          <Download className="w-4 h-4 mr-2" />
          Export Markdown
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        <Button variant="destructive" size="sm" onClick={handleClearLogs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Limpar Logs
        </Button>
        <div className="flex-1" />
        <Badge variant="secondary" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Sessão: {sessionMinutes.toFixed(0)} min
        </Badge>
      </div>
    </div>
  );
};

export default ApiMetricsDashboard;
