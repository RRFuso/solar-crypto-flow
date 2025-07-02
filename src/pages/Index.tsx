
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
          {/* Responsive Tab Navigation */}
          <div className="flex-shrink-0 p-3 sm:px-6 sm:pt-4 w-full">
            <div className="responsive-wrapper justify-center sm:justify-start">
              <TabsList className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 w-full max-w-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                <TabsTrigger 
                  value="capital-flow" 
                  className="text-white font-medium text-sm sm:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black transition-all duration-200 rounded-lg"
                >
                  <span className="hidden sm:inline">💰 Capital Flow AI</span>
                  <span className="sm:hidden">💰 Capital AI</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="crypto" 
                  className="text-white font-medium text-sm sm:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black transition-all duration-200 rounded-lg"
                >
                  <span className="hidden sm:inline">📊 Market Data</span>
                  <span className="sm:hidden">📊 Market</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="autotrade" 
                  className="text-white font-medium text-sm sm:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black transition-all duration-200 rounded-lg"
                >
                  <span className="hidden sm:inline">🤖 AutoTrade</span>
                  <span className="sm:hidden">🤖 Auto</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content - Full space usage */}
          <div className="flex-1 w-full overflow-hidden">
            <TabsContent value="capital-flow" className="h-full m-0 w-full data-[state=active]:flex">
              <CapitalFlowPanel />
            </TabsContent>

            <TabsContent value="crypto" className="h-full m-0 w-full data-[state=active]:flex">
              <CryptoPanel />
            </TabsContent>

            <TabsContent value="autotrade" className="h-full m-0 w-full data-[state=active]:flex">
              <AutoTradePanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
