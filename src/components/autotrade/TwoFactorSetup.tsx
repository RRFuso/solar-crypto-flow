
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { twoFactorAuth } from '@/lib/security/twoFactorAuth';
import { Shield, Check, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  userId: string;
  onSetupComplete: (enabled: boolean) => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ userId, onSetupComplete }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [secretData, setSecretData] = useState<{
    secret: string;
    otpAuthUrl: string;
    qrCodeUrl: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSecret = async () => {
    setIsLoading(true);
    try {
      const data = await twoFactorAuth.generateSecret(userId);
      setSecretData(data);
      setStep('verify');
      toast.success('QR Code gerado', {
        description: 'Escaneie o código com seu autenticador'
      });
    } catch (error) {
      toast.error('Erro ao gerar segredo', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!secretData || !verificationCode) {
      toast.error('Código necessário', {
        description: 'Digite o código do seu autenticador'
      });
      return;
    }

    setIsLoading(true);
    try {
      const isValid = twoFactorAuth.verifyToken(secretData.secret, verificationCode);
      
      if (isValid) {
        const codes = twoFactorAuth.generateBackupCodes();
        setBackupCodes(codes);
        setStep('complete');
        onSetupComplete(true);
        toast.success('2FA ativado!', {
          description: 'Autenticação de dois fatores configurada com sucesso'
        });
      } else {
        toast.error('Código inválido', {
          description: 'Verifique o código e tente novamente'
        });
      }
    } catch (error) {
      toast.error('Erro na verificação', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!', {
      description: 'Texto copiado para a área de transferência'
    });
  };

  const copyAllBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    copyToClipboard(codesText);
  };

  if (step === 'setup') {
    return (
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Configurar Autenticação 2FA</span>
          </CardTitle>
          <p className="text-sm text-slate-400">
            A autenticação de dois fatores é obrigatória para trading ao vivo
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded">
            <h4 className="font-medium text-blue-300 mb-2">Por que 2FA é importante?</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Protege suas operações de trading</li>
              <li>• Previne acesso não autorizado</li>
              <li>• Requerido para funcionalidades avançadas</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-white">Passos para configuração:</h4>
            <ol className="text-sm text-slate-300 space-y-1">
              <li>1. Instale um app autenticador (Google Authenticator, Authy, etc.)</li>
              <li>2. Clique em "Gerar QR Code"</li>
              <li>3. Escaneie o código QR com seu app</li>
              <li>4. Digite o código de 6 dígitos para verificar</li>
            </ol>
          </div>

          <Button
            onClick={generateSecret}
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white"
          >
            {isLoading ? 'Gerando...' : 'Gerar QR Code'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Verificar 2FA</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block">
              <img src={secretData?.qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48" />
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Escaneie este código com seu app autenticador
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Código Manual (caso não consiga escanear)</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={secretData?.secret || ''}
                readOnly
                className="bg-slate-700/50 border-slate-600 text-white font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(secretData?.secret || '')}
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Código de Verificação</Label>
            <Input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Digite o código de 6 dígitos"
              className="bg-slate-700/50 border-slate-600 text-white text-center text-lg font-mono"
              maxLength={6}
            />
          </div>

          <Button
            onClick={verifyAndEnable}
            disabled={isLoading || verificationCode.length !== 6}
            className="w-full bg-green-600 hover:bg-green-500 text-white"
          >
            {isLoading ? 'Verificando...' : 'Verificar e Ativar'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/30 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Check className="w-5 h-5 text-green-500" />
          <span>2FA Configurado!</span>
          <Badge className="bg-green-500 text-white">Ativo</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-green-900/20 border border-green-700/30 rounded">
          <p className="text-green-300 text-sm">
            ✅ Autenticação de dois fatores ativada com sucesso!
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">Códigos de Backup</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={copyAllBackupCodes}
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Todos
            </Button>
          </div>
          
          <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-300 text-sm font-medium">Importante: Guarde estes códigos em local seguro!</p>
                <p className="text-yellow-200 text-xs mt-1">
                  Use estes códigos se perder acesso ao seu autenticador
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="p-2 bg-slate-900/50 border border-slate-700 rounded text-center font-mono text-sm text-white cursor-pointer hover:bg-slate-800/50"
                onClick={() => copyToClipboard(code)}
              >
                {code}
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={() => onSetupComplete(true)}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white"
        >
          Continuar para AutoTrade
        </Button>
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
