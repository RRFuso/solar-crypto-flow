import React from 'react';
import { Activity, Clock, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTierAccess } from '@/hooks/useTierAccess';
import { cn } from '@/lib/utils';

interface ApiUsageMeterProps {
  compact?: boolean;
}

export const ApiUsageMeter: React.FC<ApiUsageMeterProps> = ({ compact = false }) => {
  const { getApiUsageStats, tier, tierName } = useTierAccess();
  const stats = getApiUsageStats();

  const getProgressColor = (used: number, limit: number): string => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-primary';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {stats.minute.remaining}/{stats.minute.limit}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {stats.hour.remaining}/{stats.hour.limit}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Uso de API</span>
          <span className="text-xs text-muted-foreground">{tierName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Minute usage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>Por minuto</span>
            </div>
            <span className="font-mono">
              {stats.minute.used}/{stats.minute.limit}
            </span>
          </div>
          <Progress 
            value={(stats.minute.used / stats.minute.limit) * 100} 
            className="h-1.5"
          />
        </div>

        {/* Hour usage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Por hora</span>
            </div>
            <span className="font-mono">
              {stats.hour.used}/{stats.hour.limit}
            </span>
          </div>
          <Progress 
            value={(stats.hour.used / stats.hour.limit) * 100} 
            className="h-1.5"
          />
        </div>

        {/* Day usage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Por dia</span>
            </div>
            <span className="font-mono">
              {stats.day.used}/{stats.day.limit}
            </span>
          </div>
          <Progress 
            value={(stats.day.used / stats.day.limit) * 100} 
            className="h-1.5"
          />
        </div>
      </CardContent>
    </Card>
  );
};
