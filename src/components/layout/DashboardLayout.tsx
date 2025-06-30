
import React from 'react';
import UserMenu from '@/components/auth/UserMenu';
import LoadingScreen from '@/components/ui/loading-screen';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col w-screen min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black m-0 p-0">
      {/* Header */}
      <header className="w-full flex-shrink-0 h-14 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm z-20">
        <div className="h-full px-4 flex justify-between items-center w-full">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-black font-bold text-lg">☀</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Solar Crypto
            </h1>
            <div className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
              AI Powered
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full overflow-y-auto m-0 p-0">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
