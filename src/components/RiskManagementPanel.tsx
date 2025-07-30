import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

interface RiskMetrics {
  var: number;
  maxDrawdown: number;
  riskReturnRatio: number;
  dailyVolatility: number;
}

const mockData = {
  var: 15.2,
  maxDrawdown: 25.4,
  riskReturnRatio: 1.8,
  dailyVolatility: 3.2,
};

const performanceData = [
  { date: '2024-01', value: 100 },
  { date: '2024-02', value: 120 },
  { date: '2024-03', value: 110 },
  { date: '2024-04', value: 140 },
  { date: '2024-05', value: 130 },
  { date: '2024-06', value: 160 },
];

const RiskManagementPanel = () => {
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
              <span className="text-2xl font-bold">{mockData.var}%</span>
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
              <span className="text-2xl font-bold">{mockData.maxDrawdown}%</span>
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
              <span className="text-2xl font-bold">{mockData.riskReturnRatio}</span>
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
              <span className="text-2xl font-bold">{mockData.dailyVolatility}%</span>
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
      <Alert className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Alerta de Risco</AlertTitle>
        <AlertDescription>
          Sua exposição atual está acima do limite recomendado. Considere rebalancear seu portfólio.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RiskManagementPanel;