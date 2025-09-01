import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDailyInsights, DailyInsight } from '@/hooks/useDailyInsights';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp, TrendingDown, Zap, BarChart, Link, MessageSquare } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const InsightItem = ({ insight }: { insight: DailyInsight }) => {
  const getCategoryProperties = () => {
    switch (insight.category) {
      case 'On-Chain':
        return { color: 'text-blue-400', icon: <Link className="h-4 w-4" /> };
      case 'Fluxo de Capital':
        return { color: 'text-green-400', icon: <BarChart className="h-4 w-4" /> };
      case 'Narrativa':
        return { color: 'text-purple-400', icon: <MessageSquare className="h-4 w-4" /> };
      case 'Técnico':
        return { color: 'text-orange-400', icon: <TrendingUp className="h-4 w-4" /> };
      case 'Social':
        return { color: 'text-sky-400', icon: <Zap className="h-4 w-4" /> };
      default:
        return { color: 'text-slate-400', icon: <Zap className="h-4 w-4" /> };
    }
  };

  const getSentimentProperties = () => {
    switch (insight.sentiment) {
      case 'Bullish':
        return { color: 'text-green-400', icon: <TrendingUp className="h-4 w-4" /> };
      case 'Bearish':
        return { color: 'text-red-400', icon: <TrendingDown className="h-4 w-4" /> };
      default:
        return { color: 'text-yellow-400', icon: <Zap className="h-4 w-4" /> };
    }
  };

  const { color: categoryColor, icon: categoryIcon } = getCategoryProperties();
  const { color: sentimentColor, icon: sentimentIcon } = getSentimentProperties();

  return (
    <AccordionItem value={insight.id} className="border-b border-slate-700/50">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3 text-left">
            <div className={categoryColor}>{categoryIcon}</div>
            <span className="font-semibold text-slate-200">{insight.title}</span>
          </div>
          <div className={`flex items-center gap-2 ${sentimentColor}`}>
            {sentimentIcon}
            <span className="font-medium">{insight.sentiment}</span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4 space-y-3">
        <p className="text-slate-400">{insight.description}</p>
        <div className="flex flex-wrap gap-2">
          {insight.evidence.map((ev, i) => (
            <Badge key={i} variant="outline" className="text-xs font-mono">
              {ev.metric}: <span className="font-bold ml-1.5">{ev.value}</span>
              <span className="text-slate-500 ml-2">({ev.source})</span>
            </Badge>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export const DailyInsights: React.FC = () => {
  const { data: insights, isLoading, isError, error } = useDailyInsights();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights Diários Relevantes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {isError && (
          <div className="text-red-500 text-sm">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Erro ao carregar insights: {error.message}
          </div>
        )}
        {insights && (
          <Accordion type="single" collapsible className="w-full">
            {insights.map(insight => (
              <InsightItem key={insight.id} insight={insight} />
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyInsights;
