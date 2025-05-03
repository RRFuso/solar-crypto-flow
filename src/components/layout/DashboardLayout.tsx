
import React from "react";
import { Bitcoin, LineChart, Zap, User, Waves, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: <Bitcoin className="w-5 h-5" />,
    },
    {
      id: "performance",
      label: "Performance",
      icon: <LineChart className="w-5 h-5" />,
    },
    {
      id: "social-flow",
      label: "Social Flow",
      icon: <Waves className="w-5 h-5" />,
    },
    {
      id: "solar-crypto",
      label: "SolarCripto AI",
      icon: <Brain className="w-5 h-5" />,
    },
    {
      id: "account",
      label: "Conta",
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-dark-gradient text-white overflow-hidden">
      {/* Header with logo */}
      <header className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-xl font-bold">CriptoPainel.ai</span>
          </div>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <aside className="w-20 border-r border-white/10 flex flex-col items-center py-4">
          <TooltipProvider>
            <nav className="flex flex-col items-center space-y-4">
              {tabs.map((tab) => (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === tab.id ? "secondary" : "ghost"}
                      size="icon"
                      className={`w-12 h-12 ${
                        activeTab === tab.id
                          ? "bg-blue-900/30 text-blue-400 hover:text-blue-300"
                          : "hover:bg-gray-800/50 text-gray-400 hover:text-gray-300"
                      }`}
                      onClick={() => onTabChange(tab.id)}
                    >
                      {tab.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{tab.label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </TooltipProvider>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6 bg-crypto-dark">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
