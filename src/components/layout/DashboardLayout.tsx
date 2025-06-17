import React from 'react';
import { Home, BarChart, MessageCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import UserMenu from '@/components/auth/UserMenu';
import LoadingScreen from '@/components/ui/loading-screen';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const DashboardLayout = ({ children, activeTab = 'home', onTabChange }: DashboardLayoutProps) => {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'performance', icon: BarChart, label: 'Performance' },
    { id: 'social-flow', icon: MessageCircle, label: 'Social Flow' },
  ];
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Top Navigation Bar */}
      <header className="bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            SolarCrypto
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
    <div className="min-h-screen min-w-screen w-full h-full bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header with Solar Crypto branding */}
      <header className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm h-16 flex-shrink-0">
        <div className="h-full px-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-lg">☀</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Solar Crypto
            </h1>
          </div>
          <UserMenu />
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">Add commentMore actions
        <div className="h-full">
          {children}
        </div>

      {/* Main content area - removed overflow-hidden to allow internal scrolling */}
      <main className="h-[calc(100vh-4rem)] p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
