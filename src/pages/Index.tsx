
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CryptoPanel from "@/components/CryptoPanel";
import CapitalFlowPanel from "@/components/capital-flow/CapitalFlowPanel";

import Auth from "@/components/auth/Auth";
import UserMenu from "@/components/auth/UserMenu";
import { MarketContextAndAIPanel } from '@/components/market-context/MarketContextAndAIPanel';
import { OnChainDataProvider } from '@/contexts/OnChainDataContext';
import { useAuth } from "@/contexts/AuthContext";
import DataPopulationPanel from "@/components/admin/DataPopulationPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const [activeTab, setActiveTab] = useState("capital-flow");
  const [isDataPopulationModalOpen, setIsDataPopulationModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <OnChainDataProvider>
      <DashboardLayout>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          {/* Unified Header */}
          <header className="flex-shrink-0 px-4 h-16 flex items-center justify-between border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <img src="/SOLCRY.png" alt="SOLCRY Logo" className="w-8 h-8" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                SOLCRY
              </h1>
              <div className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
                Oracle
              </div>
            </div>

            <div className="flex-grow flex justify-center">
              <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 h-10">
                <TabsTrigger 
                  value="market-context" 
                  className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-xs"
                >
                  🧠 Market Context & AI
                </TabsTrigger>
                <TabsTrigger 
                  value="capital-flow" 
                  className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-xs"
                >
                  💰 Capital Flow
                </TabsTrigger>
                <TabsTrigger 
                  value="crypto" 
                  className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-xs"
                >
                  📊 Market Data
                </TabsTrigger>
              </TabsList>
            </div>

            {user ? <UserMenu openDataPopulationModal={() => setIsDataPopulationModalOpen(true)} /> : <Auth />}
          </header>

          <div className="flex-1 w-full overflow-hidden">
            <TabsContent value="market-context" className="h-full w-full">
              <MarketContextAndAIPanel />
            </TabsContent>
            <TabsContent value="capital-flow" className="h-full w-full">
              <CapitalFlowPanel />
            </TabsContent>
            <TabsContent value="crypto" className="h-full w-full">
              <CryptoPanel />
            </TabsContent>
          </div>
        </Tabs>
        
        {user && user.email === 'prof.rafaelfuso@gmail.com' && (
          <Dialog open={isDataPopulationModalOpen} onOpenChange={setIsDataPopulationModalOpen}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Data Population</DialogTitle>
              </DialogHeader>
              <DataPopulationPanel />
            </DialogContent>
          </Dialog>
        )}
      </DashboardLayout>
    </OnChainDataProvider>
  );
};

export default Index;
