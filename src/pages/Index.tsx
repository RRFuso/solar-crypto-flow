
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CryptoPanel from "@/components/CryptoPanel";
import CapitalFlowPanel from "@/components/capital-flow/CapitalFlowPanel";
import AutoTradePanel from "@/components/autotrade/AutoTradePanel";
import { PredictiveSignalsPanel } from "@/components/signals/PredictiveSignalsPanel";
import UserMenu from "@/components/auth/UserMenu";

const Index = () => {
  const [activeTab, setActiveTab] = useState("capital-flow");

  return (
    <DashboardLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        {/* Unified Header */}
        <header className="flex-shrink-0 px-4 h-16 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-black font-bold text-lg">☀</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Solar Crypto
            </h1>
            <div className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
              AI Powered
            </div>
          </div>

          <div className="flex-grow flex justify-center">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 h-10">
              <TabsTrigger 
                value="capital-flow" 
                className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-sm"
              >
                💰 Capital Flow
              </TabsTrigger>
              <TabsTrigger 
                value="signals" 
                className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-sm"
              >
                🎯 Sinais AI
              </TabsTrigger>
              <TabsTrigger 
                value="crypto" 
                className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-sm"
              >
                📊 Market Data
              </TabsTrigger>
              <TabsTrigger 
                value="autotrade" 
                className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-sm"
              >
                🤖 AutoTrade
              </TabsTrigger>
            </TabsList>
          </div>

          <UserMenu />
        </header>

        <div className="flex-1 w-full overflow-hidden">
          <TabsContent value="capital-flow" className="h-full w-full">
            <CapitalFlowPanel />
          </TabsContent>
          <TabsContent value="signals" className="h-full w-full p-6">
            <PredictiveSignalsPanel />
          </TabsContent>
          <TabsContent value="crypto" className="h-full w-full">
            <CryptoPanel />
          </TabsContent>
          <TabsContent value="autotrade" className="h-full w-full">
            <AutoTradePanel />
          </TabsContent>
        </div>
      </Tabs>
    </DashboardLayout>
  );
};

export default Index;
