import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const functions = [
  'crypto-data-collector',
  'dune-fetch',
  'populate-crypto-signals',
  'populate-cryptocurrencies',
  'populate-multiple-price-history',
  'populate-price-history',
  'populate-watchlist-signals',
];

const DataPopulationPanel: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, any> | null>(null);

  const invokeFunction = async (functionName: string) => {
    setLoading(functionName);
    setResult(null);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Function invocation failed with status ${response.status}: ${JSON.stringify(data)}`);
      }

      setResult({ functionName, data });
    } catch (error: any) {
      setResult({ functionName, error: error.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Data Population</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {functions.map((func) => (
          <Button 
            key={func}
            onClick={() => invokeFunction(func)}
            disabled={loading === func}
          >
            {loading === func ? 'Loading...' : `Invoke ${func}`}
          </Button>
        ))}
      </div>
      {result && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Result for {result.functionName}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm">
              {JSON.stringify(result.data || result.error, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataPopulationPanel;