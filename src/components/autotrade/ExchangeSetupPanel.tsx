
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { exchangeManager, ExchangeConfig } from '@/lib/autotrade/exchanges';
import { useSecureStorage } from '@/hooks/useSecureStorage';
import { toast } from 'sonner';
import { Shield, Check, AlertTriangle } from 'lucide-react';

export const ExchangeSetupPanel: React.FC = () => {
  const [exchangeId, setExchangeId] = useState('binance');
  const [apiKey, setApiKey] = useSecureStorage(`exchange_${exchangeId}_key`);
  const [apiSecret, setApiSecret] = useSecureStorage(`exchange_${exchangeId}_secret`);
  const [testMode, setTestMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');

  const supportedExchanges = [
    { id: 'binance', name: 'Binance' },
    { id: 'coinbase', name: 'Coinbase Pro' },
    { id: 'kucoin', name: 'KuCoin' },
    { id: 'bybit', name: 'Bybit' },
    { id: 'kraken', name: 'Kraken' }
  ];

  const handleTest = async () => {
    if (!apiKey || !apiSecret) {
      toast.error('Credenciais necessárias', {
        description: 'Por favor, insira sua API Key e Secret'
      });
      return;
    }

    setIsLoading(true);
    try {
      const config: ExchangeConfig = {
        id: exchangeId,
        name: exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1),
        apiKey,
        apiSecret,
        testMode
      };

      await exchangeManager.initializeExchange(config);
      
      // Testar conexão buscando saldo
      await exchangeManager.fetchBalance(exchangeId);
      
      setConnectionStatus('connected');
      toast.success('Conexão estabelecida!', {
        description: `Exchange ${config.name} configurado com sucesso`
      });
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Erro na conexão', {
        description: `Falha ao conectar com ${exchangeId}: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado';
      case 'error':
        return 'Erro de Conexão';
      default:
        return 'Não Testado';
    }
  };

  return (
    <Card className="bg-slate-800/30 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Configurar Exchange</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Exchange</Label>
          <Select value={exchangeId} onValueChange={setExchangeId}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedExchanges.map(exchange => (
                <SelectItem key={exchange.id} value={exchange.id}>
                  {exchange.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">API Key</Label>
          <Input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white"
            placeholder="Sua API Key"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">API Secret</Label>
          <Input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white"
            placeholder="Seu API Secret"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch checked={testMode} onCheckedChange={setTestMode} />
          <Label className="text-slate-300">Modo de Teste (Testnet/Sandbox)</Label>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700/30">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm text-slate-300">Status: {getStatusText()}</span>
          </div>
        </div>

        <Button
          onClick={handleTest}
          disabled={isLoading || !apiKey || !apiSecret}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white"
        >
          {isLoading ? 'Testando Conexão...' : 'Testar Conexão'}
        </Button>

        <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded">
          <p className="text-xs text-blue-300">
            <strong>Importante:</strong> Suas credenciais são armazenadas de forma segura e criptografada. 
            Para trading ao vivo, certifique-se de configurar 2FA em sua conta.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExchangeSetupPanel;
