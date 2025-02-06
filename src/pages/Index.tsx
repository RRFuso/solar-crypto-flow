import { useState } from "react";
import CryptoPanel from "@/components/CryptoPanel";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const trendingProjects = [
  { name: "Ragnarok: Monster World", chain: "Ronin", uaw: "+15,403.45%", value: 4496 },
];

const tokenGrowth = [
  { name: "Zygo The Frog", symbol: "ZYGO", price: "$0.000326", growth: "+360.9%" },
];

const chains = [
  { name: "Gravity", uaw: "+204.78%", value: 14090 },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("performance");
  const [dashboardTab, setDashboardTab] = useState("trending");

  const renderContent = () => {
    switch (activeTab) {
      case "performance":
      case "market":
        return <CryptoPanel />;
      case "dashboard":
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">The World's Dapp Store</h1>
            <p className="text-gray-400 mb-6">
              Discover and track the best dapps, explore top blockchain games, and stay ahead with the latest Web3 trends.
            </p>
            <Tabs defaultValue="trending" value={dashboardTab} onValueChange={setDashboardTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="tokens">Tokens</TabsTrigger>
                <TabsTrigger value="chains">Chains</TabsTrigger>
              </TabsList>
              <TabsContent value="trending">
                <Card>
                  <CardContent>
                    <h2 className="text-xl font-semibold">Trending Projects</h2>
                    {trendingProjects.map((project) => (
                      <div key={project.name} className="mt-2">
                        <span className="font-bold">{project.name}</span> ({project.chain}) - {project.uaw} ({project.value})
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="tokens">
                <Card>
                  <CardContent>
                    <h2 className="text-xl font-semibold">Top Token Growth</h2>
                    {tokenGrowth.map((token) => (
                      <div key={token.name} className="mt-2">
                        <span className="font-bold">{token.name}</span> ({token.symbol}) - {token.price} ({token.growth})
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="chains">
                <Card>
                  <CardContent>
                    <h2 className="text-xl font-semibold">Top Chains</h2>
                    {chains.map((chain) => (
                      <div key={chain.name} className="mt-2">
                        <span className="font-bold">{chain.name}</span> - {chain.uaw} ({chain.value})
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );
      default:
        return (
          <div className="text-center text-gray-400 mt-20">
            <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
            <p>This section is under development.</p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;