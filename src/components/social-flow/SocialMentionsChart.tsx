
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MentionTimeSeries } from '@/types/social';

interface SocialMentionsChartProps {
  mentions: MentionTimeSeries[];
}

const SocialMentionsChart = ({ mentions }: SocialMentionsChartProps) => {
  // Prepare chart data
  const chartData = mentions.map(dataPoint => ({
    time: new Date(dataPoint.timestamp).toLocaleTimeString(),
    ...dataPoint.symbols.reduce((acc, item) => {
      acc[item.symbol] = item.count;
      return acc;
    }, {} as Record<string, number>)
  }));

  // Get top 5 symbols for the chart
  const topSymbols = mentions.length > 0 
    ? [...mentions[mentions.length - 1].symbols]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(s => s.symbol)
    : [];

  // Chart colors
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          dataKey="time" 
          stroke="#999" 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          stroke="#999"
          tick={{ fontSize: 12 }} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#222', 
            border: '1px solid #444',
            borderRadius: '4px' 
          }}
        />
        <Legend />
        {topSymbols.map((symbol, index) => (
          <Line
            key={symbol}
            type="monotone"
            dataKey={symbol}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SocialMentionsChart;
