
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
    </div>
  );
};

export default DashboardLayout;
