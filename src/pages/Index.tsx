import React from 'react';
import CryptoPanel from '../components/CryptoPanel';
import RiskManagementPanel from '../components/RiskManagementPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Painel de Criptomoedas</h1>
        <Tabs defaultValue="market" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="market">Mercado</TabsTrigger>
            <TabsTrigger value="risk">Gestão de Risco</TabsTrigger>
          </TabsList>
          <TabsContent value="market">
            <CryptoPanel />
          </TabsContent>
          <TabsContent value="risk">
            <RiskManagementPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;