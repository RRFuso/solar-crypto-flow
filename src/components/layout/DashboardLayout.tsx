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
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black text-white">
      {/* Sidebar substituta (simples) */}
      <aside className="fixed left-0 top-0 w-[260px] h-full bg-gray-900 border-r border-gray-800 p-4 z-10">
        <div className="text-lg font-bold text-white mb-4">☀ Solar Crypto</div>
        <nav className="space-y-2 text-sm text-gray-300">
          <div className="hover:text-white cursor-pointer">💰 Capital Flow</div>
          <div className="hover:text-white cursor-pointer">📊 Market Data</div>
          <div className="hover:text-white cursor-pointer">🤖 AutoTrade</div>
        </nav>
      </aside>

      {/* Painel principal */}
      <div className="fixed left-[260px] top-0 right-0 bottom-0 flex flex-col h-full overflow-hidden">
        {/* Header fixo */}
        <header className="h-14 flex-shrink-0 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm z-20 flex items-center justify-between px-4">
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
        </header>

        {/* Conteúdo interno (tabs, gráficos, etc.) */}
        <main className="flex-1 h-full overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

