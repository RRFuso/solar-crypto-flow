import React from 'react';
import { Crown, Zap, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SubscriptionTier } from '@/lib/freemium/tierConfig';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const tierStyles: Record<SubscriptionTier, { 
  icon: React.ElementType; 
  className: string;
  label: string;
}> = {
  free: {
    icon: User,
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
    label: 'Free',
  },
  pro: {
    icon: Zap,
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    label: 'Pro',
  },
  premium: {
    icon: Crown,
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    label: 'Premium',
  },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'md',
  showIcon = true,
}) => {
  const style = tierStyles[tier];
  const Icon = style.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium inline-flex items-center gap-1',
        style.className,
        sizeStyles[size]
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {style.label}
    </Badge>
  );
};
