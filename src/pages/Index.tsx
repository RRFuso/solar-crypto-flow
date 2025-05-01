
import { useState } from "react";
import CryptoPanel from "@/components/CryptoPanel";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SocialFlowPanel from "@/components/social-flow/SocialFlowPanel";
import HomePanel from "@/components/home/HomePanel";

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
      default:
        return <HomePanel />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;
