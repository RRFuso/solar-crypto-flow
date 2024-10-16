import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CryptoChart = ({ crypto }) => {
  // Simulated chart data - replace with actual TradingView API data
  const data = [
    { date: '2023-01', value: 100 },
    { date: '2023-02', value: 120 },
    { date: '2023-03', value: 110 },
    { date: '2023-04', value: 140 },
    { date: '2023-05', value: 130 },
    { date: '2023-06', value: 160 },
  ];

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">{crypto.name} vs BTC</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="date" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CryptoChart;