import React from 'react';
import { Home, BarChart, Wallet, Search, TrendingUp, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const DashboardLayout = ({ children, activeTab = 'home', onTabChange }: DashboardLayoutProps) => {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'performance', icon: TrendingUp, label: 'Performance' },
    { id: 'portfolio', icon: Wallet, label: 'Portfolio' },
    { id: 'market', icon: BarChart, label: 'Market' },
    { id: 'signals', icon: Activity, label: 'Signals' },
    { id: 'search', icon: Search, label: 'Search' },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <aside className="w-64 border-r border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-8">Crypto Hub</h1>
          <nav className="space-y-2">
            {menuItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onTabChange?.(id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  activeTab === id 
                    ? "bg-gray-800 text-white" 
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;