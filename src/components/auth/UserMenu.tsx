import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Database, CreditCard } from 'lucide-react';
import { CreditDisplay } from '@/components/credits/CreditDisplay';

interface UserMenuProps {
  openDataPopulationModal: () => void;
  openSubscriptionModal: () => void;
  openAuthModal: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  openDataPopulationModal, 
  openSubscriptionModal,
  openAuthModal 
}) => {
  const { user, signOut, subscriptionPlan } = useAuth();

  return (
    <div className="flex items-center gap-3 w-full justify-between">
      <CreditDisplay onUpgradeClick={user ? openSubscriptionModal : openAuthModal} />
      
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:text-gray-300">
              <User className="h-4 w-4 mr-2" />
              {user.email?.split('@')[0]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
            <DropdownMenuItem
              onClick={openSubscriptionModal}
              className="hover:bg-gray-700 cursor-pointer"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span>Assinatura</span>
                <span className="text-xs text-gray-400">{subscriptionPlan.toUpperCase()}</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            {user.email === 'prof.rafaelfuso@gmail.com' && (
              <>
                <DropdownMenuItem
                  onClick={openDataPopulationModal}
                  className="hover:bg-gray-700 cursor-pointer"
                >
                  <Database className="h-4 w-4 mr-2" />
                  População de Dados
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
              </>
            )}
            <DropdownMenuItem 
              onClick={signOut}
              className="hover:bg-gray-700 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          size="sm"
          onClick={openAuthModal}
          className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-black font-semibold min-w-[100px]"
        >
          Entrar
        </Button>
      )}
    </div>
  );
};

export default UserMenu;