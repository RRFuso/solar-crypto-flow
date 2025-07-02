
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CryptoPanel from "@/components/CryptoPanel";
import CapitalFlowPanel from "@/components/capital-flow/CapitalFlowPanel";
import AutoTradePanel from "@/components/autotrade/AutoTradePanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("capital-flow");

  return (
    <DashboardLayout>
      <div className="w-full h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">
          <div className="flex-shrink-0 px-4 pt-3 w-full">
            <TabsList className="grid w-full max-w-xl grid-cols-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 h-10">
              <TabsTrigger 
                value="capital-flow" 
                className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-sm"
              >
                💰 Capital Flow AI
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

          <div className="flex-1 w-full overflow-hidden">
            <TabsContent value="capital-flow" className="h-full m-0 w-full data-[state=active]:block hidden">
              <CapitalFlowPanel />
            </TabsContent>

            <TabsContent value="crypto" className="h-full m-0 w-full data-[state=active]:block hidden">
              <CryptoPanel />
            </TabsContent>

            <TabsContent value="autotrade" className="h-full m-0 w-full data-[state=active]:block hidden">
              <AutoTradePanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
