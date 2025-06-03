
import React from 'react';
import UserMenu from '@/components/auth/UserMenu';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header with user menu */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white">
              🧠 Crypto AI Dashboard
            </h1>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-6">
        {children}
      </main>

      {/* Security notice footer */}
      <footer className="border-t border-gray-800 bg-gray-900/30 backdrop-blur-sm mt-8">
        <div className="container mx-auto px-4 py-3 text-center text-xs text-gray-400">
          🔒 Secured with Row Level Security (RLS) • All data transmissions encrypted
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
