
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CryptoOcean from "@/components/CryptoOcean";
import CryptoPanel from "@/components/CryptoPanel";
import CapitalFlowPanel from "@/components/capital-flow/CapitalFlowPanel";
import NarrativeFlowPanel from "@/components/NarrativeFlowPanel";
import SocialFlowPanel from "@/components/social-flow/SocialFlowPanel";
import FearGreedIndicator from "@/components/FearGreedIndicator";
import RiskManagementPanel from "@/components/RiskManagementPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("crypto");

  // Mock crypto data for the ocean component
  const mockCryptos = [
    { id: "BTC", name: "Bitcoin", performance: 5.2 },
    { id: "ETH", name: "Ethereum", performance: 3.8 },
    { id: "ADA", name: "Cardano", performance: 12.5 },
    { id: "SOL", name: "Solana", performance: -2.1 },
    { id: "AVAX", name: "Avalanche", performance: 8.7 },
    { id: "DOT", name: "Polkadot", performance: 1.4 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800">
            <TabsTrigger value="crypto" className="text-white">
              📊 Crypto
            </TabsTrigger>
            <TabsTrigger value="capital-flow" className="text-white">
              💰 Capital Flow
            </TabsTrigger>
            <TabsTrigger value="narrative" className="text-white">
              📖 Narratives
            </TabsTrigger>
            <TabsTrigger value="social" className="text-white">
              🗣️ Social
            </TabsTrigger>
            <TabsTrigger value="fear-greed" className="text-white">
              😨 Fear & Greed
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-white">
              ⚠️ Risk
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="crypto" className="space-y-6">
              <CryptoPanel />
              <CryptoOcean cryptos={mockCryptos} />
            </TabsContent>

            <TabsContent value="capital-flow" className="space-y-6">
              <CapitalFlowPanel />
            </TabsContent>

            <TabsContent value="narrative" className="space-y-6">
              <NarrativeFlowPanel />
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <SocialFlowPanel />
            </TabsContent>

            <TabsContent value="fear-greed" className="space-y-6">
              <FearGreedIndicator />
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              <RiskManagementPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
