
import { useState } from "react";
import CryptoPanel from "@/components/CryptoPanel";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CapitalFlowPanel from "@/components/CapitalFlowPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <CapitalFlowPanel />;
      case "performance":
        return <CryptoPanel />;
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
