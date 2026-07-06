import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Database, CreditCard, Settings, Activity, Bell } from 'lucide-react';
import { CreditDisplay } from '@/components/credits/CreditDisplay';
import { useUserRole } from '@/hooks/useUserRole';
import { UserProfileDialog } from '@/components/user-profile/UserProfileDialog';
import AlertPreferencesPanel from '@/components/alerts/AlertPreferencesPanel';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface UserMenuProps {
  openDataPopulationModal: () => void;
  openSubscriptionModal: () => void;
  openAuthModal: () => void;
  openMetricsDashboard?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  openDataPopulationModal, 
  openSubscriptionModal,
  openAuthModal,
  openMetricsDashboard
}) => {
  const { user, signOut, subscriptionPlan } = useAuth();
  const { isAdmin } = useUserRole();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);

  return (
    <>
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
                onClick={() => setIsProfileDialogOpen(true)}
                className="hover:bg-gray-700 cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                Perfil & IA
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsAlertPanelOpen(true)}
                className="hover:bg-gray-700 cursor-pointer"
              >
                <Bell className="h-4 w-4 mr-2" />
                Alertas & Telegram
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
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
              {isAdmin && (
                <>
                  <DropdownMenuItem
                    onClick={openMetricsDashboard}
                    className="hover:bg-gray-700 cursor-pointer"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    API Metrics
                  </DropdownMenuItem>
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

      <UserProfileDialog 
        open={isProfileDialogOpen} 
        onOpenChange={setIsProfileDialogOpen} 
      />

      <Dialog open={isAlertPanelOpen} onOpenChange={setIsAlertPanelOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertPreferencesPanel onClose={() => setIsAlertPanelOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserMenu;