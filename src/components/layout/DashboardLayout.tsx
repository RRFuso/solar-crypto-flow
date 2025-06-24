
import React from 'react';
import UserMenu from '@/components/auth/UserMenu';
import LoadingScreen from '@/components/ui/loading-screen';
import Sidebar from '@/components/sidebar/Sidebar'; // ajuste o caminho conforme seu projeto

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
    <div className="flex w-screen h-screen overflow-hidden bg-black text-white">
      {/* Sidebar fixa à esquerda */}
      <aside className="w-[260px] bg-gray-900 border-r border-gray-800 h-full">
        <Sidebar />
      </aside>

      {/* Área principal com header e conteúdo */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
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

        {/* Conteúdo (ex: abas) */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
