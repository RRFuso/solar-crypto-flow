
import React from 'react';
import { Home, BarChart, GitBranch, ArrowLeftRight, MessageCircle, Orbit } from 'lucide-react';
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const DashboardLayout = ({ children, activeTab = 'home', onTabChange }: DashboardLayoutProps) => {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'market-rotation', icon: Orbit, label: 'Crypto Flow' },
    { id: 'performance', icon: BarChart, label: 'Performance' },
    { id: 'narrative-flow', icon: GitBranch, label: 'Narrativas' },
    { id: 'capital-flow', icon: ArrowLeftRight, label: 'Fluxo de Capital' },
    { id: 'social-flow', icon: MessageCircle, label: 'Social Flow' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Folow The Crypto
          </h1>
          
          <nav className="flex items-center space-x-1">
            {menuItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onTabChange?.(id)}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm",
                  activeTab === id 
                    ? "bg-gray-800 text-white" 
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
