import React, { useState } from 'react';
import { Button } from './button';
import { RefreshCw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const PopulateCryptoButton: React.FC = () => {
  const [isPopulating, setIsPopulating] = useState(false);
  const { toast } = useToast();

  const handlePopulate = async () => {
    setIsPopulating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('populate-cryptocurrencies');
      
      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: 'Sucesso!',
          description: `${data.totalPopulated} criptomoedas foram populadas na base de dados.`,
          variant: 'default',
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao popular criptomoedas:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao popular a base de dados com as criptomoedas.',
        variant: 'destructive',
      });
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <Button
      onClick={handlePopulate}
      disabled={isPopulating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isPopulating ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isPopulating ? 'Populando...' : 'Popular 500 Cryptos'}
    </Button>
  );
};