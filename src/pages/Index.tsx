
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CryptoPanel from "@/components/CryptoPanel";
import NarrativeFlowPanel from "@/components/NarrativeFlowPanel";
import FearGreedIndicator from "@/components/FearGreedIndicator";
import CapitalFlowPanel from "@/components/capital-flow/CapitalFlowPanel";
import MarketRotationIndicator from "@/components/home/MarketRotationIndicator";
import CryptoOcean from "@/components/CryptoOcean";
import RiskManagementPanel from "@/components/RiskManagementPanel";
import SolarCryptoPanel from "@/components/solar-crypto/SolarCryptoPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index: React.FC = () => {
  return (
    <DashboardLayout>
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="flows">Fluxos</TabsTrigger>
            <TabsTrigger value="risk">Risco</TabsTrigger>
            <TabsTrigger value="solar">SolarCripto</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1">
              <MarketRotationIndicator />
              <CryptoOcean />
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4">
            <div className="grid gap-4 grid-cols-1">
              <CryptoPanel />
              <FearGreedIndicator />
            </div>
          </TabsContent>

          <TabsContent value="flows" className="space-y-4">
            <div className="grid gap-4 grid-cols-1">
              <CapitalFlowPanel />
              <NarrativeFlowPanel />
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid gap-4 grid-cols-1">
              <RiskManagementPanel />
            </div>
          </TabsContent>
          
          <TabsContent value="solar" className="space-y-4">
            <div className="grid gap-4 grid-cols-1">
              <SolarCryptoPanel />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
};

export default Index;
