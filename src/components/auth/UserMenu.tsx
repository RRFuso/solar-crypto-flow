
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
import { User, LogOut, Database } from 'lucide-react';

interface UserMenuProps {
  openDataPopulationModal: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ openDataPopulationModal }) => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:text-gray-300">
          <User className="h-4 w-4 mr-2" />
          {user.email?.split('@')[0]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
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
  );
};

export default UserMenu;
