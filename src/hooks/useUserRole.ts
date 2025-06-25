
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'moderator' | 'user';

interface UserRoleData {
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isModerator: boolean;
  refreshRole: () => Promise<void>;
}

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        setError(roleError.message);
        setRole('user'); // Default to user role on error
        return;
      }

      setRole(data?.role || 'user');
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRole('user'); // Default to user role on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'moderator': 2,
      'admin': 3
    };
    
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const refreshRole = async () => {
    await fetchUserRole();
  };

  return {
    role,
    loading,
    error,
    hasRole,
    isAdmin: hasRole('admin'),
    isModerator: hasRole('moderator'),
    refreshRole
  };
};
