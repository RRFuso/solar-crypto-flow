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

  const fetchCredits = async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
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

  const canAccessFlow = (currentFlows: number): boolean => {
    if (!user) return currentFlows < 30; // Free non-registered: 30 flows max
    if (subscriptionPlan !== 'free') return true; // Paid users: unlimited
    if (!credits) return false;
    
    return currentFlows < credits.flows_limit; // Free registered: use flows_limit
  };

  const canAccessAIWatchlist = (): boolean => {
    if (!user) return false; // Non-registered can't access
    return true; // All registered users have access (limited for free)
  };

  const canAccessAIAnalyst = (): boolean => {
    return subscriptionPlan !== 'free'; // Only paid users
  };

  const hasUnlimitedAccess = (): boolean => {
    return subscriptionPlan !== 'free';
  };

  const useCredit = async (): Promise<boolean> => {
    if (!user || !credits) return false;
    if (credits.credits <= 0) return false;

    try {
      const { error } = await supabase
        .from('user_credits')
        .update({ 
          credits: credits.credits - 1,
          flows_used: credits.flows_used + 1 
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchCredits();
      return true;
    } catch (error) {
      console.error('Error using credit:', error);
      toast.error('Erro ao usar crédito');
      return false;
    }
  };

  return {
    credits,
    loading,
    canAccessFlow,
    canAccessAIWatchlist,
    canAccessAIAnalyst,
    hasUnlimitedAccess,
    useCredit,
    refreshCredits: fetchCredits
  };
};