
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CryptoPanel from "@/components/CryptoPanel";
import CapitalFlowPanel from "@/components/capital-flow/CapitalFlowPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("capital-flow");

  return (
    <DashboardLayout>
      <div className="h-full w-full flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">
          <div className="flex-shrink-0 px-6 pt-4 w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
              <TabsTrigger 
                value="capital-flow" 
                className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black"
              >
                💰 Capital Flow AI
              </TabsTrigger>
              <TabsTrigger 
                value="crypto" 
                className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black"
              >
                📊 Market Data
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 w-full overflow-hidden">
            <TabsContent value="capital-flow" className="h-full w-full m-0">
              <CapitalFlowPanel />
            </TabsContent>

            <TabsContent value="crypto" className="h-full w-full m-0">
              <CryptoPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
