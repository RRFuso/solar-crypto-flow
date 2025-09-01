
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
    <div className="flex flex-col w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full overflow-y-auto">
        {children}
      </main>
      <footer className="flex-shrink-0 px-4 h-10 flex items-center justify-center border-t border-slate-700/50">
        <p className="text-xs text-slate-400">
          A Solar Crypto fornece dados, visualizações e insights com fins informativos/educacionais. Não é aconselhamento financeiro ou recomendação de compra/venda. Faça sua própria pesquisa (DYOR).
        </p>
      </footer>
    </div>
  );
};

export default DashboardLayout;
