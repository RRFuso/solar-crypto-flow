
import { useState } from "react";
import CryptoPanel from "@/components/CryptoPanel";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CapitalFlowPanel from "@/components/CapitalFlowPanel";
import FearGreedIndicator from "@/components/FearGreedIndicator";
import NarrativeFlowPanel from "@/components/NarrativeFlowPanel";
import SocialFlowPanel from "@/components/social-flow/SocialFlowPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-8">
            <FearGreedIndicator />
          </div>
        );
      case "performance":
        return <CryptoPanel />;
      case "narrative-flow":
        return <NarrativeFlowPanel />;
      case "capital-flow":
        return <CapitalFlowPanel />;
      case "social-flow":
        return <SocialFlowPanel />;
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
