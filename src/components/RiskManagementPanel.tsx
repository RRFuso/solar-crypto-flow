import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { useRiskMetrics } from '@/hooks/useRiskMetrics';

interface RiskMetrics {
  var: number;
  maxDrawdown: number;
  riskReturnRatio: number;
  dailyVolatility: number;
}

const RiskManagementPanel = () => {
  const { riskMetrics, performanceData, loading, riskLevel, riskAlert } = useRiskMetrics();
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!riskMetrics) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Dados Insuficientes</AlertTitle>
          <AlertDescription>
            Não há dados suficientes para calcular as métricas de risco. Comece fazendo algumas operações.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getRiskColor = (value: number, type: 'var' | 'drawdown' | 'ratio' | 'volatility') => {
    switch (type) {
      case 'var':
        return value > 10 ? 'text-red-500' : value > 5 ? 'text-yellow-500' : 'text-green-500';
      case 'drawdown':
        return value > 20 ? 'text-red-500' : value > 10 ? 'text-yellow-500' : 'text-green-500';
      case 'ratio':
        return value > 1.5 ? 'text-green-500' : value > 1 ? 'text-yellow-500' : 'text-red-500';
      case 'volatility':
        return value > 8 ? 'text-red-500' : value > 4 ? 'text-yellow-500' : 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Metrics Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Value at Risk (VaR)</CardTitle>
            <CardDescription>Potencial máximo de perda em 24h</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className={`text-2xl font-bold ${getRiskColor(riskMetrics.var, 'var')}`}>
                {riskMetrics.var.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Drawdown Máximo</CardTitle>
            <CardDescription>Maior queda histórica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className={`text-2xl font-bold ${getRiskColor(riskMetrics.maxDrawdown, 'drawdown')}`}>
                {riskMetrics.maxDrawdown.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risco/Retorno</CardTitle>
            <CardDescription>Relação entre volatilidade e retornos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className={`text-2xl font-bold ${getRiskColor(riskMetrics.riskReturnRatio, 'ratio')}`}>
                {riskMetrics.riskReturnRatio.toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Volatilidade Diária</CardTitle>
            <CardDescription>Variação média dos preços</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className={`text-2xl font-bold ${getRiskColor(riskMetrics.dailyVolatility, 'volatility')}`}>
                {riskMetrics.dailyVolatility.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Desempenho do Portfólio</CardTitle>
          <CardDescription>Evolução do valor total investido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Risk Alert */}
      {riskAlert && (
        <Alert className={`mt-4 ${riskLevel === 'high' ? 'border-red-500' : riskLevel === 'medium' ? 'border-yellow-500' : 'border-blue-500'}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {riskLevel === 'high' ? 'Alto Risco' : riskLevel === 'medium' ? 'Risco Moderado' : 'Baixo Risco'}
          </AlertTitle>
          <AlertDescription>
            {riskAlert}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RiskManagementPanel;