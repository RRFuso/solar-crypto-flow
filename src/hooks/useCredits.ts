import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserCredits {
  credits: number;
  flows_used: number;
  flows_limit: number;
}

export const useCredits = () => {
  const { user, subscriptionPlan } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchCredits = async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    try {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      const userIsAdmin = !!roleData;
      setIsAdmin(userIsAdmin);

      const { data, error } = await supabase
        .from('user_credits')
        .select('credits, flows_used, flows_limit')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCredits(data);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  const canAccessFlow = (requestedFlows: number): boolean => {
    if (isAdmin) return true; // Admins: unlimited
    if (subscriptionPlan !== 'free') return true; // Paid users: unlimited
    if (!user) return requestedFlows <= 30; // Free non-registered: 30 flows max
    if (!credits) return requestedFlows <= 30;
    
    return requestedFlows <= credits.flows_limit; // Free registered: use flows_limit
  };

  const getMaxFlows = (): number => {
    if (isAdmin || subscriptionPlan !== 'free') return 2000; // Admins and paid users: unlimited
    if (!user) return 30; // Free non-registered: 30 flows max
    if (!credits) return 30;
    return credits.flows_limit; // Free registered: use flows_limit (60)
  };

  const canAccessAIWatchlist = (): boolean => {
    if (isAdmin) return true; // Admins: full access
    if (!user) return false; // Non-registered can't access
    return true; // All registered users have access (limited for free)
  };

  const canAccessAIAnalyst = (): boolean => {
    if (isAdmin) return true; // Admins: full access
    return subscriptionPlan !== 'free'; // Only paid users
  };

  const hasUnlimitedAccess = (): boolean => {
    return isAdmin || subscriptionPlan !== 'free';
  };

  const useCredit = async (): Promise<boolean> => {
    if (!user) return false;

    // Admins and paid users don't consume credits
    if (isAdmin || subscriptionPlan !== 'free') return true;

    try {
      const { data, error } = await supabase.rpc('consume_credit');
      if (error) throw error;

      if (data) {
        await fetchCredits();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error using credit:', error);
      toast.error('Erro ao usar crédito');
      return false;
    }
  };

  return {
    credits,
    loading,
    isAdmin,
    canAccessFlow,
    getMaxFlows,
    canAccessAIWatchlist,
    canAccessAIAnalyst,
    hasUnlimitedAccess,
    useCredit,
    refreshCredits: fetchCredits
  };
};