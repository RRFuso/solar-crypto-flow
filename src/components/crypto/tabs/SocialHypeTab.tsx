import React from 'react';
import { useSocialHypeData } from '@/hooks/useSocialHypeData';
import { TrendingUp, TrendingDown, MessageCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparklines, SparklinesLine } from 'react-sparklines';

const SocialHypeTab = () => {
  const { data: cryptoMentions, isLoading } = useSocialHypeData();

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-900/50 p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Mentions (24h)</TableHead>
            <TableHead>Trend</TableHead>
            <TableHead>Sentiment</TableHead>
            <TableHead>Trend Chart</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cryptoMentions?.map((crypto) => (
            <TableRow key={crypto.symbol}>
              <TableCell className="font-medium">{crypto.symbol}</TableCell>
              <TableCell>{crypto.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {crypto.mentions24h}
                </div>
              </TableCell>
              <TableCell>
                {crypto.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </TableCell>
              <TableCell>
                <span className={getSentimentColor(crypto.sentiment)}>
                  {crypto.sentiment}
                </span>
              </TableCell>
              <TableCell>
                <Sparklines data={crypto.mentionsHistory} width={100} height={30}>
                  <SparklinesLine color={crypto.trend === 'up' ? '#22c55e' : '#ef4444'} />
                </Sparklines>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SocialHypeTab;