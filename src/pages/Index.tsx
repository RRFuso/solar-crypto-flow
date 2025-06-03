
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CryptoPanel from "@/components/CryptoPanel";
import CapitalFlowPanel from "@/components/capital-flow/CapitalFlowPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("capital-flow");

  return (
    <DashboardLayout>
      <div className="h-full w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 backdrop-blur-sm">
            <TabsTrigger value="capital-flow" className="text-white font-medium">
              💰 Capital Flow
            </TabsTrigger>
            <TabsTrigger value="crypto" className="text-white font-medium">
              📊 Crypto
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-4">
            <TabsContent value="capital-flow" className="h-full">
              <CapitalFlowPanel />
            </TabsContent>

            <TabsContent value="crypto" className="h-full">
              <CryptoPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
