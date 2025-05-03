
import { useState } from "react";
import CryptoPanel from "@/components/CryptoPanel";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SocialFlowPanel from "@/components/social-flow/SocialFlowPanel";
import HomePanel from "@/components/home/HomePanel";
import { SolarCryptoFlowEngine } from "@/components/capital-flow";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePanel />;
      case "performance":
        return <CryptoPanel />;
      case "social-flow":
        return <SocialFlowPanel />;
      case "solar-crypto":
        return <SolarCryptoFlowEngine />;
      default:
        return (
          <div className="text-center text-gray-400 mt-20">
            <h2 className="text-2xl font-bold mb-4">Em breve</h2>
            <p>Esta seção está em desenvolvimento.</p>
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
