import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type InteractionType = 'view' | 'click' | 'favorite' | 'trade' | 'alert';

interface TrackInteractionParams {
  type: InteractionType;
  symbol?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export const useUserInteractions = () => {
  const { user } = useAuth();

  const trackInteraction = useMutation({
    mutationFn: async ({ type, symbol, category, metadata }: TrackInteractionParams) => {
      if (!user) return;

      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          interaction_type: type,
          symbol,
          category,
          metadata: metadata || {},
        });

      if (error) {
        console.error('Error tracking interaction:', error);
      }
    },
  });

  return {
    trackInteraction: trackInteraction.mutate,
  };
};